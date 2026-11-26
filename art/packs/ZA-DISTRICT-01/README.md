# ZA-DISTRICT-01

District 01 and residence runtime candidates for the Mineral Analog pass. The stable asset IDs, logical source dimensions and pivots live in `src/world/district-art.ts`. The fixture map records display dimensions, blocking cells and approaches. The building map records the ground footprint and direction independently from the render bounds. New south shell pivots identify the threshold centre. Terrain and approval follow the [constitution](../../../docs/ZAISAKU-ART-CONSTITUTION.md).

Run `python art/packs/ZA-DISTRICT-01/prepare.py /path/to/ZAISAKU_New_Source_Art.zip` with Pillow 13.0.0. The script checks the source SHA-256, limits each extraction to its reviewed crop, removes transparent halo pixels, preserves aspect ratio, and records the alpha bounds, anchor and output SHA-256. `npm run assets` checks all registered PNG dimensions and checksums. Update the checksum index when authoring a successor pack. Keep the original source archives on the art staging branch.

- `district/` contains fourteen illustrated crops and the native 32-pixel service grille from ZA-DETAILS-01. The remaining technical masters were rasterised and visually reviewed. Existing connected terrain and established props were retained.
- `identity/` contains the Pack 08B contact shadow, lantern growth, notice board, plaza bench and resonance mark. All five keep their original bytes. The tree in this pass is the handover disc-tree crop. The vault overlay and four contract illustrations remain in the Pack 08B archive.
- Pack 10 contributes the exchange counter, work bench, bedside cabinet and paper rack. The sleeping alcove fits the established rest position. The three portrait binaries duplicate the Pack 09 character crops, which remain canonical in the dialogue component.
- The private envelope is the Pack 05 runtime crop from PR #3. The duel continues to use Pack 09 for expandable trays, its mobile recess and physical bid keys.

The game captures show these candidates in use. Creator review is pending.
