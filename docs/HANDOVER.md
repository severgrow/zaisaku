# Handover

Zaisaku v0.1 is a playable offline terminal in this repository. The branch that introduced it is the open pull request against `main`. Futasaku was not modified.

## Setup

Node 20.19 or newer. From the repo root: `npm install`, then `npm run web:dev`. Check with `npm run check`. Build with `npm run web:build`. Catalogue with `npm run catalogue`. A JSON sim with `npm run sim`.

The production client is static files in `web/dist`. There is no environment variable and no secret.

## How a session works

The first visit creates a guest named Guest, seed from `crypto.getRandomValues`, permanent balance 2,400, six lots, and the request Three Rooms. The home floor shows the name, the balance, one transmission, the request, and the four rooms.

Duel starts a match that does not touch that balance. Lock a bid, an inspection, a sale, or a pass. Owned objects stay without a separate action. Clerk Vesper locks as well. After six rounds, or when the objects and the clock run out, the result screen shows both chairs. Rematch starts another isolated match.

Market buy spends permanent Zai. Vault inspect reveals papers. Vault sell pays liquidation, which is less than the ask if the wire has not moved. Advance the transmission to change the event and the prices. The auction escrows a bid, ticks once a second, and settles or refunds.

Reload reads `zaisaku.save.v1`. A broken file is copied to `zaisaku.save.corrupt` and a fresh ledger opens, with a notice.

## Decisions already made

- Rewards go into cash and are listed again on the result so the player can see them. Net worth does not add them twice.
- Bids are validated against pre-resolution cash.
- Ceramic markdown hits loose listings only, once per window, floor 40.
- The opening floor request is always Three Rooms, so a new player can finish something the six lots can satisfy.
- Auction idempotency keys in the client include a timestamp, so opening a second lot is not swallowed by the first.
- Tooling is TypeScript 5.8, Vite 6, Vitest 3. That is a choice for Node 20, not a port of Futasaku's newer toolchain.
- No backend is connected. The SQL file is a draft.

## Simulated

Clerk Vesper. Moth and Hinge. The wire and the auction clock. The "live" feeling of a floor. All four are labelled. Do not add a fake online count.

## Real

The rules, the single price function, the ledger, the duel resolver, the save migration, and the tests. A number on screen came from those.

## Limitations

- One tab is the authority. Two tabs can overwrite one save.
- A hand-edited save that still replays, and whose ledger still sums, is accepted. Production must pin rules on a server.
- Hidden condition can leak through a public price. The papers do not.
- Screens are plain HTML strings rebuilt on each action. Focus returns to the screen. That is simple and it is not a virtual DOM.
- Nonessential screens are small and shipped in the one bundle. The gzipped script is on the order of 30kb. Splitting them is optional, not a correctness gap.
- The auction is one lot, with two scripted bidders.
- There is no account, no second human, and no shared market.

## How to balance

Read [ECONOMY.md](ECONOMY.md). Change a constant in `DEFAULT_RULES` or a param on a definition. Run `npm test` and `npm run sim`. If you change a number a test names, change the test in the same commit because the rule changed, not because the test was in the way.

## How to extend

[ITEM-SYSTEM.md](ITEM-SYSTEM.md) is the recipe for an object, an effect, a request, and an event. [BACKEND.md](BACKEND.md) is the recipe for a server. [FUTASAKU-REUSE.md](FUTASAKU-REUSE.md) says what must stay out.

## Next

The five steps in [ROADMAP.md](ROADMAP.md): an isolated server, a real two-player duel on the action log, a wider balance sweep, quests on the existing contract engine, and themes that cannot change a price.
