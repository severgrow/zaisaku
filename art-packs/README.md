# Mineral Analog art handoff

Dedicated asset staging branch. Do not merge this branch wholesale into the game branch; copy/import reviewed runtime assets only. Keep original source artwork outside the production bundle. No confidential lore belongs here.

## Pack 04 — corrected assets

Baseline: b2f6d68ee3f4e0c678e2e19aa72071f924c0361c (PR #1).

The four archives are stored under `art-packs/pack-04/`. Nothing here replaces an earlier pack. Checksums in `art-packs/pack-04/SHA256SUMS` match the digests below. Each archive is under 10 MB.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-04/zaisaku-mineral-analog-04-runtime.zip | 1178795 | c67c948168a3d68c4f69f2b61ae6fef97df09d6b7cf2f0e0df89bc329992b759 |
| pack-04/zaisaku-mineral-analog-04-sources-pack02.zip | 5246756 | aaa9900bfe3f9dd2b70675f402e27129a23aad058d4bf3fe89df94f5a7fb3135 |
| pack-04/zaisaku-mineral-analog-04-sources-pack03.zip | 7124734 | a57ef7a4cef7e5fc599e40885780224be406ccb6b1f903b154a72b5b3752b2ff |
| pack-04/zaisaku-mineral-analog-04-sources-pack04.zip | 6537148 | 44c1f74df3ccf5b185a5941dde3120ac27e8620418291c61c1d4cc61f84e6bf1 |

The runtime zip is the only archive the game imports. The three source zips stay on this branch and out of `web/public`.

## Cursor integration

Unzip the runtime archive. Read README.md, CURSOR-INTEGRATION.md, manifest.json, validation.json. It contains 98 PNGs (6 seamless floors, 8 transitions, 46 architecture pieces, 6 furniture files and 32 catalogue plates at two sizes), previews and generation record. Preserve Pack 02 character walk cycles and NPC facings and usable Pack 03 loose props.

Use full-cell opaque 64px floors on the existing 32px logical grid. Do not alpha-trim or use linear filtering. Use directional connector metadata for walls, rails and roofs; never arbitrarily rotate angled sprites. Empty display furniture must render actual owned items independently. Bind catalogue plates by existing definition IDs, not new items. Twin Left faces right; Twin Right faces left. Keep assets candidate status until actual desktop/mobile screenshots are approved.

Run asset validation, typecheck, tests, build and visual seam checks. The supplied runtime validation reported 186 checks passed; actual Phaser integration is not yet tested.

## Pack 05 — duel instrument sheets

Nothing here replaces Pack 04 or Pack 02. The upload is stored unchanged under `art-packs/pack-05/`. Both original source sheets are also kept beside the zip, on this branch only. They are not part of the game bundle. Checksums in `art-packs/pack-05/SHA256SUMS` match the digests below. The zip is under 10 MB, so it is one blob.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-05/zaisaku_duel_asset_packs_01_bc4e.zip | 4330916 | 147e631b9b06378096667fd281e517b998cd8e464e7ad8600d33028a854a3c16 |
| pack-05/sources/pack05_duel_ui_set_a.png | 2080964 | 7526e522dc7eea1e41f31e3ba445851b31dc236816ab02d7e6120d22146e3e11 |
| pack-05/sources/pack05_duel_ui_set_b.png | 2539236 | 32939053ff38c2b0cab51e9684388f8126ab4e72a7e7e1192bd80fe5ed15d499 |

The zip is the byte-for-byte upload `zaisaku_duel_asset_packs_01_bc4e.zip`. The two PNGs inside it are the Mineral Analog duel sheets (bone ceramic, green-grey alloy, amber, muted burgundy). The game crops individual components from them. Do not copy either full sheet into `web/public` or into a script bundle.

## Pack 06B — Quiet Instrument (current interface pack)

SUPERSEDED: the earlier Pack 06 interface direction. No Pack 06 archive was on this branch, so nothing was deleted. Pack 04 and Pack 05 are untouched.

Status: candidate, not approved. This is the current menu and HUD pack. World sprites and the Pack 05 duel sheets stay in force.

The upload is stored unchanged under `art-packs/pack-06b/`. It is 16,334 bytes, under 10 MB, so it is one file. The checksum in `art-packs/pack-06b/SHA256SUMS` matches the digest below.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-06b/ZAISAKU_06B_Quiet_Instrument_f315.zip | 16334 | 0b9ef6f5f1c478da5253ac3e69f23805e98dca032b8493d7a8637ea84413dd93 |

The zip is the byte-for-byte upload `ZAISAKU_06B_Quiet_Instrument_f315.zip`. It is CSS, SVG, and a preview. It does not replace world art or duel sheets.

## Pack 07 — catalogue completion and district joins

Nothing here replaces Pack 02, Pack 04, Pack 05, or Pack 06B. The upload is stored unchanged under `art-packs/pack-07/`. The original sheet stays inside the zip, on this branch only, and is not part of the game bundle. The checksum in `art-packs/pack-07/SHA256SUMS` matches the digest below. The zip is under 10 MB, so it is one blob.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-07/ZAISAKU_07_Catalogue_and_Joins_b6fd.zip | 3031395 | df3ea4109f888958f3ade9a63c8ca95846c4d5c5df5aaab6f9adcc0e4dca33bb |

The zip is the byte-for-byte upload `ZAISAKU_07_Catalogue_and_Joins_b6fd.zip`. It carries twenty catalogue plates at 128 and 64, ceramic corner joins, east and west openings, the extended roof with its wall bridge, the layered glass case, and the north-door canopy. Status in the game stays `temporary`. Do not mark the pack approved from this archive.

## Ongoing workflow

Stage numbered immutable ZIP files and checksums here. Keep each ZIP below 10,000,000 bytes. Use a separate runtime archive and source archive(s). Cursor fetches the staging branch, checks hashes, imports the runtime pack into the active development branch, and records asset approval after screenshots. No gameplay changes or confidential lore in asset staging.
