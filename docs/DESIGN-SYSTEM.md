# Design

The [Art & Design Constitution](ZAISAKU-ART-CONSTITUTION.md) and [canonical references](art-direction/canonical-references/README.md) govern this implementation.

Status: temporary candidate. Quiet Instrument 06B styles menus and the world HUD. It is not approved. District pixels stay Mineral Analog. The duel keeps its own composition; this skin only shares type, colour, and button conventions. Do not treat the skin as final.

Menus should feel like a quiet instrument made on Zuisaku: charcoal surfaces, bone ceramic primary controls, muted olive secondary controls, amber only as an indicator, burgundy only for a destructive action. Hierarchy comes from the artwork, the type, and the space between them.

## Colour

Pack tokens in `web/src/ui/quiet/tokens.css`, mapped for the shell in `web/src/style.css`:

| Token | Hex | Use |
| --- | --- | --- |
| `--za-bg` | `#202420` | page |
| `--za-surface` | `#292e28` | quiet panels |
| `--za-raised` | `#383f35` | secondary controls, muted olive |
| `--za-bone` | `#d5c8ae` | primary controls |
| `--za-ink` | `#e4dcc8` | type |
| `--za-muted` | `#b4b8a9` | secondary type |
| `--za-line` | `#50574b` | hairline, only where a group needs an edge |
| `--za-amber` | `#d6ae68` | selection, meters, the clock |
| `--za-danger` | `#84544e` | destructive actions only |

The page background is also set on `web/index.html` so the first paint is charcoal, not white. `color-scheme` is dark. Positive amounts use a muted olive ink. Burgundy is not the primary button.

## Type

IBM Plex Mono is the interface font (`--za-font` and `--za-number-font`). Fraunces is only the wordmark and titles (`--za-display`). Both are vendored under `web/fonts/` (OFL). Nothing is drawn into an icon. Numbers use tabular figures. A missing heavier Plex weight is not synthesised; controls use weight 500.

Kickers are small, tracked, uppercase. Titles are serif and restrained.

## Layout

Mobile first. The shell is a top bar (wordmark, free Zai) and a five-item dock: Home, Duel, Market, Auction, Vault. Requests, Result, and Settings sit on the home floor and in the side column.

At 900px and wider the dock hides. A side column lists every room and repeats the balance. The duel becomes two columns: the table on the left, the decision on the right.

The duel decision bar is fixed above the dock on a phone, so bid, sell, inspect, and pass stay reachable at 360×800 and 390×844. The table scrolls behind it. On a wide screen the bar returns to the column.

Controls are at least 44px tall. The world Use control stays an 84px circle. Corners follow the pack: 10px surfaces, 8px controls, round HUD targets. A primary control is bone ceramic. A secondary control is the raised olive. A quiet control is a line. A destructive control is burgundy. Selection is an amber edge, not a second fill. Do not put a frame on every row.

Home rooms are a grid of tiles. The title and the note stack. They do not sit on one line.

## Art

`web/src/ui/art.ts` draws a 64px plate. Signature objects have their own mark. Everything else is a stable plate from the artwork key and the category accent. No WebGL, no spritesheet pipeline.

## Motion and sound

`prefers-reduced-motion: reduce` and the Settings choice `Reduce` both set `html.reduce`, which cuts animation and transition. Settings can also force motion on, or follow the system.

There is no white flash and no full-screen interstitial. A notice is a left-amber line inside the screen.

Sound is one quiet tick when a decision locks. It is off until Settings turns it on. It uses the WebAudio oscillator in the page. Nothing is uploaded.

Large type is a 118% root size, also in Settings.

## Voice

Short, specific, a little formal. Say who is simulated. Say the price the house will actually pay. Do not say a lot is live, a bidder is a person, or a balance is cashable.

The auction clock is seconds because the client ticks once a second. The label is "on the clock", and the bidders are "Moth · simulated" and "Hinge · simulated" in the history.

## What this is not

No jackpot motion, no confetti, no price tickers in green and red pairs, no product-grid photography, no hex board. A future theme may recolour the tokens. It may not recolour the prices.
