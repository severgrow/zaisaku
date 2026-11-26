# Design

Zaisaku should feel like a trading desk in a dim museum, not like a marketplace app and not like a casino.

## Colour

Tokens in `web/src/style.css`:

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#141311` | page |
| `--bg-2` | `#1c1a17` | cards |
| `--bg-3` | `#26221c` | meters, chips |
| `--ink` | `#e7e1d6` | bone type |
| `--muted` | `#9a9286` | secondary |
| `--line` | `#3c362e` | hairline borders |
| `--burgundy` | `#8d3d49` | the one filled action, losses |
| `--olive` | `#6e7544` | progress, gains |
| `--amber` | `#c4963a` | money, selection, the clock |
| `--teal` | `#5f8f8a` | a private hint, used rarely |

The page background is also set on `web/index.html` so the first paint is charcoal, not white. `color-scheme` is dark.

## Type

Fraunces for names and prose. IBM Plex Mono for numbers, kickers, and the dock. Both are vendored under `web/fonts/` (OFL) and declared in `web/src/fonts.css`. Numbers use tabular figures.

Kickers are small, tracked, uppercase mono. Titles are serif, medium weight, slightly tight.

## Layout

Mobile first. The shell is a top bar (wordmark, free Zai) and a five-item dock: Home, Duel, Market, Auction, Vault. Requests, Result, and Settings sit on the home floor and in the side column.

At 900px and wider the dock hides. A side column lists every room and repeats the balance. The duel becomes two columns: the table on the left, the decision on the right.

The duel decision bar is fixed above the dock on a phone, so bid, sell, inspect, and pass stay reachable at 360×800 and 390×844. The table scrolls behind it. On a wide screen the bar returns to the column.

Controls are at least 44px tall. Borders are 1px. Corners are square. One primary button per group is filled burgundy. The rest are line buttons.

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
