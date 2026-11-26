# Mobile design

World Mode and Terminal Mode share one profile. A purchase on a phone is the same command as a purchase on a desktop. Nothing is priced differently per viewport.

## World

- Landscape is the comfortable world view. Zoom is 2, so a tile is 64 CSS pixels.
- Portrait world still runs: joystick, Use, and a taller view. It is usable and tighter. The terminal remains the portrait surface for market, auction, vault, requests, and duels.
- The joystick and Use hide at 900px and above. Desktop uses WASD, arrows, E, and Space. Clicking the ground counts as Use. There is no click-to-move.
- When the viewport is shorter than 520px the camera sits below the player so the controls do not cover the body.
- Safe areas inset the bar, the joystick, and Use.
- The HUD is a balance, Terminal, Vault, a prompt, and the controls. Panels scroll. They are the existing market, auction, vault, and request screens, not a second copy of the rules.

## Terminal

`#/` and the other hash routes are the trading terminal. Portrait at 390px keeps the dock and the type size already used for v0.1. Large text is the settings toggle (`html.large-text`). Reduced motion is system, reduce, or allow, and it also freezes the resonance rings.

## Tokens

Colour, type, and spacing stay the variables in `web/src/style.css`. World chrome uses the same charcoal, bone type, and amber. Buttons in the bar are at least 44px. The Use target is 84px. Text is Fraunces and IBM Plex Mono, not a pixel font.

## What not to do

Do not put a desktop sidebar into the world on a phone. Do not cover the canvas with labels. The prompt appears only when someone is in range, and it names them.
