# Roadmap

v0.1 is the offline floor: a full duel, a market, a vault, one auction, requests, events, a save, and a SQL draft. These are the next pieces, in the order they unblock each other.

## 1. An isolated server

Stand up a Zaisaku-only project and apply `supabase/migrations/0001_initial.sql` there, with the row-security comments turned into policies. Commands go through the existing engine. The client keeps the local adapter for guests.

This is the one that makes every later online feature honest. It is also the one that can cost money, so it waits for an explicit decision.

## 2. A real two-player duel

Transport the action log. Each client sends `submit` payloads. The server resolves and returns `viewFor`. Reconnect replays the log. The clock is server-side. Clerk Vesper remains the fill-in when the second chair is empty. Ranked results read the match score, never the permanent wallet.

## 3. Longer balance evidence

`npm run sim` is a short sample. Run a wider seed sweep, record net-worth spread, request completion rate, and how often the Red Box or the Twins decide a match. Change `DEFAULT_RULES` or a definition param, and lock the new number with a test. Add another personality only after the balanced clerk is boring on purpose.

## 4. Quests on the same contract engine

Daily and weekly requests are templates with a lifetime and a scope. NPC collectors are a name on that request. Do not write a second progress function.

## 5. Themes that cannot touch price

A cosmetic is a token set or a plate frame, paid from `wallets.cosmetic` if it is ever paid at all, stored in `cosmetics`. `appraise` does not read it. No payments and no ads in that step either. Selling a theme for real money is a different product decision and is out of scope until the server exists.

## District, after the stand-ins

The first outdoor map and the residence are in. The pictures are temporary. The next art pass follows [ASSET-PRODUCTION-PIPELINE.md](ASSET-PRODUCTION-PIPELINE.md). A second place follows [LOCATION-CREATION.md](LOCATION-CREATION.md). Multiplayer waits on the server in step 1. See [MULTIPLAYER-ROADMAP.md](MULTIPLAYER-ROADMAP.md).

## Deliberately later

Live player auctions against humans, a shared rotating market, matchmaking, and account linking. The auction and market types already have the fields. They do not need a second design, they need the server from step 1.

## Cut line

If a pass runs long, cut how many definitions, templates, or personalities ship. Do not cut the split between duel cash and permanent cash, the single price function, the private view, or the ledger check.
