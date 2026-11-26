# ZAISAKU — CODEX TAKEOVER: Cohesion, Craftsmanship & Playability

## 01. Your mission

Take over development of ZAISAKU:

https://github.com/severgrow/zaisaku

ZAISAKU is a persistent, non-combat economic game set on Zuisaku, a planet whose biology, chemistry, technology and spirituality developed differently from Earth's.

The vision is an atmospheric, expandable, walkable civilisation where players explore, collect, trade, research, speculate, compete and gradually establish their own place in the world.

The game is being developed by a solo creator using AI-assisted programming and artwork production.

A substantial amount of infrastructure, gameplay and artwork already exists, but the development work has become fragmented across branches, pull requests and asset packs.

Your job is to bring everything together and make it feel like a genuinely impressive independent game.

Do not simply complete a checklist.

Take ownership of the quality of the experience.

Act as a combined team of:

- Senior game engineer.
- Technical artist.
- Pixel-art director.
- Environmental designer.
- Mobile UX specialist.
- Industrial interface designer.
- Performance engineer.
- Experienced indie game developer.

The objective is to make the existing game look, feel and work exceptionally well before we expand it further.

## 02. Repository takeover

Inspect the latest repository state, all relevant branches, open pull requests, documentation and recent commits.

At the last repository inspection:

- PR #1 was merged into main.
- PR #2 contained Pack 04 technical artwork.
- PR #3 contained the Pack 05 duel instrument.
- PR #4 contained Quiet Instrument 06B.
- PR #5 contained Pack 07 catalogue artwork and district joins.
- PR #6 contained validated Pack 08B props.
- PR #7 contained intelligent tap-to-walk navigation.
- PR #8 contained Pack 10 path joins and interior furniture.
- PR #9 contained Pack 09 instruments and everyday objects.
- Pack 11 contained complete building shells and plaza assets.
- Cursor was working on a consolidated atmosphere pass.

These details may have changed. Verify the actual latest state before acting.

Do not assume that main contains the newest implementation.

Find and protect any newer consolidated integration branch.

Do not overwrite work currently being performed by Cursor.

Create a dedicated Codex integration and refinement branch from the most appropriate verified baseline.

Preserve recoverable checkpoints.

Consolidate compatible work into one coherent implementation, resolving conflicts deliberately.

Do not blindly merge every branch.

Specifically exclude rejected artwork, outdated interface directions and previously identified broken asset integrations.

## 03. Understand the game before changing it

Read the existing architecture, gameplay, economy, world and design documentation.

Understand:

- The deterministic TypeScript engine.
- The permanent player economy.
- The isolated duel economy.
- Item definitions and instances.
- Valuation.
- Auctions.
- Collector requests.
- Item ownership.
- Persistence.
- World interactions.
- Phaser scene lifecycle.
- Asset registry.
- Existing tests.

Play through the current game in a browser.

Complete a duel, purchase and sell an object, inspect the catalogue, explore the district, interact with characters and visit the residence.

Understand how the experience actually behaves before redesigning it.

Preserve what works.

## 04. Locked visual identity

There are three complementary visual systems.

### World — Mineral Analog

Rich but manageable pixel art:

- Bone ceramic.
- Green-grey mineral alloy.
- Charcoal.
- Restrained brass.
- Warm amber illumination.
- Muted burgundy.
- Unfamiliar native organisms.
- Rounded, appliance-like architecture.
- Consistent angled top-down perspective.

Buildings should resemble technology, mineral structures and cultivated architecture from another civilisation.

This is not alternative Japan, medieval fantasy or conventional cyberpunk.

### Duels — Sealed Exchange

A tactile physical exchange instrument.

Mechanical compartments, recessed object trays, subtle indicators, ceramic surfaces and analog controls.

The duel should feel like operating equipment manufactured on Zuisaku.

### Menus — Quiet Instrument

Modern industrial minimalism.

Inspired by the design restraint of Teenage Engineering, premium analog instruments and FUTASAKU.

Clean typography, precise spacing, quiet surfaces and meaningful controls.

The world is pixel art. Ordinary interface controls do not need to be.

Do not revert to the rejected decorative pixel-art RPG interface.

## 05. Artwork source and integrity

All artwork should be obtained from the existing repository and our dedicated staging branch:

https://github.com/severgrow/zaisaku/tree/art/mineral-analog-packs/art-packs

Inspect the actual archive contents and manifests.

Use validated runtime assets.

Do not import entire source sheets into the production application.

Do not assume every archived asset is approved.

Do not use mismatched character designs or incorrectly oriented building fronts.

Technical validation and artistic approval are separate requirements.

Retain original sources outside the production bundle.

If an asset is genuinely missing, document exactly what is required rather than silently introducing an unrelated substitute.

Reuse existing graphics intelligently before requesting more artwork.

## 06. First priority — one complete working game

Before undertaking extensive visual refinement, establish a consolidated build containing all compatible existing features.

This should include:

- Walkable District 01.
- Residence.
- Existing accessible building interiors.
- Intelligent tap-to-walk navigation.
- NPC interactions.
- Merchant transactions.
- Auctions.
- Collector requests.
- All 36 catalogue plates.
- Physical object displays.
- Existing duel gameplay.
- Sealed Exchange presentation.
- Quiet Instrument interface.
- Validated environmental artwork.
- Persistent player progress.

Everything must operate through the same existing game state and economic systems.

Do not create a second implementation of a system that already exists.

Once consolidated, run the complete test suite and establish a stable baseline.

## 07. Capture the starting experience

Before making substantial visual changes, capture actual application screenshots at:

- Desktop: 1440×900.
- Smaller laptop: 1280×800.
- Portrait mobile: 390×844.
- Small portrait mobile: 360×800.
- Landscape mobile: approximately 844×390.

Capture the district, residence, interiors, market, vault, auction, dialogue and duel.

Use these as a baseline for visual comparison.

Do not rely on generated mockups to evaluate implementation quality.

---

# WORLD ART DIRECTION

## 08. Fix the architectural composition

The district must stop looking like illustrated facades pasted onto flat roof slabs.

Inspect every building.

Where appropriate, use Pack 11 complete building shells that combine the front and roof into one coherent drawing.

Do not place complete shells over existing visible roofs.

Ensure:

- Consistent perspective.
- Believable roof depth.
- Appropriate building proportions.
- Correct door orientation.
- Grounded foundations.
- Accessible entrances.
- Correct visual anchors.
- Logical collision footprints.
- Correct foreground occlusion.

Keep visual sprite bounds separate from physical collision boundaries.

Do not rotate south-facing facades to simulate east, west or north-facing buildings.

If an entrance orientation remains unsupported, preserve or improve the working modular construction until the correct artwork is available.

## 09. Redesign the plaza composition

The central plaza should feel deliberately designed.

Use existing court paving, mineral paving, resonance paths, low walls, vegetation, furniture and architectural elements.

Create:

- A recognisable central gathering space.
- Clear pedestrian routes.
- Distinct commercial areas.
- Natural building approaches.
- Quiet areas.
- Meaningful landmarks.
- Appropriate negative space.

Avoid making the district look like a uniform rectangular field of repeated hexagonal tiles.

Use the existing artwork more creatively.

Do not increase map size merely to make the game appear larger.

A smaller, exceptionally composed district is preferable.

## 10. Audit every scale relationship

Review the player, NPCs, buildings, doors, windows, benches, counters, plants, crates, lamps, terminals and furniture together.

Correct inconsistent scale.

The player should plausibly fit through a doorway.

A counter should be at a believable working height.

A chair should look usable.

A building should feel like a building, not a toy.

A tree should have appropriate physical presence.

Do not treat every 64×64 PNG as an object that must occupy exactly one logical tile.

Preserve the 32px logical grid where appropriate, but allow visually appropriate sprite dimensions and footprints.

Establish and document final scale conventions.

## 11. Inspect every corner and connection

Perform an exhaustive visual audit of:

- Floor seams.
- Straight transitions.
- Inner corners.
- Outer corners.
- Wall connections.
- Foundations.
- Roof edges.
- Roof-to-wall joins.
- Doorframes.
- Windows.
- Railings.
- Thresholds.
- District boundaries.
- Interior edges.

Use the actual validated technical assets.

Prefer neighbour-based tile selection where appropriate.

Never conceal broken seams underneath decorative objects.

Inspect at native resolution and actual gameplay scale.

## 12. Ground everything with shadows

Establish a coherent lighting and shadow direction.

Use separate contact shadows beneath characters and props where appropriate.

Buildings should have meaningful architectural grounding.

Trees, machinery and furniture should not appear to float.

Avoid:

- Identical shadows beneath every object.
- Excessively dark shadows.
- Broad black circles.
- Double shadows on assets that already contain baked shading.
- Shadows that jitter during movement.

Use lightweight reusable textures and procedural geometry.

Shadows should never affect collision or interaction detection.

## 13. Lighting that feels intentional

Introduce a restrained shared lighting system.

Use existing lantern plants, lamps, illuminated windows, terminals and scientific instruments as meaningful local light sources.

Warm amber should become a recognisable aspect of Zuisaku.

However:

- Not everything should glow.
- The entire environment should not be dark.
- Do not use enormous yellow circles.
- Do not apply excessive bloom.
- Do not sacrifice readability for atmosphere.

Local illumination should gently affect nearby surfaces.

Keep the existing pixel-art detail visible.

Use colour temperature and contrast to distinguish interiors, public spaces and individual facilities.

## 14. Make the world alive

The district should feel quietly alive when the player stands still.

Add restrained ambient animation using existing artwork:

- Slight lantern-plant movement.
- Slow canopy movement where separate layers exist.
- Occasional terminal indicator changes.
- Subtle movement of hanging fabric.
- Gentle changes in illuminated materials.
- Infrequent scientific instrument activity.
- Small resonance pulses.
- Occasional drifting particles where appropriate.

Use shared animation systems.

Avoid independent timers for every sprite.

Avoid all objects moving in synchronisation.

Do not rotate or distort complete buildings.

Movement should feel organic, subtle and deliberate.

## 15. Make Resonance uniquely ZAISAKU

Refine the existing procedural resonance visual system.

Use:

- Geometric patterns.
- Small nodes.
- Subtle interference.
- Expanding or contracting rings.
- Material-specific colour accents.
- Occasional connections between related objects.

Resonance is a property of this fictional world, not a generic fantasy spell.

It should feel mysterious and meaningful.

Reserve stronger effects for actual relevant gameplay events.

Do not make every unusual object constantly pulse.

## 16. Improve environmental storytelling

Use existing assets to imply how inhabitants live.

Examples:

- A parcel and scale near a merchant.
- Research vessels beside a workbench.
- A quiet lamp next to a resting area.
- A partially occupied market stall.
- An empty display awaiting a collectible.
- A terminal positioned where somebody would naturally operate it.

Every arrangement should suggest purpose.

Avoid randomly scattering props across the map.

Do not fill all available space.

## 17. Make interiors feel like real places

Review all existing interiors.

The residence should feel personal, intimate and comfortable.

The exchange should feel commercial.

Research should feel precise and unusual.

The auction space should feel slightly ceremonial.

Do not use the same outdoor counter as every interior furnishing.

Use appropriate existing furniture from Packs 09 and 10.

Adjust room size and composition if the current interior feels unnecessarily empty.

Preserve clear movement and interaction routes.

Keep actual owned-object display slots empty until occupied by real inventory instances.

---

# MOVEMENT AND GAME FEEL

## 18. Intelligent navigation

The primary navigation system is point-and-click or tap-to-walk.

Mobile must not have a joystick.

Desktop may retain WASD and arrow keys as optional controls.

The player should be able to:

- Tap a destination and walk there.
- Tap a merchant and automatically approach to trade.
- Tap an NPC and automatically approach to converse.
- Tap an object to approach and inspect.
- Tap a doorway to enter.
- Tap a new destination to cancel the previous intent.

Preserve and refine the existing intent system.

Movement should communicate intention rather than require manual micromanagement.

## 19. Polish movement thoroughly

Inspect:

- Start responsiveness.
- Direction changes.
- Walking animation speed.
- Facing direction.
- Arrival behaviour.
- Stopping.
- Interaction positioning.
- Pathfinding around corners.
- Cancellation.
- Recovery from obstructed destinations.

Eliminate:

- Visible grid snapping.
- Excessive zigzagging.
- Animation flickering.
- Walking in place.
- Sliding.
- Incorrect facing.
- Delayed response to new destinations.

Preserve approved Pack 02 character artwork.

Do not replace character identities.

## 20. Camera craftsmanship

Make the camera feel carefully engineered.

Evaluate camera:

- Follow speed.
- Damping.
- Dead zones.
- Boundary clamping.
- Pixel alignment.
- Zoom.
- Mobile framing.
- Desktop framing.

The player should not feel trapped in a tiny visible area.

Neither should the character become too small to read.

Avoid abrupt camera jumps during ordinary movement.

Avoid unnecessary dramatic zooming.

Test map edges, interiors, scene transitions and orientation changes.

## 21. Touch interaction

Make touch controls exceptionally forgiving.

Improve hit areas without making adjacent entities difficult to distinguish.

Distinguish taps from drags, scrolling and multi-touch gestures.

Prevent menu interactions from moving the character underneath.

Make the selected destination or entity clear immediately.

Use subtle ground markers, selection feedback and contextual indicators.

Do not cover the environment with persistent icons.

The game should be comfortably playable with one finger.

## 22. Character presence

Give NPCs subtle presence without creating distracting behaviour.

Use validated idle variants where available.

Maintain consistent character shadows, foot anchors and visual scale.

Characters should face the player appropriately during conversation.

Ensure portraits correspond to the established characters.

Do not regenerate faces simply because a higher-resolution illustration would look more detailed.

## 23. Depth and foreground occlusion

Review depth sorting throughout the world.

Use ground anchors rather than arbitrary sprite centres.

Trees, roofs and foreground structures should obscure the player naturally.

Where necessary, fade only the relevant foreground layer.

Restore opacity smoothly.

Avoid making entire buildings transparent.

Prevent foreground decorations from intercepting unrelated ground taps.

---

# INTERFACE AND COMPETITIVE EXPERIENCE

## 24. Universal interface quality

Consolidate the entire interface around Quiet Instrument 06B.

Audit:

- Home.
- Navigation.
- Market.
- Vault.
- Auctions.
- Requests.
- Settings.
- Inspection.
- Dialogue.
- Results.
- World HUD.
- Confirmation windows.

Establish consistent:

- Typography.
- Spacing.
- Corner radii.
- Button proportions.
- Icon sizes.
- Panel hierarchy.
- Colour usage.
- Interaction states.

Remove inconsistent screen-specific styling.

Do not frame everything.

Use fewer, more meaningful controls.

The interface should feel premium and calm.

## 25. Typography and localisation

Keep every label, description, price, number, dialogue line and notification dynamic.

No baked-in lettering.

Fonts must remain interchangeable.

Support longer translated text, Unicode and Polish characters.

Use shared translation conventions where already available.

Ensure numbers align consistently.

Preserve large-text accessibility.

Avoid microscopic text, particularly on phones.

## 26. Make the home screen purposeful

The home screen should immediately communicate what the player can do.

Avoid treating the game like a settings dashboard.

Create a clear hierarchy between:

- Entering the world.
- Playing a duel.
- Checking the economy.
- Managing possessions.
- Reviewing relevant requests and events.

Remove redundant information and duplicate navigation.

Do not introduce unnecessary new features.

## 27. Make dialogue enjoyable

NPC conversation should feel like an interaction with an inhabitant, not a browser alert.

Use approved portraits or character busts.

Maintain:

- Clear character identity.
- Short readable dialogue.
- Meaningful contextual actions.
- Easy dismissal.
- Consistent window placement.

Keep the world visible where practical.

Opening and closing dialogue should feel smooth.

Never cover the entire mobile screen unnecessarily.

## 28. Catalogue and object presentation

All 36 catalogue objects should have their correct dedicated artwork.

Audit every mapping.

The same object must look consistent in:

- Market.
- Vault.
- Auction.
- Duel.
- Inspection.
- Residence.

Correct framing and scale.

Do not stretch object sprites.

Do not change object identities or definitions.

Make inspecting an object feel rewarding.

Use appropriate negative space and subtle visual emphasis.

Objects are the heart of the economy. Treat them accordingly.

## 29. Rebuild the duel presentation if necessary

The duel should be one of ZAISAKU's strongest experiences.

Use Pack 05 and compatible subsequent assets to make the duel feel like a physical exchange instrument.

Prioritise:

- Three clearly presented available objects.
- Readable valuations.
- Player inventory.
- Public opponent information.
- Private contract information.
- Countdown.
- Bid controls.
- Inspection.
- Selling.
- Passing.
- Sealed decisions.
- Resolution.
- Final scoring.

Do not reveal information the rules require to remain hidden.

Make the competitive state immediately understandable.

## 30. Portrait mobile duel

The portrait mobile duel is especially important.

Do not simply scale the desktop table down.

Do not reduce it to a generic list of cards either.

Create a responsive instrument composition using the compact exchange recess, scalable frames and variable object trays.

Keep the primary decision controls within comfortable reach.

The countdown must remain visible.

Bid adjustments must not overlap the timer.

Essential information should be available without excessive scrolling.

Test complete matches at both 360px and 390px widths.

## 31. Tactile feedback

Make controls feel responsive and deliberate.

Use subtle feedback for:

- Selecting an object.
- Changing a bid.
- Locking a decision.
- Confirming a transaction.
- Opening an inspection.
- Completing a round.
- Receiving a transmission.
- Finishing a contract.

Avoid exaggerated animation, confetti and casino-like presentation.

The game is about meaningful decisions and unusual objects, not gambling spectacle.

Do not delay competitive actions for decorative animation.

## 32. Audio and atmosphere

Inspect existing audio infrastructure.

Where appropriate, use restrained sound feedback:

- Mechanical clicks.
- Quiet terminal activation.
- Soft confirmation.
- Subtle environmental ambience.
- Door transitions.
- Resonance activity.

Use existing approved audio or original lightweight procedural sounds where suitable.

Do not introduce unlicensed audio.

Keep sound optional.

Avoid repetitive, irritating effects.

---

# ENGINEERING QUALITY

## 33. Protect the architecture

Continue using the existing TypeScript, Vite and Phaser architecture.

Do not migrate to another game engine.

Preserve deterministic domain logic.

Keep Phaser responsible for world presentation and interaction, not economic authority.

Maintain one shared player profile.

Do not duplicate wallets, inventories or gameplay state.

Avoid unnecessary frameworks and dependencies.

## 34. Protect persistence

Verify existing save migrations.

Ensure all existing progress survives the consolidated implementation.

Test:

- Reloading.
- Closing and reopening.
- World-to-terminal transitions.
- Returning from a duel.
- Item purchases and sales.
- Displayed inventory.
- Auctions.
- Contracts.
- Player location.
- Settings.

Never reset player progress simply to simplify implementation.

Address existing persistence defects where safe and well understood.

## 35. Performance audit

Establish measurable performance baselines.

Review:

- Startup.
- JavaScript bundle sizes.
- Texture loading.
- Asset duplication.
- Frame times.
- Memory.
- DOM rendering.
- Scene lifecycle.
- Event listeners.
- Timers.
- Camera updates.
- Pathfinding.
- Particle systems.
- Lighting.

Maintain lazy loading of Phaser and appropriate assets.

Do not load the entire artwork library before showing the terminal.

Avoid rebuilding the Phaser canvas during ordinary interface actions.

Cache reusable graphics.

Cull unnecessary offscreen effects.

Prevent memory leaks during repeated location transitions.

Measure actual results after optimisation.

Do not invent performance numbers.

## 36. Pixel rendering quality

Ensure consistent pixel-art rendering throughout the world.

Review:

- Nearest-neighbour filtering.
- Integer scaling where practical.
- Camera pixel alignment.
- Sprite coordinates.
- Texture resampling.
- Tile boundaries.
- Animation stability.

Eliminate shimmering edges and blurry sprite rendering where possible.

Modern interface text should remain sharp independently from pixel-art scaling.

## 37. Mobile-first reliability

Test portrait and landscape mobile experiences independently.

Verify:

- Safe areas.
- Touch targets.
- Viewport resizing.
- Orientation changes.
- Dialogue positioning.
- World visibility.
- Scroll containment.
- Browser backgrounding.
- Resuming.
- Loading.
- Gesture handling.

Do not treat mobile as a smaller desktop browser.

Both platforms should feel intentionally designed.

## 38. Accessibility

Preserve and improve:

- Reduced motion.
- Large text.
- Keyboard navigation.
- Visible focus indicators.
- Colour contrast.
- Accessible interaction semantics.
- Sound preferences.

Never communicate essential information through colour alone.

Reduced motion should preserve the game's atmosphere while removing unnecessary movement.

## 39. Security and economy integrity

Protect existing validation and ownership rules.

Verify that visual interactions cannot:

- Duplicate objects.
- Duplicate rewards.
- Reset balances.
- Bypass auction escrow.
- Modify permanent wealth through a duel.
- Reveal hidden opponent decisions.
- Trigger transactions from accidental movement taps.

The current client-local economy must remain clearly distinguished from a future authoritative production backend.

Do not claim that a local simulation is a real online economy.

## 40. Shared systems and future expansion

Whenever appropriate, convert repeated visual behaviour into reusable systems.

Examples:

- Contact shadows.
- Material lighting.
- Ambient animation.
- Interaction markers.
- Foreground occlusion.
- Character scale.
- Responsive panels.
- Object presentation.
- Location transitions.

Future districts should inherit these conventions automatically.

Do not build massive abstractions.

The architecture should remain understandable by future AI development agents.

---

# 20 ADDITIONAL QUALITY QUESTIONS

Before completing the pass, critically assess the implementation against these questions.

1. Does the world immediately look like ZAISAKU rather than a generic RPG?
2. Does every building belong to the same physical civilisation?
3. Do buildings feel constructed instead of pasted onto the map?
4. Can the player recognise important locations without reading labels?
5. Is the plaza visually interesting without feeling crowded?
6. Are all character and object proportions believable?
7. Is the district attractive even when no menus are open?
8. Does the world feel alive when the player stands still?
9. Are glows subtle and physically meaningful?
10. Do shadows make the environment feel grounded?
11. Does tapping anywhere produce an understandable response?
12. Can the player comfortably navigate with one finger?
13. Do interactions feel natural rather than mechanically triggered?
14. Does the residence feel worth returning to?
15. Do collectible objects feel desirable and meaningful?
16. Does the duel feel like operating a distinctive physical instrument?
17. Can a mobile player comfortably understand the competitive state?
18. Does every interface belong to the same design system?
19. Are there any unnecessary visual elements we could remove?
20. Would an actual indie game developer consider this a promising, polished vertical slice?

For each question, identify and fix the most important remaining weakness where feasible.

Do not merely answer the questions in a report.

Improve the game.

---

# EXECUTION AND DELIVERY

## 41. Work in priority order

P0 — Consolidate and protect working functionality.

P1 — Fix architecture, scale, seams and environmental composition.

P2 — Polish navigation, camera, collision and interaction.

P3 — Establish atmosphere, shadows, illumination and ambient movement.

P4 — Refine menus, dialogue, item presentation and duels.

P5 — Improve mobile layouts, accessibility and performance.

P6 — Perform final visual cleanup and regression testing.

Complete meaningful working improvements rather than spreading effort across unfinished systems.

## 42. Work autonomously

Do not repeatedly stop for minor design decisions.

Use the established ZAISAKU art direction.

Make sensible, reversible changes.

Do not spend the entire session producing documentation.

Do not stop after identifying issues.

Implement fixes, inspect actual results and iterate.

If a decision would fundamentally change gameplay, preserve the current behaviour and document the proposed change separately.

## 43. Scope protection

This is a consolidation, craftsmanship, reliability and visual refinement pass.

Do not introduce:

- Combat.
- Additional currencies.
- Monetisation.
- Real-money item trading.
- NFTs.
- New large-scale multiplayer infrastructure.
- Entire new districts.
- Major new progression systems.
- Unapproved lore changes.

Do not fundamentally redesign existing economic or duel mechanics.

Make the current experience excellent first.

## 44. Mandatory playtesting

Run the relevant automated tests and production build.

Then test actual browser interactions.

Complete these journeys:

### Journey A — Exploration

Enter District 01, tap several destinations, cancel a route, approach a character, converse and enter the residence.

### Journey B — Collecting

Purchase an object, inspect it, display it in the residence, return to the market and sell it.

Verify the residence display updates correctly.

### Journey C — Competitive play

Complete a full six-round duel on desktop and mobile.

Check every decision state, timer, result and return transition.

### Journey D — Persistence

Reload the game, verify balance and ownership, return to the world and confirm the player location and settings.

### Journey E — Stress

Repeatedly enter and leave locations, open and close menus, rapidly change navigation targets, resize the viewport and background the application.

Look for leaks, broken state, unexpected movement and visual defects.

## 45. Visual review and iteration

Capture actual screenshots after the first refinement pass.

Compare them with the baseline.

Critically review the screenshots.

Perform at least one further visual refinement pass based on what is actually visible.

Do not finish simply because the application builds or automated tests pass.

A technically correct game can still look and feel poor.

Visual review is part of the definition of done.

## 46. Final deliverables

Push the consolidated and refined implementation to GitHub.

Create one comprehensive pull request against main, unless a suitable existing consolidated PR already exists.

Do not leave the latest playable version scattered across separate branches.

Provide:

- Branch name.
- Commit SHA.
- Pull request link.
- Summary of consolidated features.
- Before-and-after screenshots.
- Desktop gameplay screenshots.
- Portrait and landscape mobile screenshots.
- Residence and interior screenshots.
- Dialogue screenshots.
- Market and vault screenshots.
- Desktop and mobile duel screenshots.
- Short gameplay recording where available.
- Test results.
- Build results.
- Performance measurements.
- Remaining defects.
- Outstanding asset requirements.

Clearly identify anything that is still temporary, simulated or unvalidated.

Do not merge into main until the integrated implementation has been reviewed.

## 47. Handover

Update the relevant architecture, art direction, asset and handover documentation.

Document the actual current implementation, not an aspirational description.

Future Codex or Cursor agents should be able to continue from this branch without reconstructing the entire project history.

Keep confidential creator lore out of public source code and documentation.

## Final creative instruction

ZAISAKU should not feel like a prototype made from AI-generated assets.

It should feel like a carefully designed independent game whose world has its own identity, history and internal logic.

Do not mistake graphical complexity for quality.

Do not mistake additional features for progress.

Do not mistake successful compilation for a good player experience.

Make the architecture believable.

Make the objects desirable.

Make the inhabitants feel present.

Make movement effortless.

Make the interface tactile.

Make the economy understandable.

Make the duel compelling.

Make the world quietly alive.

**Take everything that already exists and make it work together beautifully.**

The creator should open the next build and immediately feel that ZAISAKU has become a real game.
