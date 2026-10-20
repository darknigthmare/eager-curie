#!/usr/bin/env python3
"""Validate deterministic seamless PBR texture sets using only Python's stdlib."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / 'assets' / 'textures'
MATERIALS = ('carapace', 'hive-resin', 'industrial-panels', 'fabric-weave', 'skin-tissue')
NAMES = [f'{material}{suffix}.png' for material in MATERIALS
         for suffix in ('', '-normal', '-roughness', '-ao')]
NAMES += ['industrial-panels-metalness.png', 'organic-bump.png']
EXPECTED_SIZE = {name: 2048 if name.startswith(('carapace', 'skin-tissue')) else 1024 for name in NAMES}


def decode(file):
    png = file.read_bytes()
    assert png[:8] == b'\x89PNG\r\n\x1a\n', f'{file.name}: signature'
    offset, compressed, metadata, ended = 8, [], None, False
    while offset < len(png):
        length = struct.unpack_from('>I', png, offset)[0]
        kind = png[offset + 4:offset + 8]
        data = png[offset + 8:offset + 8 + length]
        expected = struct.unpack_from('>I', png, offset + 8 + length)[0]
        assert zlib.crc32(kind + data) & 0xffffffff == expected, f'{file.name}: CRC {kind!r}'
        if kind == b'IHDR':
            metadata = struct.unpack('>IIBBBBB', data)
        elif kind == b'IDAT':
            compressed.append(data)
        elif kind == b'IEND':
            ended = True
        offset += length + 12
    assert ended and offset == len(png) and metadata == (EXPECTED_SIZE[file.name], EXPECTED_SIZE[file.name], 8, 2, 0, 0, 0), f'{file.name}: PNG format'
    width, height = metadata[:2]
    decoded = zlib.decompress(b''.join(compressed))
    stride = width * 3
    assert len(decoded) == height * (stride + 1)
    rows = []
    for y in range(height):
        at = y * (stride + 1)
        assert decoded[at] == 0, f'{file.name}: unsupported filter'
        rows.append(decoded[at + 1:at + 1 + stride])
    assert rows[0] == rows[-1], f'{file.name}: top-bottom seam'
    assert all(row[:3] == row[-3:] for row in rows), f'{file.name}: left-right seam'
    return b''.join(rows), len(png)


def validate():
    results = []
    for name in NAMES:
        pixels, byte_count = decode(TEXTURES / name)
        scalar = any(name.endswith(f'-{suffix}.png') for suffix in ('roughness', 'ao', 'metalness')) or name == 'organic-bump.png'
        if scalar:
            assert pixels[::3] == pixels[1::3] == pixels[2::3], f'{name}: scalar RGB mismatch'
            assert min(pixels) != max(pixels), f'{name}: empty/constant scalar map'
        elif name.endswith('-normal.png'):
            for at in range(0, len(pixels), 3 * 31):
                vector = [pixels[at + channel] / 255 * 2 - 1 for channel in range(3)]
                assert abs(math.sqrt(sum(value * value for value in vector)) - 1) < 0.014, f'{name}: non-unit normal'
                assert vector[2] > 0, f'{name}: inverted normal'
        else:
            assert min(pixels) + 8 < max(pixels), f'{name}: constant albedo'
        results.append({'file': name, 'size': f'{EXPECTED_SIZE[name]}x{EXPECTED_SIZE[name]}', 'bytes': byte_count})
    assert sum(row['bytes'] for row in results) < 20_000_000, 'Compressed texture budget exceeds 20 MB'
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--regenerate', action='store_true', help='Regenerate maps and verify byte-for-byte determinism')
    args = parser.parse_args()
    if args.regenerate:
        hashes = {name: hashlib.sha256((TEXTURES / name).read_bytes()).hexdigest() for name in NAMES}
        subprocess.run(['node', str(ROOT / 'tools' / 'generate-textures.mjs')], cwd=ROOT, check=True)
        for name, digest in hashes.items():
            assert hashlib.sha256((TEXTURES / name).read_bytes()).hexdigest() == digest, f'{name}: nondeterministic output'
    maps = validate()
    print(json.dumps({'passed': len(maps), 'determinism_checked': args.regenerate, 'total_bytes': sum(row['bytes'] for row in maps), 'maps': maps}, indent=2))
