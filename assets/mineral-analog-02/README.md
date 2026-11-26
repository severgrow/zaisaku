# ZAISAKU Mineral Analog — Art Pass 02

AI-generated replacement candidates, based on the approved Mineral Analog direction.

- `native/`: 20 manifest-compatible primary PNGs (32x32, 24x32 or 64x64).
- `animation/`: player 16 frames, sheet 96x128, rows S/W/E/N, columns frame 0–3.
- `npc/`: 3 NPCs, four idle facings each, sheet 96x96, rows Ivo/Archivist/Ness, columns S/W/E/N. NPCs are not animated walk cycles.
- `large/`: double-resolution alternative sprites, not drop-in 32px tiles.
- `reference/`: extracted high-resolution crops.
- `sources/`: untouched generated sheets.

Cursor: use existing asset keys and renderer at aa11b6e or newer. Load PNGs with nearest-neighbour and retain fallbacks. Keep all assets temporary until actual desktop/mobile screenshots are approved. Ground/path are decorative generated tiles, not verified seamless: inspect a repeated grid and repair edge joins or create variants if necessary. Architecture images are single-cell candidates, not a verified modular edge kit; review wall/roof joins and use larger sprite overlays where appropriate without changing collision grid. For transparent tiles, preserve base ground beneath overlays. Character frame anchors are bottom-centre; check animation jitter and foot contact. NPC direction art is idle only. Keep original source files available; native resizing may lose detail. Palette contains additional accent colours intentionally matching the visual references, not a strict palette-locked set. No gameplay changes. Run npm run assets, npm run check, npm run web:build and take actual gameplay screenshots.
