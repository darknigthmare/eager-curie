#!/usr/bin/env python3
"""Serve the static game locally with the same security headers as Vercel."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
HEADERS = json.loads((ROOT / 'vercel.json').read_text())['headers'][0]['headers']


class GameHandler(SimpleHTTPRequestHandler):
    extensions_map = dict(SimpleHTTPRequestHandler.extensions_map, **{
        '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
        '.bin': 'application/octet-stream', '.hdr': 'image/vnd.radiance',
        '.webp': 'image/webp',
    })

    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        parts = Path(path.lstrip('/')).parts
        target = (ROOT / path.lstrip('/')).resolve()
        allowed = path in ('/', '/index.html') or (
            bool(parts) and parts[0] in ('assets', 'src')
            and not any(part.startswith('.') for part in parts)
            and target.suffix.lower() in ('.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.svg', '.woff2', '.txt', '.glb', '.gltf', '.bin', '.hdr', '.webp')
        )
        if not allowed or not target.is_relative_to(ROOT):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        for header in HEADERS:
            self.send_header(header['key'], header['value'])
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(GameHandler, directory=str(ROOT)))
    print(f'HIVE ASCENSION — local development server on port {args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
