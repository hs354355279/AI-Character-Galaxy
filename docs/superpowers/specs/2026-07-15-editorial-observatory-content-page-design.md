# Editorial Observatory Content Page Design

**Date:** 2026-07-15

**Status:** Direction A approved; specification review pending

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

The active lesson page will become an **Editorial Observatory**. The relationship galaxy remains a dark, interactive spatial field, while navigation, mission guidance, evidence, and character selection adopt the same restrained editorial language used by the landing page, course register, and character atlas.

The redesign removes the current three equal-weight dark panels. The galaxy becomes the dominant stage. Mission guidance becomes a narrow editorial rail, evidence becomes a content-sized contextual sheet, and the character index becomes a deliberate filmstrip along the bottom edge. The page remains a single desktop viewport and returns to natural document flow on smaller screens.

The 3D scene will also be recalibrated. Characters must occupy visibly distinct spatial sectors, labels must remain crisp at every zoom level, and the selected person must remain the exact semantic origin without triggering a camera jump.

## 2. Problems to solve

### 2.1 Visual continuity

- The landing page and directory pages use large editorial typography, paper surfaces, asymmetric composition, and generous spacing.
- The active lesson currently resembles a generic three-column dashboard composed from equally bordered dark cards.
- The mission and evidence columns stay full height even when their content is short, creating large areas of unused space.
- The relationship galaxy reads as a small object centered inside a large empty panel instead of the main learning surface.

### 2.2 Spatial legibility

- Second-degree characters inherit too much of their first-hop direction and visually stack behind one another.
- Collision separation accepts distances that are too small for planets plus labels.
- The wide initial camera framing makes planets and relationship lines appear undersized.

### 2.3 Label clarity

- Labels currently use very small base font sizes.
- Distance-based CSS `scale()` rasterizes the transformed label layer and becomes visibly soft when the learner zooms.
- Subpixel transforms and translucent blur reduce the apparent sharpness of compact text.

## 3. Goals

- Make the active lesson feel like the functional center of the same editorial exhibition as the landing and directory pages.
- Give the galaxy at least 70 percent of the usable desktop composition when the evidence sheet is closed or content-sized.
- Keep mission state and evidence continuously available without treating them as full-height dashboard columns.
- Give every visible character a clearly separated planet and label at the default camera position.
- Keep character names crisp and readable while zooming, rotating, and switching the semantic origin.
- Preserve deterministic missions, reviewed evidence, 2D equivalence, WebGL fallback, keyboard access, reduced motion, and mobile flow.

## 4. Non-goals

- Rewriting lesson content, missions, scoring, evidence, or GPT-5.6 contracts.
- Replacing the procedural planets with flat images.
- Moving labels into WebGL textures or sprite canvases.
- Adding post-processing, bloom pipelines, physics, or free-flight camera controls.
- Turning the lesson into a long scrolling presentation on desktop.
- Redesigning the landing page, course register, character atlas, or source pages again.

## 5. Selected direction

### A. Editorial Observatory

The selected direction combines a paper editorial guidance layer with a full-bleed dark spatial field.

Alternatives rejected:

- **Paper archive with embedded space:** strongest visual match to the directories, but the framed canvas reduces spatial presence.
- **Full-screen projection room:** strongest immersion, but evidence reading and mobile adaptation become less reliable.

The Editorial Observatory keeps the learning task familiar while allowing the galaxy to dominate.

## 6. Desktop composition

The desktop page remains one viewport and uses four visual layers rather than three full-height cards.

### 6.1 Shared exhibition header

- Retain `ExhibitionHeader` and its global destinations.
- Use the paper material treatment from public editorial pages, with ink text and a restrained dark active-course marker.
- Keep `3D galaxy`, `2D list`, `Reset`, and `Sources` together as contextual lesson controls.
- Replace the separate centered title strip with a compact course identity line inside the observatory composition.

### 6.2 Mission editorial rail

- Width: approximately 15 to 17rem on large desktop.
- Use a light neutral paper surface rather than another dark glass panel.
- Show mission progress as a vertical sequence of five precise marks.
- Give the current mission title strong editorial hierarchy and cap prompt line length around 30 characters per line.
- Keep hint, response, validation, and continue controls in normal document flow inside the rail.
- The rail may scroll internally only when a mission genuinely exceeds the viewport.

### 6.3 Full-bleed galaxy stage

- Occupy all remaining width and the full available height below the header.
- Remove the boxed-card appearance around the canvas.
- Use a subtle paper-to-ink edge transition where the mission rail meets the galaxy.
- Move course type, lesson title, people count, and relationship count into a restrained stage caption at the upper edge.
- Keep the semantic-axis legend compact and visually subordinate at the lower left of the galaxy.

### 6.4 Contextual evidence sheet

- Render the existing evidence content as a content-sized sheet anchored to the upper right of the stage.
- Default width: 20 to 23rem.
- Use an opaque near-white or lightly tinted surface with ink text, not blurred dark glass.
- When no character or relationship is focused, show a compact instructional state instead of an empty full-height column.
- Long evidence may scroll inside a bounded sheet, but the sheet must not change the galaxy camera or page height.
- The sheet never blocks the bottom character index and never intercepts camera input outside its bounds.

### 6.5 Character filmstrip

- Anchor the character index along the lower edge of the galaxy.
- Use editorial rows with a group symbol, name, and short role.
- Increase the visible item width enough to avoid early ellipsis on typical names.
- Selected state uses the group color as a solid material, matching the atlas rather than a generic glowing button.
- Horizontal scrolling remains deliberate and does not create page-level overflow.

## 7. Responsive composition

### 7.1 Tablet, 801 to 1180px

- Paper header remains compact.
- Mission rail becomes a horizontal mission strip above the galaxy.
- Evidence becomes an inline sheet below the galaxy or a bounded drawer opened by selection.
- Character filmstrip stays directly below the galaxy.
- The page may use natural vertical scrolling.

### 7.2 Mobile, up to 800px

- Use the existing complete 2D list as the default learning surface when space or WebGL quality is constrained.
- Order content as mission, galaxy or 2D list, character index, evidence.
- No fixed overlays, clipped dialogs, or horizontal document overflow.
- Controls use full readable labels rather than icon-only actions.

## 8. Visual system

### 8.1 Materials

- Page and mission surface: true neutral off-white with a slight brand tint, avoiding a generic beige dashboard.
- Galaxy: existing near-black ink field with mineral blue, coral, violet, and course-group accents.
- Evidence sheet: opaque paper with high-contrast ink text.
- Dividers: hairline ink rules used as editorial structure, not borders around every region.
- Shadows: avoid broad ghost-card shadows. Use material contrast and one restrained edge shadow only where the evidence sheet overlaps the galaxy.

### 8.2 Typography

- Continue the existing system and SF Pro inspired sans stack.
- Mission title: 1.55 to 1.8rem at desktop.
- Evidence title: 1.4 to 1.65rem.
- Stage caption and UI controls: 0.72 to 0.82rem with limited uppercase use.
- Character label name: fixed 13 to 14px, semibold.
- Character label role: fixed 11 to 12px.
- Do not use CSS scale to create hierarchy in product text.

### 8.3 Motion

- Mission and evidence surfaces use 180 to 240ms state transitions with ease-out-quart or ease-out-quint timing.
- Selecting a person dampens the relationship space toward new coordinates without moving the camera target.
- The evidence sheet changes content using a short opacity and vertical transition.
- Reduced motion snaps coordinates and changes content without spatial travel.

## 9. Three-dimensional distribution

The existing semantic axes remain authoritative:

- Radius: relationship proximity and graph degree.
- Vertical: affinity versus conflict.
- Depth: personal versus public context.
- Horizontal: incoming versus outgoing direction plus deterministic lanes.

The placement system changes from a mostly radial inheritance model to a semantic sector model.

### 9.1 Direct relationships

- Use a first shell whose radius varies approximately from 6.8 to 9.2 world units.
- Strong relationships stay closer to the origin; weaker direct ties move outward.
- Reserve deterministic angular sectors for each direct neighbor.
- Preserve semantic Y and Z scores, then add a bounded tangent offset so characters with similar scores do not overlap.

### 9.2 Second-degree relationships

- Use a second shell approximately 10.2 to 13.2 world units from the origin.
- Inherit the first-hop semantic quadrant, but occupy an independent child sector instead of the same ray.
- Apply a stronger tangent contribution than direct neighbors.

### 9.3 Context characters

- Use a sparse outer shell approximately 13.5 to 15.5 world units from the origin.
- Clamp depth so no context character approaches or crosses the camera plane.
- Treat context relationships as visually faint and allow labels to reduce detail before hiding entirely.

### 9.4 Collision rules

- Raise minimum world-space separation from roughly 1.05 to at least 2.2 units for non-origin nodes.
- Use planet radius, label class, and relationship layer when calculating separation.
- Run deterministic angular retries; never use runtime randomness.
- Keep every computed coordinate finite and stable for the same lesson seed and selected target.

## 10. Camera and planet scale

- Tighten the default perspective from the current wide overview while keeping every first- and second-degree character inside the teaching viewport.
- Use a field of view around 39 to 41 degrees and an initial camera distance derived from the semantic layout bounds, capped to avoid an excessively distant overview.
- Keep orbit target fixed at the origin.
- Preserve damping and disable panning.
- Increase visual planet size moderately, with selected origin receiving the strongest halo rather than a disproportionate sphere.
- Keep hit spheres slightly larger than visual geometry so selection remains reliable.

## 11. Crisp HTML label system

Labels remain HTML because they are more legible and testable than canvas textures.

- Remove distance-based CSS `scale()` from label transforms.
- Project to integer or half-pixel screen coordinates and apply only `translate3d` plus centering.
- Use fixed font sizes and a fixed minimum label height.
- Use opaque or near-opaque label backgrounds without `backdrop-filter`.
- Use distance for opacity, role visibility, and z-order, not text scaling.
- Selected and direct labels show name and role; distant context labels may show the name only when collision pressure is high.
- Keep labels pointer-transparent so planet hit testing remains authoritative.
- Preserve diagnostic world-coordinate data attributes and the always-clickable bottom character index.

## 12. Component boundaries

```text
components/learning/
  LearningExperience.tsx       phase and selection state
  ObservatoryShell.tsx         editorial desktop/tablet composition
  MissionPanel.tsx             mission content only
  EvidencePanel.tsx            evidence content only
  CharacterRail.tsx            bottom filmstrip

components/galaxy/
  GalaxyScene.tsx              canvas, labels, camera, semantic legend
  PlanetNode.tsx               procedural planet and hit target
  RelationshipField.tsx        live relationship geometry
  RelationshipSpaceController.tsx

lib/layout/
  relationship-space.ts        deterministic semantic sectors
  relationship-transition.ts   damped shared display vectors
  relationship-camera.ts       bounded camera-fit calculation
```

`LearningExperience` remains the source of lesson state. Layout composition moves into a focused shell component so phase logic does not become coupled to desktop styling. Mission and evidence components continue to own content behavior, not page positioning.

## 13. Testing strategy

### Unit

- Semantic sectors remain deterministic for the same lesson and target.
- Origin remains exactly `[0, 0, 0]`.
- Minimum non-origin node separation meets the new threshold.
- Direct, second-degree, and context shells stay inside their declared bounds.
- Camera-fit output is finite, bounded, and stable.

### Component

- Editorial shell exposes mission, stage, evidence, and character index landmarks.
- Evidence empty state and focused state remain readable.
- Label classes reflect selected, direct, and context detail levels.

### Browser

- Desktop document and galaxy stage have no vertical scroll range at 1440 by 900 and 2048 by 1024.
- Default projected labels use a font size of at least 13px for names.
- Label transform contains no scale operation before or after zoom.
- Repeated zoom and character switching produce no blurred-scale state, camera jump, overlap regression, or runtime error.
- Projected planet centers have a meaningful minimum screen-space separation at the default view.
- Planet selection still wins when a relationship line crosses the pointer ray.
- Tablet, mobile, reduced-motion, 2D fallback, and both complete lesson journeys still pass.

## 14. Acceptance criteria

- The active lesson reads as part of the same editorial system as the landing page, course register, and character atlas.
- The galaxy is the dominant desktop surface, not one card among three.
- Mission and evidence surfaces do not create large unused full-height panels.
- Character names remain crisp at default, zoomed-in, and zoomed-out views.
- No label uses CSS scale.
- No two non-origin planets are closer than the approved deterministic separation threshold unless a test fixture explicitly contains only the origin.
- The selected character remains the exact origin and switching targets does not move the camera target.
- All existing learning, evidence, accessibility, fallback, and safety behavior remains intact.

## 15. Resolved decisions

- Direction: **A, Editorial Observatory**.
- Active lesson register: product UI inside an editorial exhibition shell.
- Desktop: single viewport.
- Galaxy: full-bleed dominant stage.
- Mission: paper editorial rail.
- Evidence: content-sized contextual paper sheet.
- Character selection: bottom filmstrip.
- Spatial layout: deterministic semantic sectors with larger shell and collision spacing.
- Labels: fixed-pixel HTML, no CSS scaling or backdrop blur.
- Language: English by default.
