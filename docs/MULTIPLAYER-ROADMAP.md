# Multiplayer roadmap

The district is local. The people in it are inhabitants. The interface must not call them online players.

## Seams that exist

`src/world/transport.ts` defines `PlayerInput` and `WorldTransport`. `localTransport` accepts a pose and does nothing. The scene calls `send` with a stable location id, pixel position, facing, and a sequence number. A later transport replaces that function. It does not replace `buyListing` or `submit`.

Entity ids on actors are stable strings (`ivo`, `to-residence`, `shelf-a`). Location ids are stable. Displays store inventory instance ids.

Economic commands stay on the profile. A future server has to authorise them. The world client must not.

## What a later server would sync

- Other people walking in a district, with server-checked movement when it matters.
- Chat or a shared gesture, separate from the economy.
- The auction room as the same auction the terminal already runs.
- A visit to a residence, and a player stall, both reading the same inventory.
- Reconnect from `locationId` plus the pose in the save.

## What this pass does not do

No Colyseus package. No world server process. No simulated crowd labelled as players. Clerk Vesper, Moth, and Hinge stay labelled simulated opponents and house bidders.

Movement validation on a server can reuse `move` and `reachable`. They are pure. The renderer stays in the browser.
