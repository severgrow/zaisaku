# Integration handover — 26 November 2026

The [playable handover](INTEGRATION-PLAYABLE-SLICE.md) records work and verification after this baseline.

## Purpose and protected baseline

Review branch: `codex/za-integrated-2026-11-26`, targeted to `main` through **one review pull request**. The source branch began at Pack 09 `442c57901475abdc0498687e700cdb92eb3f4941`, a descendant of Pack 07 and Pack 04. Work from Cursor's existing PRs was merged only on new Codex-owned integration and probe branches. Cursor branches and `main` are untouched.

This is a consolidation branch **not an approved production release**. Do not imply the local economy is online or that the assets are final. Preserve guest save format and shared wallet, catalogue ids, object instance ids, duel economics, and the permanent/duel separation.

## Implemented on integration branch

- Pack 04 Mineral Analog world and Pack 07 plates and connectors inherited through the Pack 09 branch; 36 catalogue objects use the same dedicated plates across market, duel, vault, auction, inspection and residence.
- Pack 09 everyday physical props, floor thresholds, character busts, portrait duel instrument, and the residence/interior/market decoration already present on that branch.
- Pack 10 validated **paving-to-resonance-path** straights and outer corners, floor selection logic, and residence inlay were added with their runtime PNGs. Eight path join keys are registered, and unsupported combinations preserve plain floor. The additional Pack 10 furniture PNGs and portrait PNGs are present but **not yet all placed in rooms**.
- PR #7 tap-to-walk, pathfinding, target approach, route replacement, tap-vs-gesture classification, camera smoothing, optional desktop keyboard movement and joystick-free mobile controls. This was resolved against Pack 09's newer Phaser scene, including fixture draws, auction object updates, lighting and foreground fades.
- PR #4 Quiet Instrument 06B HTML menu/HUD styling, theme tokens, icon controls and accessible panel styling were integrated without reverting the Pack 09 physical duel instrument or reintroducing a joystick/Use button.
- The existing controller, profile and persistence architecture is retained. Portrait-aware dialogue, a talk card and contextual action handling share the single session.
- Automated CI in `.github/workflows/integration-check.yml` runs locked dependency install, typecheck/unit tests, catalogue validation, asset validation and production build. `tests/pack10-joins.test.ts` covers path joins and residence material.
- The existing `web/e2e/nav-proof.ts` was made portable to run on GitHub hosted Chrome and capture desktop, portrait and landscape screenshots. Screenshots are preserved as short-lived workflow artifacts. The browser scenario is **independent of the unit suite**; inspect the latest workflow run before declaring it passed.

## Compatibility decisions

- Keep the Pack 09 duel instrument, visible countdown and separate bid buttons over PR #4's older generic responsive duel layout.
- Keep Pack 09 physical fixtures and render order; preserve `watchKey()` so auction-lot changes redraw the physical stand.
- Keep tap-to-walk's `navigation.epoch` semantics. Menu interactions must cancel stale routes. Do not reintroduce the prior virtual joystick.
- Keep Pack 09 portrait artwork for established NPC identities. Missing characters or building orientations should not be faked.
- The Pack 10 connector data replaces the hard path-to-paving join wherever a supported neighbour combination is found; do not overlay props to hide unsupported seams.
- Retain Pack 09 residence furnishings. Pack 10 additions must be placed deliberately with sound walkable collision footprints, not simply added on top of existing props.

## Not included / unresolved

- PR #3 Sealed Exchange visuals are **not independently reconciled**; Pack 09 already includes later duel instrument work, but compare remaining source-only assets and gameplay states before declaring parity.
- PR #6 Pack 08B identity props and its 11 validated runtime images have **not been merged** into this integration branch.
- The alternative original Pack 08 artwork was explicitly rejected and must stay excluded.
- Pack 11 complete building shells, orientation-specific entrance solutions and a consolidated atmosphere pass were mentioned in the source handover but **not verified in this branch**.
- The new Pack 10 room furniture is present as PNGs but not fully staged. Inspect composition, scale, collision and actual gameplay screenshots before adding.
- No production backend, online authoritative economy, multiplayer server or approved final assets. There is no safe reason to create any of these in this visual pass.

## Mandatory remaining quality work

1. Review GitHub CI for the **latest head SHA**, not an older successful run; inspect browser failures and attached actual screenshots.
2. Check a full six-round duel on 360px/390px mobile and desktop, particularly physical tray size, hidden information, countdown, bid controls and return transition.
3. Verify spending/persistence across shop, vault, residence shelf, auction escrow and page reload.
4. Reconcile PR #6 approved 08B props and any genuinely missing Pack 03/05 visuals selectively, with screenshots and specific asset notes.
5. Stage Pack 10 furnishings in the actual places where useful, avoiding clutter or unusable walkways; review Pack 11 complete shell scale and orientation with creator.
6. Run a fresh before/after visual pass at 1440x900, 1280x800, 390x844, 360x800 and ~844x390. Do not claim screenshots are final merely because a build succeeds.
7. Keep `main` untouched until review and pass through one integration pull request. Document any browser scenario that was not exercised rather than asserting success.

## Commands

```bash
npm ci
npm run check
npm run catalogue
npm run assets
npm run web:build
E2E_OUT=/tmp/zaisaku-e2e npx tsx web/e2e/nav-proof.ts
```

The browser proof needs Google Chrome on the host; it no longer requires FFmpeg. Screenshots are captured from the running built app rather than generated mockups.

The target is a small, coherent, walkable and readable vertical slice, not an inventory of half-finished features.
