#!/usr/bin/env python3
"""Extract reviewed sprite crops using Pillow. Run with the original source ZIP as the argument."""
import argparse
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageEnhance


PACK = Path(__file__).resolve().parent
RUNTIME = PACK.parents[2] / 'web/public/mineral/district'


def extract(source, entry):
    clip = source.crop(entry['crop'])
    alpha = clip.getchannel('A').point(lambda value: 255 if value >= 168 else 0)
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError(f"Empty crop for {entry['id']}")
    clip.putalpha(alpha)
    clip = clip.crop(bounds)
    width, height = entry['size']
    clip.thumbnail((width, height), Image.Resampling.LANCZOS)
    # A hard pixel edge keeps art crisp over light and dark ground at game zoom.
    alpha = clip.getchannel('A').point(lambda value: 255 if value >= 160 else 0)
    clip = ImageEnhance.Color(clip.convert('RGB')).enhance(0.88)
    sprite = Image.new('RGBA', (width, height))
    sprite.paste(clip, ((width - clip.width) // 2, height - clip.height), alpha)
    if sprite.getchannel('A').getextrema() != (0, 255):
        raise ValueError(f"Expected opaque art and transparent margins for {entry['id']}")
    return sprite


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    config = json.loads((PACK / 'crops.json').read_text())
    if hashlib.sha256(args.source.read_bytes()).hexdigest() != config['sourceSha256']:
        raise ValueError('Source archive SHA-256 differs from the original handover')
    records = []
    RUNTIME.mkdir(parents=True, exist_ok=True)
    with ZipFile(args.source) as archive:
        for entry in config['assets']:
            with Image.open(io.BytesIO(archive.read(entry['sheet']))) as source:
                sprite = extract(source.convert('RGBA'), entry)
            path = RUNTIME / f"{entry['id']}.png"
            sprite.save(path, optimize=True)
            width, height = sprite.size
            records.append(dict(entry, bounds=sprite.getchannel('A').getbbox(),
                                pivot=entry.get('pivot', [width // 2, height]),
                                sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    (PACK / 'runtime.json').write_text(json.dumps({
        'status': 'runtime candidate pending creator review', 'assets': records,
    }, indent=2) + '\n')


if __name__ == '__main__':
    main()
