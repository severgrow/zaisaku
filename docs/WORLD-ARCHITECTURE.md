# World architecture

See the [Art & Design Constitution](ZAISAKU-ART-CONSTITUTION.md) and [original visual references](art-direction/canonical-references/README.md).

District 01 and the residence are another interface onto the existing ledger. Phaser draws the place and reads input. It does not own items, prices, or rewards.

## Split

| Layer | Path | Owns |
| --- | --- | --- |
| Rules | `src/engine/` | Duel, `appraise`, effects, contracts, events. No Phaser, no browser, no clock. |
| Profile | `src/economy/profile.ts` | `buyListing`, `sellOwned`, `inspectOwned`, `bidInAuction`, the ledger. |
| World data | `src/world/` | Maps, movement, materials, palettes, asset checks, resonance math, a transport stub. Pure. |
| Save | `src/persist/save.ts` | Version 2. Same key, `zaisaku.save.v1`. |
| Controller | `web/src/controller.ts` | One session. Terminal screens and the world both call it. |
| World view | `web/src/world/` | Phaser scene, painters, HUD, tap navigation, workshop. |

`web/src/main.ts` paints HTML and listens for clicks. It does not keep a second wallet.

## Phaser lifecycle

`#world-host` is a sibling of `#app`, outside the subtree `innerHTML` replaces. `web/src/world/gate.ts` imports Phaser only when the route is `#/world`. The terminal bundle does not include that chunk.

There is one `Phaser.Game`. Leaving World Mode calls `loop.sleep()` and drops the live course. Coming back calls `loop.wake()` and `scale.refresh()`. Buying, selling, or opening a panel replaces the HUD and leaves the canvas, the scene, and the player's position where they are. The renderer is Canvas, `pixelArt`, and nearest-neighbour CSS. Zoom starts at 2 so a larger window shows more of the district. A pinch can change it; a pinch is never a move.

The scene writes `x`, `y`, and `facing` on the session while the player moves. `persist()` runs when a walk arrives, a keyboard move ends, an interaction opens, or the location changes. It does not run on every pixel. A saved pose inside a solid tile is moved to the nearest free cell.

## Locations

`src/world/locations.ts` builds `district-01` (32×24) and `residence` (14×10). `locationById` is the only lookup the scene uses. An ordinary room is a `LocationDef`: tile grid, solid grid, spawns, exits, actors, palette id, and an optional resonance point. The scene does not have a subclass per room.

Actors are inhabitants, stalls, benches, and shelves. An exit changes location through `travelTo`, which uses `poseFor`. Research, auction, and duel doors are actors. They call the same profile and duel commands as the terminal. They are not map exits and they do not mint Zai.

## Displays

A shelf stores an inventory instance id in `world.displays`. `reconcileDisplays` drops an id the vault no longer holds. Selling from the world vault clears the shelf. Placing checks ownership. The same id cannot sit on two shelves.

## Conflict

Each save has `revision` and `writer`. `chooseSave` adopts a stored file only when its revision is newer than this tab's. Two tabs that save the same revision can still overwrite each other. That remaining race is recorded in [HANDOVER.md](HANDOVER.md).

## Tap navigation

The district is the interface. One course is active. The most recent tap replaces it. There is no queue, no virtual joystick, and no permanent Use button. Mouse and touch share `interpretTap`. WASD and arrows still walk, and they cancel a course. E or Space still uses whatever is already in range.

| Intent | When it runs |
| --- | --- |
| move | Empty ground, including a decorative sprite. The player stops at the tapped point, not on a tile centre. |
| approach | The walk to an anchor. It is not a second tap. |
| talk | A person, or a line with nothing further to do. |
| trade | Merchant. Opens the existing market. The tap does not buy. |
| research | Researcher or bench. |
| inspect | Flora, resonance, or a look at a shelf. The line already on the actor is the whole observation. |
| display | Manage a shelf. A shelf offers Inspect and Manage together. |
| operate | Trading terminal, duel terminal, or auction desk. |
| enter | A door into a room. Walk to the entrance, face it, then a short charcoal fade. |
| exit | A door out. `symbol: 'transit'` is the leave door. |
| sit, collect, open, follow | Named extension points. Nothing offers them and nothing runs them. |

Approach anchors are the free cardinal neighbours. The preferred slot is the way the actor faces: the customer side of a counter, the front of a shelf, the operating side of a terminal. A door uses the open side in front of the frame, north, south, east, or west. `chooseAnchor` keeps that slot when it is not a long detour, otherwise it takes the short walk. The player does not stand on the entity. Several slots can exist for a later visitor.

`planRoute` in `src/world/path.ts` is A* on the solid grid. Eight directions, and a diagonal is refused when either side tile is blocked. The route is smoothed once per tap. The scene only follows the waypoints. Input, the intent, the path, the step, the sprite, and the interaction check are separate functions so a later server can test range without a scene.

A blocked tile becomes the nearest free cell that does not tour a building. If nothing sensible is reachable, the prompt says so and the player stays. An unknown exit says the way is shut. After a transition the old course is gone.

To add an entity, add an `ActorDef` or an `ExitDef`. `primaryIntent` and `offeredActions` read `kind` and `form`. Do not add a navigator. One action runs on arrival. A person gets a short card: name, the existing line, Leave, and that action. Two actions get the same card as a menu. Closing the card leaves the player where they are.

## What is not here

No Colyseus process. No second economy. No Tiled file import yet: the grid is the same idea (a layer of tile ids plus a collision layer), and a later importer should fill a `LocationDef` rather than add a scene class. Audio beds are `null`.
