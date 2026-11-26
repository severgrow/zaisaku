# Resonance

Resonance is a natural behaviour of Zuisaku, drawn as a few shapes, not as a spell effect on every object.

## Now

`DISTRICT_RESONANCE` in `src/world/resonance.ts` describes the plaza pattern: three rings, a 4200ms period, amber `#d29a3a`, max radius 18. `ringRadius` is pure. The scene strokes circles with a Phaser graphics object. No frames are stored.

While `html` has the class `reduce`, the clock passed to `ringRadius` is 0, so the rings hold still. That class follows the existing reduced-motion setting.

The actor `plaza-rings` is not solid. Standing near it shows the prompt and a line: the rings are not on any notice. It does not pay Zai.

## Later

A new pattern is another `ResonanceSpec`: rings, or a small set of nested rectangles, or a line between two points. Keep the count low, the alpha low, and the meaning specific (a live material, a mature plant, an unstable reading, an anomaly). Do not add a glow sprite per object. Do not run the effect on every lamp.

The scene should keep drawing with graphics primitives. A hand-drawn sheet is for a single approved case, not the default.
