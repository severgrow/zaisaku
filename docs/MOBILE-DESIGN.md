# Mobile design

World Mode and Terminal Mode share one profile. A purchase on a phone is the same command as a purchase on a desktop. Nothing is priced differently per viewport.

## World

- Landscape is the comfortable world view. Zoom starts at 2, so a tile is 64 CSS pixels. A wider window shows more of the district. A pinch can zoom; it never walks the player.
- Portrait is the same game with one finger: tap ground to walk, tap a person or object to approach and interact. There is no joystick and no permanent Use button.
- WASD, arrows, E, and Space remain. A movement key cancels a tap course. E still works when someone is already in range.
- Safe areas inset the bar and any open card. The card is the existing market, auction, vault, or request screen, not a second copy of the rules.
- The HUD is a balance, Terminal, Vault, and a prompt that appears for feedback or when someone is already in range. Panels scroll. Dragging a panel does not move the player.

## Terminal

`#/` and the other hash routes are the trading terminal. Portrait at 390px keeps the dock and the type size already used for v0.1. Large text is the settings toggle (`html.large-text`). Reduced motion is system, reduce, or allow, and it also freezes the resonance rings.

## Tokens

Quiet Instrument 06B tokens in `web/src/ui/quiet/` govern HTML menus and the world HUD; the Phaser pixel-art canvas stays separate. Tap-to-walk has no virtual joystick or permanent Use control. World panels stay compact and portrait does not scroll sideways. Touch targets are at least 44px; Fraunces is the display face and IBM Plex Mono is the interface face.

## What not to do

Do not put a desktop sidebar into the world on a phone. Do not cover the canvas with labels. The prompt appears only when someone is in range, and it names them.
