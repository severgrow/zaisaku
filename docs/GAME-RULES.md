# Game rules

Rules version `zaisaku-v0.1`. The numbers live in `DEFAULT_RULES` (`src/engine/rules.ts`). A match stores the snapshot it was dealt. Changing the defaults does not rewrite a match already in a save.

## The table

Two players. Each starts with 1,000 Zai, configurable as `startingCash`. That cash is not the permanent balance.

Six rounds (`rounds`). Three new objects each round (`objectsPerRound`). A decision window of 20 seconds (`decisionMs`) is enforced by the client. The pure engine only knows that a chair has locked or that `expire` was called.

The opponent in the client is Clerk Vesper, personality `BALANCED`, and the interface says they are simulated.

Highest final net worth wins. Equal net worth is a draw. The permanent wallet is not an input.

## A round

1. The table shows the objects still on offer, the public market, and each player's own request.
2. Each chair picks one action. It stays sealed until both have locked, or the clock expires.
3. The engine resolves in this order (`RESOLUTION_ORDER`):

   validate, inspect, sell, bid, on-inspection, on-sale, on-acquisition, while-held, round-end, contracts, linger-and-deal, round-start

4. Inventory, cash, and the next offer update. After the last round the phase is `complete`. No new deal is laid.

Bids are checked against cash from before the resolution. Selling in the same round does not fund the bid.

## Actions

**Bid.** A sealed offer on one object on the table. The amount is at least `minBid` (20) and a multiple of `bidIncrement` (5) after snapping, and it cannot exceed that player's cash. The highest valid bid pays its own amount and takes the object. The loser keeps their money. Equal highest bids leave the object unsold. An uncontested bid buys at that bid.

**Sell.** One object you hold, at its current liquidation price. The price is appraised before the object leaves the shelf, so a held effect still applies.

**Inspect.** Reveals hidden papers on one object, on the table or on your shelf. Memory Lens reveals one extra property. The opponent does not learn what you read.

**Hold.** An explicit pass. Keeping what you already own is free. You do not have to name a held object to keep it.

## Objects that nobody buys

An unsold object stays while `round - arrivedRound + 1 < lingerRounds`. `lingerRounds` defaults to 2, so a lot is available on the round it arrives and the next round, then leaves.

## Score

`netWorth = cash + liquidation value of the shelf`.

Request rewards are paid into cash when the request completes, and `contractRewards` records that sum for the result screen. The score does not add the reward a second time.

Profit is `netWorth - startingCash`.

The result lists, for each chair: starting wealth, final cash, shelf if sold, request rewards already inside the cash, net worth, profit, the winner, and the round notes.

## Hidden information

A player's view includes their own request, their own papers, and their own Tomorrow Receiver note. It does not include the opponent's request, the opponent's papers, the opponent's sealed action, or a future event's numbers.

One round before an event starts, both chairs see the vague rumour string. The numeric summary arrives when the event is active. Active events are public.

Prices and the coarse condition word (damaged, tired, worn, sound, fine) are public. An exact condition and authenticity stay hidden until inspected. A careful reader can sometimes infer them from a price. The papers and the written explanation still stay hidden.

## The clock

If the window ends, `expire` locks a pass for that chair. One expiry leaves the round open. The second expiry, or a lock from the other chair, resolves it. The log says the clock closed the chair.

## Requests at the table

Each chair is dealt one template that the catalogue can satisfy (`contractAchievable`). Progress is checked after the round's effects. The reward is paid once. Templates and the way to add one are in [ITEM-SYSTEM.md](ITEM-SYSTEM.md).

## Bots

A bot receives the same view a human would, and the same validator. It does not see the human's request or an event that has not started. `AGGRESSIVE` exists for simulations. The table does not use it.

## Draws and abandoned matches

A match where both chairs only hold can draw. Leaving the match from the client discards the duel state and does not touch the permanent wallet.
