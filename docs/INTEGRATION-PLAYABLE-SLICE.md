# ZAISAKU playable integration handover

This pass continues PR #10 from `d430a92e619715e278d56b864c2190e4b89ff890`. It keeps District 01, the residence, the shared local ledger, the deterministic six-round duel, and all 36 catalogue identities in one integration branch. The [constitution](ZAISAKU-ART-CONSTITUTION.md), [original references](art-direction/canonical-references/README.md), and [production queue](../art/production-queue.json) govern further work.

## District and playability

- The exchange and research facility use door-aligned south shells. The duel hall, auction house and residence have separate east, west and north modular assemblies. Each façade, foundation and roof is drawn as a unit. The map still owns collision, paths and the logical entrance positions.
- The central crossing is now a plaza with a Sera instrument. Portal ramps, planted seating, the north courtyard, a stall and delivery and research work areas give the space distinct uses. The original player and NPC sprites supply the scale reference in the gameplay images.
- The residence has a sleeping alcove, bedside cabinet, work area, domestic terminal and warm local lighting. The shelf and glass display show owned instance IDs. Selling an item removes its physical display. Opening or closing a lot updates the auction stand separately from the world background.
- Mobile starts with a wider camera view. Tap-to-walk remains the default, with keyboard movement on desktop. Buyer, display, auction and request screens share the existing controller and guest save. The menu prioritises entry to the district. The duel shows its private request and timer above the decision dock, adapts the landscape instrument layout and links back to the district from results.
- Floor textures cache by location. Shelf and lot updates redraw only the affected objects. Contact shadows share a single texture. Local lights and resonance use one throttled update with a static reduced-motion state. Phaser stays lazy-loaded, and the world uses the 64-pixel exports of the canonical catalogue illustrations.

## Artwork and approval

The 25 registered assets in [ZA-DISTRICT-01](../art/packs/ZA-DISTRICT-01/README.md) have PNG dimensions and checksums in the runtime registry. They have been viewed in game and remain temporary pending creator review. `web/src/world/architecture.ts` contains the modular shell construction. [The staging archive](https://github.com/severgrow/zaisaku/tree/art/mineral-analog-packs/art-packs/ZA-DISTRICT-01) preserves the candidate PNGs and checksums separately from the original sources.

| Origin | Used in this pass | Held outside runtime |
| --- | --- | --- |
| Creator references and handover | Five unchanged reference PNGs and 14 runtime crops from all four newer sheets | Other source concepts, including alternate building façades, furniture with baked collectibles, and oversized public fixtures |
| Pack 08B | Contact shadow, lantern growth, bench, notice board and ground mark | Vault door and four contract sprites. The handover disc tree fits the native vegetation family more closely than the ornamental Pack 08B tree. |
| Pack 10 | Exchange counter, paper rack, bedside cabinet and workbench | Sleeping ledge, superseded in this room by the alcove. Portrait copies match Pack 09 and the earlier path and residence floor work remains in use. |
| Pack 05 / PR #3 | Private request envelope | Fixed compartment and full-table backgrounds, decorative frames and unapproved portrait treatments. Pack 09 supplies the dynamic trays, keys and portrait recess. |
| ZA-DETAILS-01 | Original native vent grille at the side buildings | Twelve rasterised candidates reviewed. Existing terrain has established joins, and existing props and contact shadow meet the intended scale. |
| Pack 08 and older source sheets | Original archives retained for provenance | Rejected Pack 08 runtime and the three ornate sheets remain quarantined. |

The [source archive folder](https://github.com/severgrow/zaisaku/tree/art/mineral-analog-packs/art-packs/chatgpt-handover) holds the verified original reference, newer source and quarantined ZIPs. Original PNGs and archives were hashed before transfer. The separate Pack 11 shells archive was absent from staging and fetched repository history. `ZAISAKU_80_Environment_Utility_Details.zip` is still needed for the [80-asset handover](https://github.com/severgrow/zaisaku/tree/art/mineral-analog-packs/art-packs/ZA-ENV-UTILITY-DETAILS-80).

## Playtest and captures

[Desktop before and after](playtest/district-before-after.jpg) shows the matched central plaza, exchange entrance and residence at 1280×800. [Mobile before and after](playtest/mobile-before-after.jpg) shows District 01 at 390×844, 360×800 and 844×390. The comparison images are from the baseline and integrated production builds. Browser workflow artifacts include original PNGs, five District 01 viewport sizes, both south approaches and the side entrances, dialogue, the furnished residence and occupied shelf, market, vault, inspection, auction, requests, settings, all tested duel layouts and results. The collecting and exploration recording is made from the test browser when FFmpeg is available.

- Navigation proof exercised route replacement, ground movement, Ivo and Ness dialogue, and travel into the residence. The collecting journey covered portrait touch travel, the vault, placing and selling a purchased instance, eight repeated transitions, menus, resize and save reload and reopen.
- A full six-round duel completed at 1440×900, 390×844, 360×800 and 844×390. Each run used both bid controls, locked a bid, sold an acquired object, inspected, passed, and let one real countdown expire. Results returned to the district. The persistent wallet and vault were checked for separation from the match.
- The browser reopened an auction with escrow and checked persistent balance, ownership, display, requests, location, a Polish collector name, larger type, reduced motion and sound. Chrome lifecycle freeze/resume and landscape resize were followed by keyboard movement and a single active canvas.
- TypeScript, 49 unit tests, catalogue integrity for all 36 definitions, the 134-record asset validator, and the production build passed. The asset validator checks the registered candidate PNG hashes against the pack. JS error and failed-resource listeners reported no problems in the full journeys.

## Measured performance

Headless Chromium 156 on the same cloud host, local production preview, 1440×900, three fresh browser contexts per build. Startup measurement includes Playwright navigation or click. Frame pacing uses 90 idle `requestAnimationFrame` intervals per sample. Raw samples and heap measurements are in [the performance comparison](playtest/performance-comparison.json).

| Metric | Baseline | Integration pass |
| --- | ---: | ---: |
| Median home ready | 371 ms | 347 ms |
| Median click District to first playable pose | 1,163 ms | 1,144 ms |
| PNG body bytes at first world entry | 1,409,922 | 1,018,630 |
| PNG requests at first world entry | 202 | 192 |
| Median idle frame interval | 16.7 ms | 16.7 ms |
| Highest sample p95 idle frame interval | 16.8 ms | 16.8 ms |
| Post-GC JavaScript heap after four terminal round trips and resume | 6.78–6.79 MB | 6.80–6.81 MB |

The production build has about 42.5 kB gzip of entry JavaScript, a 16.1 kB gzip district chunk and a 338.5 kB gzip Phaser chunk. Vite reports the lazy Phaser chunk at 1.48 MB minified. Camera, keyboard and pointer timings were tested in Chromium. Mobile viewport capture used emulation. Physical-device timings, GPU or native texture memory and longer play sessions remain unmeasured.

## Build and open

The workflow uploads `zaisaku-playable` and `zaisaku-browser-captures`. Serve the extracted production build over HTTP, for example `python3 -m http.server 4173`, then open `http://localhost:4173`. From the source checkout use `npm ci`, `npm run web:build`, and `npm run web:preview`. The CI workflow runs the browser scripts under `web/e2e/` against the built app.

The remaining visual review should focus on the fit and finish of the side-building and north-facing entry details, the room’s perimeter architecture and the strongest terrain joins. This slice includes one exterior district and its residence. The other facilities open their existing interactions on approach. The economy and simulated house opponents run locally in the browser. Audio remains the existing optional decision tick. Creator approval and the missing binary pack are tracked in the production queue.
