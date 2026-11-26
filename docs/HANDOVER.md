# Handover

Zaisaku v0.1 is a playable offline terminal, plus a small walkable district, in this repository. The branch that introduced it is the open pull request against `main`. Futasaku was not modified.

## Setup

Node 20.19 or newer. From the repo root: `npm install`, then `npm run web:dev`. Check with `npm run check`. Build with `npm run web:build`. Catalogue with `npm run catalogue`. Assets with `npm run assets`. A JSON sim with `npm run sim`.

World Mode is `#/world` from the District tile. The asset workshop is linked from Settings and is not on the dock.

The production client is static files in `web/dist`. There is no environment variable and no secret.

## How a session works

The first visit creates a guest named Guest, seed from `crypto.getRandomValues`, permanent balance 2,400, six lots, the request Three Rooms, and a pose at the District 01 gate. The home floor shows the name, the balance, one transmission, the request, and the rooms, including District.

Duel starts a match that does not touch that balance. Choose a bid, an inspection, a sale, or a pass, read what it will do, then confirm. Nothing is submitted before that confirm. Owned objects stay without a separate action. Clerk Vesper locks as well, in the same turn. After six rounds, or when the objects and the clock run out, the result screen shows both chairs. Rematch starts another isolated match. Leaving for the district keeps the world pose and the permanent balance.

Market buy spends permanent Zai. Vault inspect reveals papers. Vault sell pays liquidation, which is less than the ask if the wire has not moved. Advance the transmission to change the event and the prices. The auction escrows a bid, ticks once a second, and settles or refunds.

Reload reads `zaisaku.save.v1`. The payload is version 2 (profile, duel, settings, result, world pose, revision). A version 1 file migrates in place and keeps the wallet. A broken file is copied to `zaisaku.save.corrupt` and a fresh ledger opens, with a notice.

World purchases call the same `buyListing` and `sellOwned` as the terminal. A shelf stores an instance id. Selling that instance clears the shelf. Walking does not create Zai.

## Decisions already made

- Rewards go into cash and are listed again on the result so the player can see them. Net worth does not add them twice.
- Bids are validated against pre-resolution cash.
- Ceramic markdown hits loose listings only, once per window, floor 40.
- The opening floor request is always Three Rooms, so a new player can finish something the six lots can satisfy.
- Auction idempotency keys in the client include a timestamp, so opening a second lot is not swallowed by the first.
- Tooling is TypeScript 5.8, Vite 6, Vitest 3, Phaser 3.87.0. That is a choice for Node 20, not a port of Futasaku's newer toolchain. Phaser is lazy-loaded for World Mode.
- No backend is connected. The SQL file is a draft.

## Simulated

Clerk Vesper. Moth and Hinge. The wire and the auction clock. The "live" feeling of a floor. All four are labelled. Do not add a fake online count.

## Real

The rules, the single price function, the ledger, the duel resolver, the save migration, and the tests. A number on screen came from those.

## Limitations

- A newer revision from another tab is adopted. Two tabs that write the same revision can still overwrite one save.
- A hand-edited save that still replays, and whose ledger still sums, is accepted. Production must pin rules on a server.
- Hidden condition can leak through a public price. The papers do not.
- Screens are plain HTML strings rebuilt on each action. Focus returns to the screen. That is simple and it is not a virtual DOM.
- The terminal script is about 34kb gzipped. Phaser is a separate chunk, about 338kb gzipped, fetched when World Mode opens.
- District pictures are Mineral Analog pack 02, drawn from the 64px files onto the 32px grid. The manifest still says `temporary`. The duel instrument is cropped from pack 05. Sixteen pack 04 catalogue plates are wired by definition id. Both stay `temporary` until the creator approves screenshots. Full source sheets are not in the client. Ground corners were filled so the paving meets. Roof caps sit on the north edge of a shell. The green course is only the south foundation of a building. The residence floor uses the stone course, so the room is not outdoor paving.
- The Confidential Creator Bible and the five visual mockups were not in the workspace, so they are not in the repo.
- Other regions exist as palettes only. There is no northern basin map yet.
- The world renderer is Canvas, one game instance, slept rather than destroyed when you leave. Headless Chrome on the development machine averaged about 16ms per Phaser update over the first 40 frames. That is not a phone measurement.
- The auction is one lot, with two scripted bidders.
- There is no account, no second human, and no shared market.

## How to balance

Read [ECONOMY.md](ECONOMY.md). Change a constant in `DEFAULT_RULES` or a param on a definition. Run `npm test` and `npm run sim`. If you change a number a test names, change the test in the same commit because the rule changed, not because the test was in the way.

## How to extend

[ITEM-SYSTEM.md](ITEM-SYSTEM.md) is the recipe for an object, an effect, a request, and an event. [BACKEND.md](BACKEND.md) is the recipe for a server. [FUTASAKU-REUSE.md](FUTASAKU-REUSE.md) says what must stay out.

## Next

1. Replace the stand-ins using the brief in [ASSET-PRODUCTION-PIPELINE.md](ASSET-PRODUCTION-PIPELINE.md). Approve nothing that breaks the perspective.
2. An isolated server, then a real second chair in a duel. The world transport stub is not that server.
3. A second location from [LOCATION-CREATION.md](LOCATION-CREATION.md), using the basin palette, still one scene class.
4. Per-object 64×64 plates, one catalogue id at a time, wired through `src/world/artwork.ts`.
5. Server-checked movement only after the economy is authoritative. Do not add a multiplayer process before that.

World notes live in [WORLD-ARCHITECTURE.md](WORLD-ARCHITECTURE.md), [MINERAL-ANALOG-ART-DIRECTION.md](MINERAL-ANALOG-ART-DIRECTION.md), [MOBILE-DESIGN.md](MOBILE-DESIGN.md), [RESONANCE-SYSTEM.md](RESONANCE-SYSTEM.md), and [MULTIPLAYER-ROADMAP.md](MULTIPLAYER-ROADMAP.md).
