# ZAISAKU — iterative GPT asset production

Source of truth: `art/production-queue.json`. Work one pack at a time, beginning with A01. All new art is a candidate, not approved.

## Cycle
1. Read current integration head, queue, approved assets and actual browser screenshots. Review existing PRs to avoid duplicating work.
2. Establish a scale board: logical tile 32px, actor 24×32px, typical source density 2×. Render the existing shell footprint and entrance coordinate beside the actual actor. A building must read as architecture, not furniture; test roof mass, door scale and visual hierarchy before changing maps. Preserve existing walkability and interaction positions until a deliberate map redesign is reviewed.
3. Generate original art with GPT image generation using the scale board and existing Mineral Analog artwork as references. One building or coordinated family per image; consistent orthographic projection, material and light direction. No text, perspective drift, baked terrain, cast shadows attached to transparent padding or mixed scales. First generate a comparative concept sheet, then isolated source sprites after visual approval.
4. Save raw candidates under `art/candidates/<pack>/` with prompts, source images and metadata. Never overwrite runtime assets. Cut and clean alpha edges; quantize only when appropriate; use nearest-neighbor for pixel resizing. Specify logical footprint, source dimensions, pivot, doorway and layer for every export. Roof/foreground may overhang, but collision only follows the intentional ground footprint.
5. Validate PNG dimensions, transparent margins, file names, alpha, anchor, palette consistency, duplicate files and manifest integrity. Compare against existing assets; don't upscale a bad asset as a substitute for art direction.
6. Stage only reviewed candidates on a dedicated art branch. Reuse existing valid Pack 08B/10 art before generating replacements. Render the actual game at 390×844 and 1280×800; add 360px and landscape checks for significant changes. Verify walking, entrances, actor occlusion, interaction targets, save/reload and frame time.
7. Record screenshots, rejected candidates, rationale and next pack in the queue. Open a draft PR; never merge to main without creator review.

## Automation boundary
The queue and review loop are reusable without API credentials. A scheduled ChatGPT task may review the queue and generate candidates when the image generation tool is available in that execution. If it is unavailable, produce a specific generation brief and report the blocker, not a fabricated PNG. A fully unattended GitHub Actions image generation job requires a separately configured image API credential, billing and explicit budget; never add secrets to the repository or spend without authorization.

## Direction
Calibrate architecture first, then create density through clusters of useful props, asymmetric plazas, planted edges and points of interest. Keep negative space for movement and make the player readable. Avoid generic fantasy, neon cyberpunk, excessive detail, repeated filler and UI-like buildings. Maintain the mineral, bone, charcoal and warm amber world identity.
