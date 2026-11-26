# Mineral Analog

The [Art & Design Constitution](ZAISAKU-ART-CONSTITUTION.md) and [canonical references](art-direction/canonical-references/README.md) govern this implementation.

Mineral Analog is the art direction for Zuisaku. The planet is not a reskin of Earth and not a reskin of Japan. Uniqueness is meant to come from shapes, materials, and behaviour. Graphical density stays low so a solo creator can extend it with generated sprites.

The five creator-supplied visual targets are checked in with their original filenames and SHA-256 checksums. Player-facing lines stay ordinary and follow the established setting.

## Perspective

One camera, for every future sprite:

- Fixed angled top-down.
- Square 32×32 terrain.
- Front and roof both readable. No rotating camera, no isometric axes, no 3D.
- Feet at the bottom centre of a sprite. Depth is the foot line.
- Nearest-neighbour sampling at stepped zoom levels, with a wider initial view on narrow screens. No mixed side-view and top-down sheets.

## Materials

Defined in `src/world/materials.ts`, not inside a scene.

| Id | Name | Look | Use |
| --- | --- | --- | --- |
| vey | Living ivory ceramic | Warm bone, rounded | Shells, furniture, domestic objects |
| oru | Green mineral alloy | Muted green-grey, geometric | Structure, machines, containers |
| sera | Amber resonant matter | Ochre, sometimes a small light | Instruments, energy, unusual objects |

## Biology

Four families, a few sprites each, in the tile painters: disc trees (layered horizontal canopies), veinflora (branching), mineral reeds (vertical bars), lantern growth (a small amber pod). Size, growth, and regional colour are palette and data hooks. Cultivation is not simulated yet.

## People

One body, about 24×32, adult proportions, four directions, four walk frames. Coats and one accessory (none, visor, hood) make the variants. The player wears a dark coat and a visor. Ivo, Ness, and the Archivist are inhabitants of the district. They are not online players.

## Regions

`src/world/palettes.ts` holds exchange, basin, industrial, cultivation, and unmapped. District 01 and the residence use exchange. The other four are data only. Recolour by swapping the palette. Do not duplicate a sprite per region until a pixel file actually needs it.

## Balance of the strange

About 70% of what a player sees is a settlement doing ordinary work: paths, doors, a stall, a desk. About 25% is the biology and the materials. About 5% is unexplained. In District 01 that 5% is the ring pattern in the square. The line on it says it is not on any notice.

## What the pictures are

World Mode draws Mineral Analog pack 04 floors, straight transitions, and connected walls, roofs and door frames on the existing 32px grid. The textures are 64px and the camera zoom is 2, so one source pixel is one screen pixel. Pack 02 still supplies the player walk cycle and the three NPC facings: 48×64 frames shown at 24×32, origin at the bottom centre. Sixteen catalogue plates use the existing definition ids; every other object keeps its SVG plate. Empty shelves draw the owned picture on top. The manifest status is still `temporary`. The procedural painters in `web/src/world/art.ts` remain only if a file fails to load.

Numbered packs live on `art/mineral-analog-packs` under `art-packs/`. Runtime and source stay in separate archives, each at most 10 MB, with a checksum, and a later pack does not replace an earlier file. Source sheets stay out of `web/public`.

## Avoid

Pitched roofs, brick, wood, kanji, cherry trees, medieval props, neon, anime portraits, crystal clusters, photoreal textures, and antialiased pixels.
