# Mineral Analog art handoff

Dedicated asset staging branch. Do not merge this branch wholesale into the game branch; copy/import reviewed runtime assets only. Keep original source artwork outside the production bundle. No confidential lore belongs here.

## Pack 04 — corrected assets

Baseline: b2f6d68ee3f4e0c678e2e19aa72071f924c0361c (PR #1).

The four ZIPs have been prepared locally, but binary upload from the current ChatGPT environment is unavailable. This index records the exact expected filenames, sizes and SHA-256 digests. Upload the actual ZIPs into this directory before treating them as available.

| File | Bytes | SHA-256 |
|---|---:|---|
| ZAISAKU_04_Runtime.zip | 1178795 | c67c948168a3d68c4f69f2b61ae6fef97df09d6b7cf2f0e0df89bc329992b759 |
| ZAISAKU_04_Sources_pack02.zip | 5246756 | aaa9900bfe3f9dd2b70675f402e27129a23aad058d4bf3fe89df94f5a7fb3135 |
| ZAISAKU_04_Sources_pack03.zip | 7124734 | a57ef7a4cef7e5fc599e40885780224be406ccb6b1f903b154a72b5b3752b2ff |
| ZAISAKU_04_Sources_pack04.zip | 6537148 | 44c1f74df3ccf5b185a5941dde3120ac27e8620418291c61c1d4cc61f84e6bf1 |

## Cursor integration

Unzip the runtime archive. Read README.md, CURSOR-INTEGRATION.md, manifest.json, validation.json. It contains 98 PNGs (6 seamless floors, 8 transitions, 46 architecture pieces, 6 furniture files and 32 catalogue plates at two sizes), previews and generation record. Preserve Pack 02 character walk cycles and NPC facings and usable Pack 03 loose props.

Use full-cell opaque 64px floors on the existing 32px logical grid. Do not alpha-trim or use linear filtering. Use directional connector metadata for walls, rails and roofs; never arbitrarily rotate angled sprites. Empty display furniture must render actual owned items independently. Bind catalogue plates by existing definition IDs, not new items. Twin Left faces right; Twin Right faces left. Keep assets candidate status until actual desktop/mobile screenshots are approved.

Run asset validation, typecheck, tests, build and visual seam checks. The supplied runtime validation reported 186 checks passed; actual Phaser integration is not yet tested.

## Ongoing workflow

Stage numbered immutable ZIP files and checksums here. Keep each ZIP below 10,000,000 bytes. Use a separate runtime archive and source archive(s). Cursor fetches the staging branch, checks hashes, imports the runtime pack into the active development branch, and records asset approval after screenshots. No gameplay changes or confidential lore in asset staging.
