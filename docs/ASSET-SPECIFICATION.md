# Asset specification

These sizes are the logical cells. Pack 04 floors and architecture are the 64px files in `web/public/mineral/`, drawn into those cells with nearest-neighbour. Pack 02 characters and loose props stay beside them. Everything stays `temporary` until the screenshots are approved. Source archives are on `art/mineral-analog-packs`, not in the production bundle.

| Kind | Pixels | Notes |
| --- | --- | --- |
| Terrain tile | 32 × 32 | Origin top-left in the grid |
| Character | 24 × 32 | Origin bottom-centre. Four directions, four walk frames |
| Common object | 32 × 32 | Origin bottom-centre |
| Collectible plate | 64 × 64 | Inventory and catalogue. Not drawn in the world yet |
| Inspection | 128 × 128 | Only when a prop needs it |
| Furniture and architecture | Multiples of 32 | Current kit is one tile per piece |

## Drawing rules

Chunky clusters. Three or four shades of a material. Strong silhouette. Limited outline. Light from the upper left, suggested by shade blocks, not by a baked shadow on the ground. Transparent PNG. No antialiasing. No single-pixel confetti.

## Manifest

`src/world/assets.ts` lists every world record with `id`, `category`, `width`, `height`, `status`, and anchor. `status` is `temporary` or `approved`. `validateManifest` rejects a size that does not match the category.

`src/world/artwork.ts` gives each catalogue object one `pixelKey` and keeps its existing `artworkRef` SVG. The world currently draws a shared category plate for a displayed object. The unique key is already reserved so one approved PNG can replace that object without a second identity.

## Filenames

`{category}-{id}.png`, lowercase, digits, and hyphens. A sheet is `{id}-sheet.png` with equal cells. `sliceGrid` rejects a sheet that is not an even multiple of the cell.

## Checks

`npm run assets` runs `src/tools/validate-assets.ts`. It checks the manifest and that every object link has a unique pixel key and an SVG fallback. `readPngSize` reads only the PNG signature and IHDR. `chromaKey` clears an approved backdrop colour. Neither tool calls an image generator.
