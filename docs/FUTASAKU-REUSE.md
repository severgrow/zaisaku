# What came from Futasaku

Futasaku is `github.com/severgrow/severgrow-01`. It was read, not modified. Zaisaku does not share its database, its players, its balances, or its login. None of its board game was copied.

The checkout that was read had a pure TypeScript engine, a mulberry32 helper, versioned rules, a save that replays an action log, a bot that chooses from a legal view, and a Vite client with reduced-motion styles. It did not contain a connected Supabase project.

## Reused

The idea that the rules are a pure module and the client is a shell around them. The idea that a save can be a seed plus a log, and that a bot may only see a player's view. Integer basis points. A rules version string stored on the match.

## Adapted

| Futasaku | Zaisaku |
| --- | --- |
| `src/engine/prng.ts` mulberry32, unbiased ints, shuffle | `src/engine/prng.ts`, plus `deriveSeed` so market, duel, and events do not share one stream |
| `src/engine/versions.ts` registry | `RULES_VERSIONS` in `src/engine/rules.ts`. One version, `zaisaku-v0.1` |
| Save v7 as seed + action log | Save v1. The duel replays. The permanent wallet is a ledger, not a replay, and is rejected if the sum disagrees |
| `chooseAction(view)` from legal actions | `src/bots/heuristic.ts`. Personalities are data. The table uses one balanced clerk |
| Server-core as pure functions, storage in an adapter | `src/economy/profile.ts` is the local authority. `src/persist/save.ts` is the adapter. SQL is a draft, not a client |
| Vite `base: './'`, Vitest, strict TypeScript | Same shape. Tool versions are the Node 20 set this repo pins, not Futasaku's newer toolchain |
| Reduced motion and theme tokens | New palette and type. The preference is the same idea: system, reduce, or allow |
| Relative production build, no heavy runtime deps | The terminal stays a thin client. World Mode adds Phaser 3.87.0 as a lazy chunk. |

## Rewritten

The entire game. Categories, objects, effects, contracts, the market formula, auctions, the vault, and the terminal UI are new. The duel is a simultaneous sealed bid, not a turn on a hex board.

The client is a hash-routed trading floor with a bottom dock, not Futasaku's board and dock of cards.

Auth and guest linking were read as a pattern (a guest profile that a later account can claim) and written down in [BACKEND.md](BACKEND.md). They are not implemented, because there is no isolated project to attach them to.

## Excluded

- Hex board, sprouts, fruit, blooms, veins, the coach, levels, and every Futasaku-specific rule. The district does not import that board.
- Futasaku production data, player balances, secrets, and auth credentials.
- Any Supabase URL, anon key, or service role from that project.
- Real-money flows, withdrawals, wagering, a premium shop, ads, and third-party analytics.
- Matchmaking, realtime channels, and reconnection code. The action log and the public/private view are the seams those would use. Copying the transport without a server would pretend a service exists.

## Why the split is strict

A shared wallet or a shared login would let a Zaisaku bug, or a Zaisaku experiment, move Futasaku value. v0.1 keeps the permanent ledger on this device and documents the tables a future Zaisaku-only project would own.
