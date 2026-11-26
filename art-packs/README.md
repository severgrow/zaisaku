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

## Pack 08 — District Identity

The original upload is stored unchanged under `art-packs/pack-08/`. Pack 08B stays beside it and is not overwritten. The checksum in `art-packs/pack-08/SHA256SUMS` matches the digest below. The zip is 5,720,427 bytes, under 10 MB.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-08/ZAISAKU_08_District_Identity_6299.zip | 5720427 | 3d89de7ee0c7d9892ea835b736cfc0ee19102b4875403c1f3826556a6b82ddc7 |

The zip is the byte-for-byte upload `ZAISAKU_08_District_Identity_6299.zip` (also referred to as `ZAISAKU_08_District_Identity.zip`). It contains two source sheets, runtime candidates, pose references, `manifest.json`, and a preview. There is no `CURSOR-INTEGRATION.md` and no `validation.json` in this archive. Source sheets and pose references stay on this branch. The game imports reviewed runtime PNGs only. Character poses in the zip are references, not replacement people. Status stays `temporary`.

## Pack 08B — validated runtime subset

Supersedes Pack 08 for runtime delivery. Packs 02–07 are untouched. The upload is stored unchanged under `art-packs/pack-08b/`. It is 349,334 bytes, under 10 MB. The checksum in `art-packs/pack-08b/SHA256SUMS` matches the digest below.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-08b/ZAISAKU_08B_Validated_Runtime_e4c7.zip | 349334 | a9df7c9827e8dabf2283d1ba76af142b3ac03be6d0713d02b80ca32a6cbd7c7b |

The file is the byte-for-byte upload named `ZAISAKU_08B_Validated_Runtime_e4c7.zip` (the same bytes as ZAISAKU_08B_Validated_Runtime.zip). It contains individual runtime PNGs, `manifest.json`, `validation.json`, and integration notes in the README. Sprites stay `temporary` until a person approves screenshots. This zip has no source sheets.

From this point, reject a pack that does not include individual runtime PNGs, a manifest, technical validation, and explicit integration metadata. Do not import concept artwork, mismatched character poses, or unverified architectural components.

## Pack 09 — instruments and everyday life

Nothing here replaces Pack 02, Pack 04, Pack 05, Pack 06B, Pack 07, Pack 08, or Pack 08B. The two uploads are stored unchanged under `art-packs/pack-09/`. Checksums in `art-packs/pack-09/SHA256SUMS` match the digests below. Each archive is under 10 MB.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-09/ZAISAKU_09_Runtime_c50c.zip | 395338 | 544a8c82446fb4861acf55861e98fd0112d26db9a8ac36ffbaa0645944dd8884 |
| pack-09/ZAISAKU_09_Sources_1542.zip | 4932197 | 1c114849fa59d3fd101f5056bdf157eb223df6ac4dd1d29ff9d29efdc6a4e9b1 |

The user called these `ZAISAKU_09_Runtime.zip` and `ZAISAKU_09_Sources.zip`. The stored names are the upload filenames. The bytes are unchanged.

The runtime zip is the only archive the game imports. It carries `manifest.json`, `README.md`, a contact sheet, and 31 runtime PNGs whose hashes match the manifest. The contact sheet is not a sprite. The source zip holds the original sheets and stays on this branch, out of `web/public`. East and west window glass is not in this delivery. Status in the game stays `temporary`.

## Pack 10 — district connections and interiors

Nothing here replaces Pack 02, Pack 04, Pack 05, Pack 06B, Pack 07, Pack 08, Pack 08B, or Pack 09. Both uploads are stored unchanged under `art-packs/pack-10/`. The source zip is visual reference only and stays out of the game bundle. Checksums in `art-packs/pack-10/SHA256SUMS` match the digests below. Each archive is under 10 MB.

| Stored file | Bytes | SHA-256 |
|---|---:|---|
| pack-10/ZAISAKU_10_Runtime_620a.zip | 194872 | 872f42328cc41523ab3d73c59825b124d5dc5ebde76042bf0c710ce045950e3c |
| pack-10/ZAISAKU_10_Sources_e315.zip | 3934166 | 3cc6e9d2dae92215ff5b837235fac4f8f0102ce6409b5f402415fa4e4bfbd521 |

The runtime zip is the byte-for-byte upload called `ZAISAKU_10_Runtime.zip`. The source zip is the byte-for-byte upload called `ZAISAKU_10_Sources.zip`. The runtime carries eight paving-to-path transitions, the residence inlay, five furniture sprites, and the unchanged Ivo, Ness, and Archivist busts, plus `manifest.json`, `validation.json`, and a preview. Three generated building fronts are south-facing and are not in this runtime. Status stays `temporary`.

## Ongoing workflow

Stage numbered immutable ZIP files and checksums here. Keep each ZIP below 10,000,000 bytes. Use a separate runtime archive and source archive(s). Cursor fetches the staging branch, checks hashes, imports the runtime pack into the active development branch, and records asset approval after screenshots. No gameplay changes or confidential lore in asset staging.

Reject a delivery that lacks individual runtime PNGs, a manifest, technical validation, and explicit integration metadata. Pack 08B remains the later validated subset. Storing the original Pack 08 archive does not replace it.
