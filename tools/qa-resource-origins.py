#!/usr/bin/env python3
"""Dependency-free regression checks of the native harness's real URL classifier.

Only its pure function AST is loaded, avoiding a Playwright dependency or a
browser launch. No classifier logic is duplicated in this test.
"""
import ast
from pathlib import Path
from urllib.parse import urlparse


def main():
    source = Path(__file__).with_name('qa-alien-base-native.py').read_text()
    tree = ast.parse(source)
    functions = [node for node in tree.body
                 if isinstance(node, ast.FunctionDef) and node.name == 'classify_resource_url']
    assert len(functions) == 1, 'The real native classifier must be present exactly once'
    namespace = {'urlparse': urlparse}
    exec(compile(ast.Module(body=functions, type_ignores=[]), 'native-classifier', 'exec'), namespace)
    classify = namespace['classify_resource_url']
    base = 'http://127.0.0.1:8098/'
    cases = [
        ('http://127.0.0.1:8098/src/game.js', base, 'local-http'),
        ('http://127.0.0.1:8098/data/alien-base.snapshot.v2.json?v=1', base, 'local-http'),
        ('blob:http://127.0.0.1:8098/uuid', base, 'local-blob'),
        ('blob:http://127.0.0.1:8098/uuid?example=foreign.invalid', base, 'local-blob'),
        ('https://127.0.0.1:8098/src/game.js', base, 'foreign'),
        ('http://127.0.0.1:8099/src/game.js', base, 'foreign'),
        ('http://foreign.invalid/src/game.js', base, 'foreign'),
        ('blob:https://127.0.0.1:8098/uuid', base, 'foreign'),
        ('blob:http://127.0.0.1:8099/uuid', base, 'foreign'),
        ('blob:http://foreign.invalid/uuid', base, 'foreign'),
        ('blob:http://127.0.0.1:8098.foreign.invalid/uuid', base, 'foreign'),
        ('blob:http://127.0.0.1:8098@foreign.invalid/uuid', base, 'foreign'),
        ('blob:null/uuid', base, 'foreign'),
        ('blob:/src/uuid', base, 'foreign'),
        ('blob:blob:http://127.0.0.1:8098/uuid', base, 'foreign'),
        ('blob:http://[malformed', base, 'foreign'),
        ('data:text/plain,local-content', base, 'foreign'),
        ('file:///workspace/game.js', base, 'foreign'),
        ('/src/game.js', base, 'foreign'),
        ('http://foreign.invalid/?url=http://127.0.0.1:8098/', base, 'foreign'),
        ('blob:https://example.invalid/uuid', 'https://example.invalid/', 'local-blob'),
        ('https://example.invalid/index.html', 'https://example.invalid/', 'local-http'),
        ('blob:http://127.0.0.1:8098/uuid', 'blob:http://127.0.0.1:8098/base', 'foreign'),
    ]
    for resource, origin, expected in cases:
        actual = classify(resource, origin)
        assert actual == expected, (resource, origin, actual, expected)
    print(f'PASS {len(cases)} strict origin classifier cases (HTTP, local blobs, foreign/opaque/spoofed blobs)')


if __name__ == '__main__':
    main()
