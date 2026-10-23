#!/usr/bin/env python3
"""Refresh the pinned CC0 Poly Haven warehouse HDRI and its license evidence."""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'environments'
MIRROR_COMMIT = '456060a26bbeb8fdf79326f224b6d99b8bcce736'
LICENSE_COMMIT = 'b1a6aa13afc03ae00860f6ac5fe6d5daf8e95356'
ASSET_URL = f'https://raw.githubusercontent.com/pmndrs/drei-assets/{MIRROR_COMMIT}/hdri/empty_warehouse_01_1k.hdr'
LICENSE_URL = f'https://raw.githubusercontent.com/Poly-Haven/polyhaven.com/{LICENSE_COMMIT}/public/locales/en/license.json'
ATTRIBUTION_URL = f'https://raw.githubusercontent.com/pmndrs/drei-assets/{MIRROR_COMMIT}/README.md'
SHA256 = '9b3d611cadc32c3a0c7e084ce5611c0650293881c4a041e7fa13748fe0dc6451'


def download(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read()


def main():
    license_data = download(LICENSE_URL)
    license_text = json.loads(license_data)
    attribution = download(ATTRIBUTION_URL).decode('utf-8')
    assert 'CC0' in license_text['p2'] and 'redistribute' in license_text['p5l3']
    assert 'HDRIs from [HDRI Haven]' in attribution
    asset = download(ASSET_URL)
    assert hashlib.sha256(asset).hexdigest() == SHA256, 'HDR integrity mismatch'
    assert asset.startswith(b'#?RADIANCE') and b'-Y 512 +X 1024' in asset[:300]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'empty-warehouse-01-1k.hdr').write_bytes(asset)
    (OUT / 'polyhaven-license-evidence.json').write_bytes(license_data)
    (OUT / 'SOURCE-LICENSE.txt').write_text(
        'Empty Warehouse 01 — Poly Haven / HDRI Haven\n'
        'Asset: https://polyhaven.com/a/empty_warehouse_01\n'
        'License: CC0-1.0, https://creativecommons.org/publicdomain/zero/1.0/\n'
        'Original license policy: https://polyhaven.com/license\n\n'
        'Poly Haven explicitly licenses all its HDRIs, textures and models as CC0.\n'
        'Their policy permits any purpose, commercial use, modification and redistribution.\n'
        'Attribution is not required, but is provided here.\n'
        'The adjacent evidence JSON preserves their first-party license statement.\n'
        'The pinned mirror README identifies the HDRI collection as HDRI Haven assets.\n\n'
        f'License evidence: {LICENSE_URL}\n'
        f'Mirror attribution: {ATTRIBUTION_URL}\n'
        f'Download: {ASSET_URL}\n'
        f'Unmodified Radiance RGBE asset SHA-256: {SHA256}\n', encoding='utf-8')
    provenance = {
        'asset': 'Empty Warehouse 01', 'author': 'Poly Haven / HDRI Haven',
        'asset_page': 'https://polyhaven.com/a/empty_warehouse_01',
        'license': 'CC0-1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'license_evidence': LICENSE_URL, 'mirror_attribution': ATTRIBUTION_URL,
        'source': ASSET_URL, 'sha256': SHA256, 'bytes': len(asset),
        'format': 'Radiance RGBE', 'width': 1024, 'height': 512,
        'modifications': 'Source file unchanged. Runtime applies a -2 EV linear RGBE exposure calibration before PMREM filtering for the station lighting.',
    }
    (OUT / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(f'CC0 verified; HDR SHA-256 verified; {len(asset)} bytes; 1024x512 Radiance RGBE.')


if __name__ == '__main__':
    main()
