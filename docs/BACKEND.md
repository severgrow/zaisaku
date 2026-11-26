# Backend

v0.1 does not connect to a server. There is no Supabase project, no URL, and no key in this repo. `supabase/migrations/0001_initial.sql` is a draft for a future Zaisaku-only database. Do not apply it to Futasaku. Do not point the client at Futasaku's project. Applying it anywhere costs a hosted database, so leave it until that project exists on purpose.

The client is the authority only on this device. The draft below is how a server becomes the authority without rewriting the rules.

## What the server must own

- The profile, the three wallets, and the ledger. Clients send commands. They do not send balances.
- Idempotency keys. A retried buy returns the stored result.
- Unique ownership. One instance, one owner, one location.
- The full duel state. Clients receive `viewFor` for their chair.
- Auction settlement, including escrow and the anti-snipe extension.
- The rules snapshot for a match. A client-supplied `startingCash` is ignored.
- Rating changes, if ranked play exists. The input is the match result, not the permanent wallet.

The functions to call are the ones already in `src/engine` and `src/economy`. A server adapter would load a profile, run the command, and store the returned value inside a transaction. It would not reimplement `appraise`.

## Access

The draft turns row security on and grants nothing to the public roles. Intended rules, written as comments in the migration:

| Data | Who can read | Who can write |
| --- | --- | --- |
| Own profile, wallet, ledger, vault | that player | the service role, from a command |
| Catalogue definitions | any signed-in player | service role, from a catalogue publish |
| Own contract, own papers, own receiver note | that player | service role |
| Opponent contract, opponent papers, future events, sealed actions | nobody through the client | service role |
| Public match view: cash, offers, active events, round | the two players | service role |
| Auction lot and bid history | players in that auction | service role |
| Another player's vault or permanent balance | nobody | nobody |

Guest play can stay local. A later account links by inserting a `players` row and attaching the guest profile id once. Until that exists, do not invent a login screen that looks connected.

## Tables

The migration creates: `players`, `profiles`, `wallets`, `ledger_entries`, `item_definitions`, `item_instances`, `price_quotes`, `transactions`, `auctions`, `auction_bids`, `contracts`, `market_events`, `matches`, `match_actions`, `match_results`, `ratings`, `cosmetics`, `idempotency_keys`.

`wallets.cosmetic` and `cosmetics` are for a later theme. A row there must not be joined into a price.

`match_actions` stores the same action log `replayDuel` already consumes, so a reconnect is a replay plus the private view.

## Local limits that a server closes

- A determined person can edit `localStorage`. The decoder rejects a ledger that does not sum, and it replays the duel so a patched cash figure dies. It still trusts a rules snapshot whose version is known. The server picks the snapshot.
- Prices are public and can hint at hidden condition. Papers stay server-side until an inspect command.
- Two browser tabs can race on one save. The server serialises commands.
- Simulated bidders and Clerk Vesper are local. A human opponent is a second authenticated player, and the bot remains available when the queue is empty. The bot still calls `chooseAction` on a view, on the server.

## Analytics

Keep the local counters, or write the same events into a first-party table. Do not add a third-party SDK. Useful events are already named: `first_session`, `return`, `first_duel`, `rematch`, `duel_duration`, `auction_join`, `market_action`, `contract_complete`.

## What not to build first

Payments, withdrawals, a premium shop, ads, and a shared global order book. The floor can stay NPC-priced while player auctions are the only peer exchange. That is the hybrid the market context was shaped for.
