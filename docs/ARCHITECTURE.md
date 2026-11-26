# Architecture

Zaisaku is one TypeScript project. The rules do not know about the browser. The browser does not invent prices.

```
src/engine/     pure rules: duel, prices, effects, contracts, events, auction clock
src/economy/    permanent profile: wallet, vault, market lots, auction escrow
src/persist/    versioned save, migration, replay
src/bots/       personalities and the heuristic
src/sim/        bot-versus-bot matches
src/tools/      catalogue validator
web/            Vite client: shell, screens, art, sound
supabase/       SQL draft only. Not connected.
tests/          Vitest against the engine and the profile
```

There are no runtime dependencies. Vite, TypeScript, Vitest, tsx, and Playwright Core are dev dependencies.

## Purity

`src/engine/` has no `Math.random`, no `Date`, no network, and no timers. Seeds go through `mulberry32` in `src/engine/prng.ts`. Auctions advance by integer ticks. The match clock in the browser is a `setInterval` outside the engine. When it hits zero, the client calls `expire`, which is a pure pass.

`Date.now` and `crypto.getRandomValues` live in `web/src/main.ts`, and only for save seeds, local analytics timestamps, and idempotency keys.

## One price function

`appraise` in `src/engine/valuation.ts` is the only price formula. The duel, the market, the vault, and the auction all call it. Spreads, demand clamps, and effect modifiers are rules fields, not copies of the arithmetic.

## Three wallets

A profile holds:

- `permanent` — the floor balance. Buys, vault sales, auction settlement, and request rewards move this.
- `reserved` — escrow inside the permanent balance while an auction bid is winning. Available funds are `permanent - reserved`.
- `cosmetic` — always 0 in v0.1. A future skin must not change a price.

A duel has its own cash and inventory, created by `createDuel`. It never reads the permanent wallet. Ranked worth is the match score only.

## Commands

Profile changes go through functions in `src/economy/profile.ts`: `buyListing`, `sellOwned`, `inspectOwned`, `advanceMarket`, `openAuction`, `bidInAuction`, `withdrawAuctionBid`, `cancelCurrentAuction`, `tickAuctionProfile`. Each returns a `Result`. A failed command does not mutate. Idempotency keys are stored on the profile. The same key returns the previous success and does not apply twice.

Duel changes go through `submit` and `expire` in `src/engine/duel.ts`. An illegal action is rejected and the state is unchanged. When both chairs have locked, the round resolves in `RESOLUTION_ORDER` (`src/engine/rules.ts`).

## Public and private match state

`viewFor(state, player)` in `src/engine/view.ts` is what a client may render. It omits the opponent's contract, the opponent's known papers, sealed decisions, and future event summaries. Prices and a coarse condition word are public. Tomorrow Receiver knowledge is private to the holder. The full `DuelState` stays on the authoritative side. Locally, that side is the same tab. A server must keep the full state and send views.

## Persistence

`encodeSave` / `decodeSave` in `src/persist/save.ts` speak Save v1: profile, duel, settings, last result. The duel is restored by replaying `actionLog` from the seed, so a tampered cash figure does not stick. The permanent balance must equal the sum of the ledger or the whole save is rejected. A v0 file `{ version: 0, name, permanent, seed }` migrates by opening a profile and crediting the difference from the opening grant.

The browser adapter is `localStorage`. Replacing it means implementing the same encode/decode boundary. Gameplay functions do not call `localStorage`.

## Bots

`chooseAction(view, personality)` in `src/bots/heuristic.ts` sees only that player's view. It must return an action `validateAction` accepts. `BALANCED` is Clerk Vesper. `AGGRESSIVE` is Red Bidder, used by the sim, not the table. `playMatch` in `src/sim/match.ts` runs a full game with no UI.

## Client

`web/src/main.ts` owns the session, the hash routes, the two timers, and persistence. Screens are functions from the session to HTML. The shell is `web/src/ui/shell.ts`. Art is inline SVG in `web/src/ui/art.ts`. Sound is a short WebAudio tick, off by default, and it never leaves the device.

Routes: `#/`, `#/duel`, `#/market`, `#/auction`, `#/vault`, `#/contracts`, `#/results`, `#/settings`.

Local analytics are counters on `profile.analytics.counts`: first session, return, first duel, rematch, duel duration, auction join, market action, contract complete. They are not a third-party SDK.

## Cosmetics, later

Theme tokens are CSS variables in `web/src/style.css`. A future cosmetic is a named token set or an artwork frame. It is stored on the cosmetic wallet's ledger and in the `cosmetics` table of the SQL draft. It must not be an input to `appraise`.

## What is intentionally absent

No accounts, no network duel, no shared market, no payments, no ads. Those wait on an isolated backend. See [BACKEND.md](BACKEND.md).
