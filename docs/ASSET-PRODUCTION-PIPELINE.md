# Asset production pipeline

There is no image-generation API in this project. New art is made outside the repo, then checked in as PNG. Until a file is approved, the game keeps the procedural stand-in and the manifest says `temporary`.

## Steps

1. Pick the category from [ASSET-SPECIFICATION.md](ASSET-SPECIFICATION.md).
2. Open the asset workshop (`#/workshop`) and look at the stand-in at native size, ×2, and ×3.
3. Generate or draw to the exact pixel size, in the perspective in [MINERAL-ANALOG-ART-DIRECTION.md](MINERAL-ANALOG-ART-DIRECTION.md).
4. Export a transparent PNG. Put the sheet through `sliceGrid` if it is a grid. Use `chromaKey` only for a known backdrop such as magenta.
5. Check width, height, and alpha with `readPngSize`. Run `npm run assets`.
6. Preview in the workshop on the tile grid, next to the player and a vey wall.
7. Set `status` to `approved` only after that preview. Leave it `temporary` if the file is a draft.

Do not describe a stand-in as finished art in the UI. The workshop heading says the current pictures are temporary.

## Brief for the next pass

Use this text with an external generator. Attach the workshop export or a screenshot of the stand-ins as the style reference.

> Pixel art sprite, transparent background, nearest-neighbour, no anti-aliasing, no outline glow. Perspective: fixed angled top-down, front and roof both visible, feet at the bottom. Palette only: bone ivory #e6d7c3 #c9b59a #8d7b68, green-grey #6d7550 #4c5340 #2e3328, amber #d29a3a #a87428, ground #8a7d6a, path #cbb89a. Three or four shades. Chunky clusters. No text, no letters, no kanji, no neon, no brick, no wood, no cherry blossom, no crystals. Lighting is a shade block on the lower right of a form, not a cast shadow.

Generate, in this order, at the sizes in the specification:

1. Ground, path, vey wall, oru roof, round window, door, awning, counter.
2. Disc tree, veinflora, mineral reed, lantern growth. One sprite each.
3. Player walk cycle: south, north, east. West is mirrored. Four frames. Coat #2c2824, small visor.
4. Three inhabitant coats: bone, olive hood, dark visor. Idle, facing south.
5. One 64×64 plate for a generic catalogue object, amber chamber on bone. Per-object plates come after this one looks right.

Reject any result that changes the perspective or adds a fifth material colour.

## Versioning

Replace a file in place and bump the record's note with the date. Do not keep two approved drawings for one id. The SVG fallback stays until the pixel file for that object is approved.
