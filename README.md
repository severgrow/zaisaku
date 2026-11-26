# Zaisaku

A quiet trading terminal. Two collectors sit a sealed duel. The same house also runs a market, one timed auction, and a vault. Everything has a price. Nothing has a fixed value.

Zaisaku v0.1 is playable offline. Currency is an integer called Zai. There is no real-money trading, no payments, and no third-party analytics. It does not share a database, wallet, or login with Futasaku.

## Run it

Node 20.19 or newer.

```bash
npm install
npm run web:dev
```

Open the URL Vite prints. The app is a static client. Progress is kept in `localStorage` under `zaisaku.save.v1`.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run check` | Typecheck and the Vitest suite |
| `npm run web:build` | Production build into `web/dist` |
| `npm run web:preview` | Serve that build |
| `npm run catalogue` | Validate the object catalogue |
| `npm run sim` | Twenty-four bot-versus-bot matches, printed as JSON |

## What you can do

- Sit a six-round duel against Clerk Vesper, a labelled simulated opponent. Bid, inspect, sell, or pass. Owned objects stay without a separate action. Your request stays hidden. Effects and a market event can change the table. The result shows both scores.
- Buy from the market with the permanent balance, keep the object in the vault, inspect it, and sell it back. An immediate flip loses money.
- Finish the collector's request on the home floor. The opening request is Three Rooms.
- Open one timed auction. Moth and Hinge are simulated house bidders. A late bid can extend the clock.
- Advance the wire. A market event changes prices. Owned objects are not destroyed.
- Reload the page. A valid save comes back. A corrupt save is set aside and a new ledger opens.

## What is real, and what is simulated

Real, on this device: the rules, the prices, the duel, the permanent wallet, the vault, the auction settlement, and the save file.

Simulated, and labelled in the interface: Clerk Vesper, Moth, Hinge, the market wire, and the passage of auction time. There is no live second player and no connected backend. The SQL in `supabase/migrations/` is a draft for a later isolated project. It is not applied.

## Read next

- [docs/GAME-RULES.md](docs/GAME-RULES.md) — the duel
- [docs/ECONOMY.md](docs/ECONOMY.md) — prices, wallets, auctions
- [docs/ITEM-SYSTEM.md](docs/ITEM-SYSTEM.md) — objects, effects, requests, events
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the code is split
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — the terminal
- [docs/FUTASAKU-REUSE.md](docs/FUTASAKU-REUSE.md) — what was borrowed
- [docs/BACKEND.md](docs/BACKEND.md) — what a server would own
- [docs/ROADMAP.md](docs/ROADMAP.md) — what comes after v0.1
- [docs/HANDOVER.md](docs/HANDOVER.md) — how to keep going
