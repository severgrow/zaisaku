# Location creation

A new street or room is data. Add it to `LOCATIONS` in `src/world/locations.ts`. Do not add a Phaser scene class.

## Record

```ts
{
  id: 'basin-gate',          // stable. Never reuse an id for a different place.
  name: 'Basin gate',
  paletteId: 'basin',        // key in src/world/palettes.ts
  width, height,
  tiles,                     // number grid, ids from TILE in src/world/tiles.ts
  solid,                     // from solidFrom, then occupy() on actors that block
  spawns: { gate: { tx, ty, facing } },
  exits: [{ id, tx, ty, to, spawn, label, symbol }],
  actors: [/* ActorDef */],
  resonance: null,           // or { tx, ty }
  audioBed: null,
  blurb: 'One sentence a player can read. No hidden canon.',
}
```

`buildDistrict` shows the pattern: `blank`, `border`, `stampShell` for a reusable building, then paths, plants, and actors.

## Shells

`stampShell(tiles, x, y, w, h, doorFacing)` fills a footprint with roof and interior, one door, one round window, and an awning on the ground tile in front. Use it for a shop. Do not draw a unique building when a shell plus a sign will do. The sign is the actor's `symbol`.

## Actors

`kind` is what the controller opens:

| kind | Result |
| --- | --- |
| merchant | Existing market. Buy and sell call `buyListing` and `sellOwned`. |
| auction | Existing auction screen. |
| research | Inspect owned items. |
| contract | Existing request screen. |
| duel | Starts `createDuel`. The opponent is labelled simulated. |
| terminal | Hash route back to the terminal home. |
| storage | Vault screen. |
| display | Place or clear one owned instance id. |
| rest, flora, resonance | A line of text. No money. |

Set `form` to `person`, `terminal`, `flora`, or `furnishing`. A person gets a coat and an accessory. `slot` is the display id or `null`.

Interaction range is 1.65 tiles, in `inRange` and `nearest`. The actor's own cell is solid unless `kind` is `resonance`. Put the spawn on a walkable neighbour. `reachable` from the gate is the test that the path is real.

## Collision

`SOLID_TILES` blocks roofs, walls, windows, doors, counters, pipes, vents, trees, reeds, veinflora, lanterns, and interior. Lamps and awnings stay walkable. Movement slides on one axis. Diagonal speed matches cardinal speed (`wish`).

## Persistence

The save stores `locationId`, pixel `x` and `y`, `facing`, `displays`, `discovered`, and `flags`. `travelTo` adds the destination to `discovered`. `markFlag` records `met:{actorId}` and grants nothing.

## Checks

Add a reachability assertion in `tests/world.test.ts` for the new gate and each door. Run `npm test`. Walk it in `#/world` before calling the layout done.
