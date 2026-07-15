# Semantic Relationship Space Design

**Date:** 2026-07-15

**Status:** Approved direction — desktop option A and semantic coordinate approach 1

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

The active learning observatory will become a desktop single-viewport application rather than a vertically scrolling document. Its 3D galaxy will change from a seeded group overview into a deterministic, target-centered relationship space whenever the learner selects a person.

The selected person becomes the origin. Every other person is positioned using relationship distance, emotional valence, public/private context, and relationship direction. This makes the scene an explanatory model of human relationships instead of a flat constellation with decorative depth.

The reviewed lesson packs remain the only source of relationship meaning. No lesson schema or evidence data is rewritten for this feature.

## 2. Approved decisions

- Desktop active lessons use a fixed `100svh` workspace with no document scrollbar.
- Mission and evidence panels may scroll internally when their content exceeds their assigned height.
- The galaxy canvas owns wheel/pointer gestures while the character rail owns horizontal scrolling.
- Tablet and mobile layouts below the desktop breakpoint retain their natural vertical document flow.
- Selecting a person changes the scene into a semantic 3D coordinate system with that person at `[0, 0, 0]`.
- Layout is deterministic: the same lesson and target always produce the same coordinates.
- Position changes interpolate smoothly; reduced-motion mode snaps to the new positions.
- The existing accessible 2D relationship list, missions, evidence, sources, and session state remain unchanged.

## 3. Current-state findings

At a `1280 × 720` viewport, the active lesson currently measures:

| Element | Height |
| --- | ---: |
| Viewport | `720px` |
| Workspace | `891.8px` |
| Workspace grid | `757.6px` |
| Galaxy viewport | `625.2px` |
| Character rail | `122px` |

The primary cause is `.observatory-stage { grid-template-rows: minmax(38rem, 1fr) auto; }`. The `38rem` galaxy minimum plus the character rail and gaps exceeds the available space below the header. `.workspace-grid` also uses `min-height` instead of a bounded height, so the document grows to approximately `892px` and produces a page scrollbar.

The current `createGalaxyLayout(pack)` algorithm groups characters around a circle and adds only small random Z offsets. Selection moves the camera to an existing point but does not change the relationship model or make the selected person the origin.

## 4. Desktop single-viewport composition

The desktop breakpoint remains `min-width: 1181px`, matching the existing three-column observatory composition.

### 4.1 Height ownership

- `.learning-workspace` owns exactly `100svh` and uses `overflow: hidden`.
- `.workspace-grid` receives the remaining height below the fixed header/title bar, uses `height` rather than `min-height`, and sets `min-height: 0`.
- `.observatory-stage` uses `grid-template-rows: minmax(0, 1fr) auto`, `min-height: 0`, and `overflow: hidden`.
- `.galaxy-viewport` and `.galaxy-canvas` fill the first row without a fixed minimum height.
- `.workspace-panel` fills the grid row, uses `min-height: 0`, and retains `overflow: auto` for local reading.
- The character rail remains a bounded bottom row with horizontal overflow only.

### 4.2 Wheel and gesture boundaries

- Wheel input over the canvas is reserved for `OrbitControls` zoom and does not scroll the document.
- Mission and evidence panels use `overscroll-behavior: contain` so reaching their top or bottom does not chain into the page.
- The character rail uses horizontal containment and does not move the document vertically.
- No Lenis instance is mounted in the active workspace; the existing editorial smooth-scroll provider remains limited to scroll-led pages and lesson introductions.

### 4.3 Responsive fallback

At `1180px` and below, the current responsive stacking remains a natural vertical document. Panels use content height, the canvas keeps a usable viewport minimum, and the 2D list remains the complete non-WebGL path. This avoids compressing reading and controls into an inaccessible mobile single-screen interface.

## 5. Semantic relationship coordinate model

### 5.1 Modes

The scene has two deterministic modes:

1. **Overview mode:** before a person is selected, retain a refined version of the seeded group layout. The interface prompts the learner to choose a person to establish the origin.
2. **Target mode:** after selection, the target is fixed at `[0, 0, 0]`, direct relations form the inner relationship field, second-degree relations form an outer field, and disconnected people occupy a faint context shell.

Reset returns to overview mode. Selecting another person recomputes the target layout and animates from the current positions.

### 5.2 Direct relationship vector

For every direct relationship between the target and another person, derive a semantic vector from the reviewed edge:

- **X — direction and agency**
  - Target acts toward the other person: positive X.
  - Other person acts toward the target: negative X.
  - Undirected relationship: centered near X with a deterministic side lane for collision separation.
- **Y — emotional valence**
  - Romance, friendship, supportive family, alliance, trust, and loyalty: positive Y.
  - Conflict, political rivalry, betrayal, revenge, violence, and feud: negative Y.
  - Influence, service, and neutral mentorship: close to the middle unless learning tags provide stronger evidence.
- **Z — relational context**
  - Private, family, friendship, romance, trust, and personal honor: positive Z, toward the viewer.
  - Public, political, institutional, ideological, monarchy, republic, and faction relationships: negative Z, deeper in the scene.

The type supplies the base values. Existing `learningTags` adjust those values only through a fixed reviewed keyword table. No free-text model inference runs in the browser.

### 5.3 Distance and degree

Distance from the origin represents closeness and relevance:

- Direct relationship radius: `3.2` to `6.2`, inversely proportional to edge strength `1–5`.
- If multiple direct edges exist, use the strongest edge for radius and a strength-weighted average for the semantic vector.
- Second-degree relationship radius: `7.2` to `9.4`, anchored near the first-hop person and separated by a deterministic angular offset.
- Disconnected/context person radius: `10.5` to `12`, on a low-opacity outer shell.

The semantic vector is normalized and multiplied by the radius. A seed-derived offset is then added within a strict small bound to prevent overlap without changing the meaning of the axes. Final coordinates remain inside the existing teaching viewport limit.

### 5.4 Relationship prominence

- Edges touching the origin use full semantic color and visibility.
- Second-degree edges use reduced opacity.
- Edges unrelated to the selected target remain available but fade into contextual structure.
- Highlighted mission edges and explicitly selected relationships retain priority over contextual fading.
- Directed relationships gain a subtle traveling pulse toward the recipient; reduced-motion mode renders a static direction marker.

### 5.5 Visual explanation

A compact DOM legend overlays the canvas without accepting pointer input:

```text
Near ↔ far       relationship strength / degree
Up ↕ down        affinity / conflict
Front ↔ back     personal / public context
Left ↔ right     incoming / outgoing agency
```

The evidence panel identifies the target and selected relationship using reviewed text. The coordinate legend explains visual encoding but never claims more certainty than the lesson pack provides.

## 6. Transition architecture

The R3F scene keeps high-frequency position interpolation outside React state:

- `createRelationshipLayout(pack, targetId)` produces immutable target coordinates and relationship metadata.
- A scene-local position store holds mutable `THREE.Vector3` values for the current frame.
- One `useFrame` controller damps current positions toward target positions.
- Planets, relationship geometry, pulses, labels, and hit spheres read from the same position store so they cannot drift apart.
- React state changes only when the learner changes the selected character or relationship.
- `prefers-reduced-motion` bypasses damping and copies target positions immediately.

The camera keeps `OrbitControls.target` at the semantic origin in target mode. This removes the current camera-fly behavior when switching people; the relationship space reorganizes around the learner's stable viewpoint instead.

## 7. Components and boundaries

```text
lib/layout/
  galaxy-layout.ts                 overview layout
  relationship-space.ts           semantic scores, graph degree, target coordinates

components/galaxy/
  GalaxyScene.tsx                  mode selection and scene composition
  RelationshipSpaceController.tsx position interpolation store and frame update
  PlanetNode.tsx                   visual node reading current position
  RelationshipField.tsx           live edge geometry and semantic prominence
  RelationshipAxesLegend.tsx      non-interactive DOM legend

components/learning/
  LearningExperience.tsx           selected target remains the shared UI state

app/globals.css                    bounded desktop workspace and responsive fallback
```

`relationship-space.ts` is a pure deterministic module. It does not import React or Three.js and is fully unit-testable with plain coordinate values.

## 8. Accessibility and interaction

- The character rail remains the primary guaranteed selection path and exposes the current origin through `aria-pressed`.
- Planet hit spheres remain larger than their visual geometry and take priority over relationship lines.
- Projected labels remain display-only and never block the canvas.
- The 2D list presents the same relationships without requiring spatial interpretation.
- The axes legend has equivalent screen-reader copy adjacent to the canvas description.
- Internal panel scrolling preserves keyboard focus visibility.
- Mobile and reduced-motion modes do not depend on spatial animation to communicate relationship facts.

## 9. Testing and acceptance criteria

### 9.1 Layout unit tests

- The selected target is exactly `[0, 0, 0]`.
- The same pack and target return identical coordinates.
- Strong direct relationships are closer than weak direct relationships.
- Direct relationships are closer than second-degree and disconnected people.
- Positive relationship types score above conflicts on Y.
- Personal relationship types score in front of political relationships on Z.
- Directed target-to-person and person-to-target edges occupy opposite X directions.
- Every coordinate is finite, separated from other planets by a minimum bound, and remains inside the teaching viewport.

### 9.2 Component tests

- Selecting a person passes that ID as the semantic origin.
- Reset restores overview mode.
- The axes legend appears only in target mode.
- Reduced-motion mode snaps positions without scheduling an animated transition.
- Relationship opacity reflects origin, second-degree, contextual, selected, and mission-highlighted states.

### 9.3 Browser tests

At `1440 × 900` and `1920 × 1080`:

- `document.documentElement.scrollHeight` is no greater than `clientHeight + 1` in the active 3D workspace.
- Wheel input over the canvas changes camera distance without changing `window.scrollY`.
- Scrolling the evidence panel changes only that panel's `scrollTop`.
- The character rail remains fully reachable horizontally.
- Selecting Romeo places Romeo at the origin and distributes romance, friendship, family, mentorship, and conflict nodes across more than one Z plane.
- Selecting a second target produces no camera jump, node removal error, hydration error, or blocked planet click.

At `390 × 844`, the active lesson retains natural vertical flow with no horizontal overflow.

### 9.4 Repository gate

- ESLint, TypeScript, Vitest, content validation, optimized Next.js build, and all Playwright journeys pass.
- Browser console contains no runtime errors.

## 10. Non-goals

- No new AI inference or GPT call is used for layout.
- No physics engine or nondeterministic force simulation is introduced.
- Lesson relationship types, evidence, and source schemas are not changed.
- The mobile experience is not converted into a fixed-screen tab or drawer application.
- The 2D accessible relationship list is not removed or simplified.
