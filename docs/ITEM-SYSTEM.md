# Items, effects, requests, events

Objects are data. An effect is a type name plus parameters, never a function stored in the catalogue. `npm run catalogue` runs `validateCatalogue` and exits non-zero on a problem.

## Definition and instance

A definition (`ItemDefinition` in `src/engine/types.ts`, the list in `src/engine/definitions.ts`) is the catalogue row:

`id`, `name`, `description`, `lore`, `category`, `manufacturer`, `era`, `rarity`, `baseValue`, `conditionRange`, `collection`, `tags`, `artworkRef`, `supply`, `tradeable`, `inspectionProps`, `effectDefs`, `eventSensitivities`, `version`.

An instance is one physical object:

`id`, `definitionId`, `ownerId`, `condition`, `authenticity`, `acquiredAt`, `acquisitionPrice`, `status`, `revealedProps`, `serial`, `provenance`, `effectState`, `location`.

Categories: electronics, timekeeping, optical, ceramics, curiosities, magical.

Rarities: common, uncommon, rare, singular.

v0.1 ships 36 definitions. Most are ordinary. A minority carry an effect. Makers are fictional: Kite & Hollow, Brine Instrument, Sable Atelier, Northglass, Pell & Daughter, Vesper Works, Orry Foundry, Lampblack, Mare & Co., Quiet Bureau. There are no real-world brands.

Named pieces include the Tomorrow Receiver, the Dream Receiver, the Moon Clock, the Null Magnet, the Amber Hourglass, the Silent Telephone, the Orchid Vessel, the Red Box, the Memory Lens, and The Twins (left and right).

Artwork refs are keys. `web/src/ui/art.ts` draws a plate for the signature keys and a stable generated plate for the rest. A missing ref fails the catalogue check. The picture is 2D, a museum plate, not a model.

## Add an object

1. Append a definition in `src/engine/definitions.ts`. Use a new id. Point `artworkRef` at a key you also handle in `art.ts`, or accept the generated plate and still set a non-empty ref.
2. Keep `baseValue` a positive integer. Set `conditionRange` inside 0–100.
3. If it has an effect, use a type from `EFFECT_TYPES` and only the parameters in `EFFECT_SCHEMA` (`src/engine/catalogue.ts`).
4. Run `npm run catalogue` and `npm test`.
5. If the duel should offer it early, add the id to the featured pool in `src/engine/duel.ts`. Otherwise it enters with the rest of the shuffle.

Do not put code in the definition.

## Effects

Registry: `src/engine/effects.ts`. Types and required params:

| Type | Params | What it does |
| --- | --- | --- |
| `amber_hourglass` | `perRoundBps`, `capRounds` | Each round held adds that many basis points, up to the cap (5 rounds, 800 each, in the shipped object). |
| `null_magnet` | `category`, `demandBps` | While any shelf holds an active magnet, that category's mid price is multiplied (electronics, 8,500). |
| `red_box` | `rounds`, `damage`, `floor` | After `rounds - 1` the holder is warned. On the next round-end, one other owned object above the floor loses `damage` condition, and not below the floor. The box then discharges and does not fire again. The object is never deleted. |
| `tomorrow_receiver` | `lookahead` | The holder learns the next event whose start is still ahead. The opponent does not. |
| `twins` | `pairId`, `bonusBps` | If that holder has both twins, both get the bonus (12,000 on the shipped pair). |
| `memory_lens` | `extraReveals` | An inspection reveals that many extra hidden properties (1, so two papers). |

Triggers, in the resolution order: on inspection, on sale, on acquisition, while held, round end. Round start refreshes receiver knowledge. Contract completion is a separate step and does not re-enter effects. Each effect runs at most once per object per round. There is no loop back into rewards.

Condition never falls below the effect floor, and a paid or cosmetic object is not in this catalogue. Nothing in v0.1 destroys an instance.

## Add an effect

1. Add the type to `EffectType`, `EFFECT_TYPES`, and `EFFECT_SCHEMA`.
2. Handle it in `effects.ts` and, if it changes price, inside `appraise` only.
3. Document the order. Do not call `appraise` from an effect in a way that calls the effect again.
4. Add a definition that uses it, and a test that locks the numbers.

## Requests

Templates are `CONTRACT_TEMPLATES` in `src/engine/contracts.ts`. Shipped:

| Id | Title | Reward | Target |
| --- | --- | --- | --- |
| two-timepieces | Two Clocks | 160 | 2 |
| same-maker | One Workshop | 140 | 2 |
| three-categories | Three Rooms | 180 | 3 |
| matching-pair | The Pair | 220 | 2 |
| sell-two-profit | Two Quiet Profits | 200 | 2 |
| authenticated-rare | Papered Rare | 190 | 1 |
| magical-and-ordinary | Both Registers | 150 | 2 |
| no-damage | Clean Shelf | 130 | 2 |
| hold-three-rounds | A Long Loan | 120 | 3 |
| profit-curiosity | A Curious Profit | 150 | 1 |

`hold-anything` (A First Lot, reward 40) is the fallback if a dealt template would be impossible. The opening floor request is always Three Rooms.

`contractAchievable` checks the catalogue, not a lucky deal. A match will not deal a template the objects cannot satisfy. Hold-three-rounds is impossible if the match is shorter than its target. Matching-pair needs both twin definitions.

The same progress function serves a match request and a persistent one. A later daily or weekly quest should be another template with a scope and a lifetime, not a second engine. NPC collectors would be a persistent request with a named giver.

## Add a request

1. Add a template id, title, description, reward, and target.
2. Teach `progressOf` and `contractAchievable` the new id.
3. Add a test with a small inventory that completes it, and one that shows an impossible catalogue does not deal it.
4. If it should appear on the floor, add it to the persistent rotation in `src/economy/profile.ts`.

## Events

Templates are `EVENT_TEMPLATES` in `src/engine/events.ts`:

Analog Revival, Lunar Exhibition, Ceramic Recall, Counterfeit Scandal, Import Suspension, Red Frequency, Forgotten Manufacturer.

Each has a rumour (one round or tick early), a warning, a summary, and demand or supply modifiers aimed at categories, tags, manufacturers, or rarities. Ceramic Recall also marks loose listings. No event deletes an owned object.

Match events: up to three, starting on rounds 2, 4, and 6, lasting two rounds, clipped to the match length, chosen with the match seed.

Floor events: `activeAtTick(seed, tick)`.

## Add an event

1. Append a template. Use 10,000 for a modifier you do not want.
2. If it must change condition, do it in a named function like `markCeramicListings`, once per window, with a floor, and never on a vault or duel-held instance.
3. Add a test that the same seed and tick return the same active set, and that a later tick moves on.

Simulated time is the tick or the round. A later server job can call the same functions on a schedule. It should not invent a second resolver.
