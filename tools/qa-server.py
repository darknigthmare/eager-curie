#!/usr/bin/env python3
"""Real local HTTP checks for public exports and private-path exclusion.

The Python GameHandler is exercised on an ephemeral loopback port. A second
isolated root contains deliberately present private fixtures: a 404 must not
merely mean that the private file happened to be absent. PowerShell policy is
checked statically; this is not a native Windows execution claim.
"""
import argparse
from contextlib import contextmanager
from functools import partial
import hashlib
import http.client
from http.server import ThreadingHTTPServer
import importlib.util
import json
from pathlib import Path
import re
import shutil
import tempfile
import threading


ROOT = Path(__file__).resolve().parents[1]


def digest(value):
    return hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.output and args.output.exists():
        raise SystemExit('Refusing to overwrite previous HTTP evidence')
    if args.output:
        args.output.mkdir(parents=True)
    spec = importlib.util.spec_from_file_location('hive_serve_qa', ROOT / 'tools/serve.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    report = {'scope': __doc__, 'complete': False, 'requests': [], 'windows': {},
              'source': {name: digest((ROOT / name).read_bytes()) for name in
                         ['tools/serve.py', 'server.ps1', 'tools/qa-server.py']}}

    def save():
        if args.output:
            (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')

    class QuietHandler(module.GameHandler):
        def log_message(self, *_args):
            pass

    @contextmanager
    def server(root):
        previous = module.ROOT
        module.ROOT = root
        instance = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
        thread = threading.Thread(target=instance.serve_forever, daemon=True)
        thread.start()
        try:
            yield instance.server_address[1]
        finally:
            instance.shutdown()
            instance.server_close()
            thread.join(timeout=5)
            module.ROOT = previous

    def request(port, name, url, expected, method='GET', expected_bytes=None):
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
        try:
            connection.request(method, url)
            response = connection.getresponse()
            body = response.read()
            row = {'case': name, 'method': method, 'path': url, 'status': response.status,
                   'expectedStatus': expected, 'sha256': digest(body),
                   'contentType': response.getheader('Content-Type'), 'passed': False}
            report['requests'].append(row)
            assert response.status == expected, row
            assert response.getheader('X-Content-Type-Options') == 'nosniff', row
            assert response.getheader('Content-Security-Policy'), row
            if expected_bytes is not None:
                row['expectedSha256'] = digest(expected_bytes)
                if method == 'HEAD':
                    assert not body and int(response.getheader('Content-Length')) == len(expected_bytes), row
                else:
                    assert body == expected_bytes, row
            if expected == 200 and url.startswith('/data/'):
                assert 'application/json' in row['contentType'], row
            row['passed'] = True
            save()
        finally:
            connection.close()

    try:
        paths = sorted(module.PUBLIC_REFERENCE_PATHS)
        assert len(paths) == 3
        with server(ROOT) as port:
            for url in paths:
                expected = (ROOT / url.lstrip('/')).read_bytes()
                request(port, 'real-source-export', url, 200, expected_bytes=expected)
                request(port, 'real-source-export-head', url, 200, 'HEAD', expected)
            request(port, 'cache-query', paths[0] + '?v=qa', 200,
                    expected_bytes=(ROOT / paths[0].lstrip('/')).read_bytes())
            request(port, 'game-entry', '/', 200, expected_bytes=(ROOT / 'index.html').read_bytes())
            request(port, 'reference-runtime', '/src/alien-base-library.js?v=qa', 200,
                    expected_bytes=(ROOT / 'src/alien-base-library.js').read_bytes())
            for url in ['/.git/config', '/.tools/', '/tools/qa-mortar-native-probe.js',
                        '/docs/ALIEN_BASE_SYNC.md', '/data/', '/data', '/src/', '/assets/',
                        '/data/private.json', '/data/research/hive-ascension.v2.json',
                        '/data/alien-base.snapshot.v2.json/']:
                request(port, 'real-private-or-listing', url, 404)

        with tempfile.TemporaryDirectory(prefix='hive-http-private-') as temporary:
            outer = Path(temporary)
            fixture = outer / 'site'
            fixture.mkdir()
            private_paths = ['.git/config', '.tools/private.json', 'tools/private.js',
                             'docs/private.json', 'data/private.json',
                             'data/research/hive-ascension.v2.json', 'src/.private.json', 'secret.json']
            for relative in private_paths:
                target = fixture / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('PRIVATE TEST FIXTURE: ' + relative)
            (fixture / 'assets').mkdir()
            outside = outer / 'outside.json'
            outside.write_text('PRIVATE OUTSIDE TEST FIXTURE')
            (fixture / 'assets/private-link.json').symlink_to(fixture / '.tools/private.json')
            (fixture / 'assets/outside-link.json').symlink_to(outside)
            with server(fixture) as port:
                for relative in private_paths:
                    request(port, 'present-private-fixture', '/' + relative, 404)
                for url in ['/assets/private-link.json', '/assets/outside-link.json',
                            '/assets/../data/private.json', '/src/%2e%2e/data/private.json',
                            '/%2egit/config', '/data%2Fprivate.json', '/assets/', '/data/']:
                    request(port, 'encoded-traversal-symlink-or-listing', url, 404)

        windows = (ROOT / 'server.ps1').read_text()
        names = set('/' + value for value in re.findall(r"'(data/[^']+)'", windows))
        assert names == module.PUBLIC_REFERENCE_PATHS, names
        assert '-not $isPublicPath -or $containsPrivateSegment' in windows
        assert "$segments[0] -in @('assets', 'src')" in windows
        assert '$containsPrivateSegment -or $containsReparsePoint' in windows
        assert '$item.Attributes -band [System.IO.FileAttributes]::ReparsePoint' in windows
        report['windows'] = {'publicPathsMatch': True, 'namespaceGuardPresent': True,
                             'reparsePointGuardPresent': True,
                             'runtimeExecuted': False,
                             'limitation': 'Static PowerShell policy check only; Windows runtime not available'}
        assert report['source'] == {name: digest((ROOT / name).read_bytes()) for name in report['source']}
        report['complete'] = True
        report['passedRequests'] = len(report['requests'])
        save()
        print(f"PASS {len(report['requests'])} real HTTP checks: 3 exact exports, HEAD, private fixtures, listings and symlinks")
        print('PowerShell allowlist agrees statically; native Windows execution not certified')
    except Exception as error:
        report['failure'] = str(error)
        save()
        raise


if __name__ == '__main__':
    main()
