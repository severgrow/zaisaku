# Economy

All money is an integer number of Zai. The only price function is `appraise` in `src/engine/valuation.ts`. Basis points are parts of 10,000. Multiplication uses `mulBps` (floor) or `mulBpsCeil` (ceil) from `src/engine/money.ts`.

## The formula

Start from the definition's `baseValue` (at least 1). Multiply, in order, by:

1. **Condition.** `conditionFloorBps + floor(conditionSpanBps * condition / 100)`. Defaults: floor 5,500, span 4,500, so condition 0 is 0.55× and condition 100 is 1.00×.
2. **Rarity.** common 10,000, uncommon 11,500, rare 14,000, singular 18,000.
3. **Demand.** Starts at 10,000. Active events multiply category, tag, manufacturer, and rarity demand. The product is clamped to `demandMinBps`–`demandMaxBps` (5,000–18,000).
4. **Supply.** Event supply modifiers fold in. `supplyToPriceBps` is `clamp(20,000 - supply, 5,000, 16,000)`. Neutral supply (10,000) leaves the price unchanged. High supply lowers it.
5. **Effects.** Amber Hourglass adds `roundsHeld * perRoundBps`, capped. The Twins multiply when that holder has the pair. Null Magnet multiplies electronics while any shelf holds an active magnet. A counterfeit multiplies by `counterfeitBps` (4,500).

The product is the mid price.

- **Ask** (what the house charges) is `ceil(mid * askSpreadBps / 10,000)`, default 1.08×.
- **Liquidation** (what the house pays) is `floor(mid * bidSpreadBps / 10,000)`, default 0.86×.
- If the ask would not exceed liquidation, it becomes liquidation + 1.

An object bought and sold with no change of market or condition returns less than it cost. That is the guard against a free flip.

The public appraisal band is `± appraisalBandBps` (1,000, so ±10%). After an inspection (`narrowed`), the band is half of that. The band is not a promise. Settlement uses ask or liquidation.

A plain object, base 100, condition 100, common, genuine, neutral market: mid 100, ask 108, liquidation 86.

## Two economies

| | Duel | Permanent floor |
| --- | --- | --- |
| Opening | 1,000 per chair | 2,400 (`startingPermanent`) |
| Moved by | bids, sales, match request rewards | market buys and sales, auction settlement, floor request rewards |
| Kept in | the match state | `wallets.permanent` plus the ledger |
| Seen by the other | cash and shelf names | never |

`wallets.reserved` is escrow, already inside `permanent`, while you are the high bidder. Spending uses `permanent - reserved`. `wallets.cosmetic` stays 0. A cosmetic must not be spendable on an object and must not change `appraise`.

## The floor

`createProfile` opens the ledger with one `opening-balance` entry of 2,400, six listings, and the request Three Rooms (reward 180). Listings are instances. Buying moves one into the vault and debits the ask. Selling credits liquidation and removes it from the vault. You cannot sell what you do not own. A second buy of the same lot fails.

`advanceMarket` moves the tick. Events come from `activeAtTick`. Tick 0 is quiet. After that, each template holds for two ticks. The rotation is a shuffle of the seven templates with `mulberry32(deriveSeed(seed, 4))`. Ceramic Recall marks down loose listings once per window, by `ceramicMarkdown` (4), and not below `ceramicConditionFloor` (40). Vault objects and duel shelves are not marked down and are never deleted.

Collector requests use the same contract engine as the duel, with scope `persistent`. They expire after `requestLifetime` (18) ticks and a new one is assigned. The reward is credited once. A paid or inactive request does not pay again.

## Auctions

One open lot at a time, in `src/engine/auction.ts`. Time is ticks, not the wall clock. The client advances one tick per second while a lot is open.

- Opening bid step is `auctionIncrement` (10). A bid must rise by at least one increment over the current high bid.
- The reserve is checked at settlement, not when the bid is placed.
- While you are the high bidder, the profile sets `reserved` to your amount. The ledger does not move yet.
- If the clock has `auctionAntiSnipeWindow` (8) ticks or fewer, and extensions are under `auctionMaxExtensions` (3), a bid adds `auctionAntiSnipeAdd` (8) ticks.
- Settlement debits the winner once, idempotency key `settle:<id>`, and moves the object. A second tick does not charge again.
- Under reserve, the lot is refunded: reserved returns to 0, no object moves, no debit.
- Withdraw and cancel release escrow and do not charge.

Moth and Hinge are simulated. They bid only inside `tickAuctionProfile` when simulated bidding is allowed. They are named in the UI. They stop near 1.1× liquidation, raise at most three times, and open near 70% of reserve. A test can pass `allowSimulated: false` and settle a human bid alone.

## Ledger rules

Every permanent change appends a ledger entry. `decodeSave` requires `sum(ledger) === permanent`, non-negative balances, `reserved <= permanent`, `cosmetic === 0`, and unique instance ids across the vault and the listings. A mismatch rejects the save.

Idempotency keys live on the profile. Replaying a key is a successful duplicate and does not move money.

The client is not trusted for a future production balance. Locally it is the only authority, and it still runs the same validators. A save can be edited. If the edit breaks the ledger, it is discarded. If the edit rewrites a duel rules snapshot and the action log still replays, the replay trusts that snapshot. Production must pin the rules on the server. See [BACKEND.md](BACKEND.md).

## Balancing

Tune `DEFAULT_RULES`, effect params on the definitions, and event `demandBps` / `supplyBps`. Do not add a second formula. Run `npm run sim` and `npm test`. A healthy bot match finishes, keeps cash at or above zero, keeps a unique owner per object, and does not print a net worth many times the opening cash. The suite asserts net worth stays under five times the opening cash across a sample of seeds, and that bids actually happen.

If a sim runs away, change a rule constant or an effect param and update the tests that encode the new number. Do not weaken an assertion to hide the run.
