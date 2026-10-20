#!/usr/bin/env python3
"""Refresh pinned browser assets from npm, verifying the published SHA-512 integrity."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SPECS = [
    ('three', '0.128.0', [
        ('package/build/three.min.js', 'assets/vendor/three.r128.min.js'),
        ('package/examples/js/loaders/GLTFLoader.js', 'assets/vendor/GLTFLoader.r128.js'),
        ('package/examples/js/utils/SkeletonUtils.js', 'assets/vendor/SkeletonUtils.r128.js'),
        ('package/examples/js/loaders/RGBELoader.js', 'assets/vendor/RGBELoader.r128.js'),
        ('package/LICENSE', 'assets/vendor/THREE-LICENSE.txt'),
    ]),
]
for slug, family, weights in [('orbitron', 'Orbitron', [400, 700, 900]), ('share-tech-mono', 'Share Tech Mono', [400]), ('rajdhani', 'Rajdhani', [500, 700])]:
    files = [(f'package/files/{slug}-latin-{weight}-normal.woff2', f'assets/fonts/{slug}-latin-{weight}-normal.woff2') for weight in weights]
    files.append(('package/LICENSE', f'assets/fonts/{slug}-LICENSE.txt'))
    SPECS.append((f'@fontsource/{slug}', '5.3.0', files))

provenance = []
for package, version, files in SPECS:
    metadata_url = f'https://registry.npmjs.org/{package}/{version}'
    with urllib.request.urlopen(metadata_url, timeout=30) as response:
        metadata = json.load(response)
    dist = metadata['dist']
    with urllib.request.urlopen(dist['tarball'], timeout=60) as response:
        archive = response.read()
    algorithm, expected = dist['integrity'].split('-', 1)
    if algorithm != 'sha512':
        raise ValueError(f'Expected SHA-512 integrity for {package}')
    actual = base64.b64encode(hashlib.sha512(archive).digest()).decode()
    if actual != expected:
        raise ValueError(f'Integrity mismatch for {package}')
    installed = []
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
        for source, destination in files:
            data = tar.extractfile(source).read()
            target = ROOT / destination
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            installed.append({'path': destination, 'source': source, 'integrity': 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode()})
    provenance.append({'package': package, 'version': version, 'tarball': dist['tarball'], 'integrity': dist['integrity'], 'files': installed})
    print(f'Verified and installed {package}@{version}')

(ROOT / 'assets/vendor/provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
rules = []
for slug, family, weights in [('orbitron', 'Orbitron', [400, 700, 900]), ('share-tech-mono', 'Share Tech Mono', [400]), ('rajdhani', 'Rajdhani', [500, 700])]:
    for weight in weights:
        rules.append(f"@font-face {{ font-family: '{family}'; font-style: normal; font-weight: {weight}; font-display: swap; src: url('./{slug}-latin-{weight}-normal.woff2') format('woff2'); }}")
(ROOT / 'assets/fonts/fonts.css').write_text('\n'.join(rules) + '\n')
