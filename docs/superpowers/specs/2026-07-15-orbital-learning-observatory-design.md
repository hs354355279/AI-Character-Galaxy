# Orbital Learning Observatory Design

**Date:** 2026-07-15

**Status:** Approved scope — user-directed continuation

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

AI Character Galaxy will extend the approved Orbital Editorial Exhibition from the landing page into the entire learning journey. The new experience is an **Orbital Learning Observatory**: a continuous digital exhibition that moves from lesson selection, to character discovery, to a focused relationship galaxy, to evidence-grounded reflection.

This phase also repairs scroll feel, introduces a shared site navigation, adds dedicated course and character directories, adds a GPT-5.6-backed custom character research endpoint, and replaces the current flat spheres with a richer but performance-bounded procedural planet and particle system.

The existing lesson packs, missions, evidence references, offline prepared fallbacks, 2D accessibility path, and session persistence remain authoritative.

## 2. Goals

- Make landing, course introduction, exploration, assessment, summary, sources, and directory pages feel like one product.
- Make wheel scrolling smooth, damped, interruptible, and free from double interpolation.
- Add persistent wayfinding with direct access to every course and the character directory.
- Add a dedicated character selection experience for the 20 reviewed lesson characters.
- Let a learner enter another historical or literary character name and receive a GPT-5.6 research profile with visible web citations.
- Upgrade the 3D relationship galaxy with authored planetary materials, atmospheric shells, orbit dust, star depth, and selection pulses.
- Preserve accurate planet selection, keyboard access, reduced-motion behavior, and mobile performance.

## 3. Approaches considered

### A. Orbital Learning Observatory — selected

Build a shared exhibition shell, two new index routes, an evidence-grounded GPT research API, and a procedural WebGL visual upgrade. Course pages inherit the landing page's typography, pacing, paper/dark contrast, and editorial numbering while the active galaxy remains a dark observatory.

This approach creates the strongest product continuity and provides clear architecture boundaries. It requires more implementation work, but each subsystem remains independently testable.

### B. Reskin the current workspace

Keep the current page structure and change only CSS, sphere materials, and transitions. This is faster, but it leaves navigation fragmented, keeps the cramped three-card workspace, and does not create the requested character selection or research experience.

### C. Move the whole application into one WebGL world

Use a full-screen 3D scene for navigation, lessons, and character selection. This maximizes spectacle but increases load, accessibility risk, mobile cost, and interaction ambiguity. It also makes evidence reading and form input harder.

## 4. Experience architecture

```text
Landing exhibition
  ├── Courses index
  │     ├── French Revolution introduction
  │     └── Romeo and Juliet introduction
  ├── Character atlas
  │     ├── Reviewed lesson character profile
  │     └── Custom GPT-5.6 research profile
  └── Learning observatory
        ├── Mission rail
        ├── 3D relationship galaxy / 2D list
        ├── Evidence drawer
        ├── Assessment
        └── Summary
```

### 4.1 New routes

| Route | Purpose |
| --- | --- |
| `/courses` | Full editorial index of validated courses |
| `/characters` | Searchable atlas of all reviewed lesson characters plus custom lookup |
| `/learn/[lessonId]` | Redesigned course introduction and observatory workspace |
| `/api/characters/query` | Validated GPT-5.6 custom character research endpoint |

The existing landing, source, and learning API routes remain in place.

## 5. Shared navigation

All public and learning surfaces use a shared `ExhibitionHeader`.

Desktop navigation contains:

- Product mark linking home.
- `Exhibition` linking home.
- `Courses` opening the course index.
- `Characters` opening the character atlas.
- A compact lesson switcher listing both official courses.
- Contextual actions such as `Sources`, `2D list`, and `Reset` only inside an active lesson.

The header floats above content as a warm paper material on editorial pages and a dark smoked material in the observatory. It uses a scroll-edge fade instead of a hard divider. On mobile, one full-screen index contains the same destinations and preserves focus return.

## 6. Scroll and motion system

### 6.1 Root cause to remove

The current landing combines global CSS `scroll-behavior: smooth`, Lenis duration interpolation, and ScrollTrigger-controlled pinned movement. These independent smoothing layers can extend the same wheel impulse and make rapid input feel delayed or uneven.

### 6.2 Single motion clock

- Lenis becomes the only smooth-scroll interpolator on capable devices.
- Remove CSS smooth scrolling while Lenis is active.
- Configure Lenis with interpolation rather than a long fixed duration, targeting a critically damped feel: `lerp` around `0.085–0.11`, wheel multiplier around `0.9`, and immediate interruption on new input.
- Drive Lenis and ScrollTrigger from one GSAP ticker callback.
- Restore ticker lag smoothing when the controller unmounts.
- Run no React state updates per scroll frame.
- Refresh ScrollTrigger after responsive image/layout stabilization, not repeatedly during scroll.

### 6.3 Motion budget

- Continuously animate only transforms, opacity, and WebGL uniforms.
- Do not animate blur, shadow, layout dimensions, or large clip paths every frame.
- Keep only one pinned horizontal sequence on desktop.
- Reduce scroll-linked parallax distances and clamp them by viewport size.
- Disable Lenis, pinning, parallax, atmospheric drift, and nonessential particle motion for reduced-motion users.
- Keep normal native scrolling on touch-first mobile layouts.

## 7. Courses index

The courses route is an editorial table of contents rather than a card grid.

Each course chapter includes:

- Large sequence number.
- Subject, age, and duration metadata.
- Full title and overview.
- Three learning objectives.
- Generated exhibition artwork.
- Direct `Enter course` and `View sources` actions.

The two chapters alternate paper and dark-space surfaces. Image parallax is restrained, and the page remains a simple vertical document below the desktop breakpoint.

## 8. Course introduction redesign

The current centered title and bordered panels become a paced editorial prelude.

### 8.1 Hero

- Shared exhibition header at the top.
- Full-viewport dark hero with lesson-specific generated galaxy render.
- Large line-level title reveal.
- Course metadata and short overview anchored to a 12-column grid.
- `Enter the observatory` as the persistent primary action.

### 8.2 Field guide

Scrolling reveals the essential question, objectives, group legend, mission count, and evidence promise as numbered exhibition chapters. A small sticky lesson index shows current position without taking over the page.

### 8.3 Transition to exploration

Starting the lesson uses a symmetric curtain transition into the dark observatory. The transition begins at the button's current location, remains interruptible, and becomes a short cross-fade for reduced-motion users.

## 9. Learning observatory workspace

Desktop changes from three bordered cards into one continuous spatial composition:

- Shared dark exhibition header.
- Narrow mission rail at left with progress and the current prompt.
- Full-bleed galaxy canvas in the center.
- Evidence presented as a contextual drawer that materializes from the selected planet or relationship.
- A bottom character rail for direct, reliable selection independent of 3D occlusion.
- View, source, and reset controls grouped beside the content they affect.

The evidence drawer is non-modal. It never blocks camera manipulation or character selection. On tablet/mobile, the galaxy, mission, character rail, and evidence content become a clear vertical order; the 2D list remains complete when WebGL is unavailable.

## 10. Character atlas

### 10.1 Reviewed characters

The atlas builds one normalized view model from all validated lesson packs. It supports:

- Text search by name, alias, role, or learning tag.
- Filter by lesson and group.
- Editorial character rows rather than card tiles.
- Direct links to open the relevant course and focus that character.
- Source links derived from the reviewed lesson data.

### 10.2 Custom character research

The atlas includes a distinct `Research another character` form with:

- Required character name, 2–100 characters.
- Optional context, such as a work, country, era, or field, up to 160 characters.
- Per-browser session identifier used only to derive a privacy-preserving safety identifier.
- Clear pending, error, refusal, and success states.

Custom profiles are visually labeled `GPT-5.6 web research` and are never merged into official lesson data or missions.

## 11. GPT-5.6 backend design

### 11.1 API contract

`POST /api/characters/query`

Request:

```json
{
  "name": "Mary Wollstonecraft",
  "context": "Enlightenment political thought",
  "sessionId": "browser-session-id"
}
```

Response:

```json
{
  "source": "gpt-5.6",
  "data": {
    "canonicalName": "Mary Wollstonecraft",
    "descriptor": "English writer and philosopher",
    "era": "18th century",
    "summary": "...",
    "whyItMatters": "...",
    "notableRelationships": [
      { "name": "William Godwin", "type": "marriage and intellectual partnership", "summary": "..." }
    ],
    "studyPrompts": ["..."]
  },
  "citations": [
    { "title": "...", "url": "https://..." }
  ]
}
```

### 11.2 OpenAI integration

- Use the Responses API with the explicit `gpt-5.6` target or `OPENAI_MODEL` override.
- Use the hosted `web_search` tool with live access and low reasoning effort for a latency-sensitive lookup.
- Require web search for custom names and return visible, clickable citations.
- Use Zod-backed Structured Outputs for the profile fields.
- Extract and deduplicate citations from response annotations or returned search sources.
- Send a hashed `safety_identifier`; do not send an email address, IP address, or raw user identity.
- Use a 20-second request timeout and one bounded retry only for transient or schema failures.
- Return `503` with a clear configuration message when `OPENAI_API_KEY` is absent. Do not fabricate a custom profile fallback.
- Return `400` for invalid input, `422` when the model cannot identify the requested character, and `502` for upstream/schema failures.

The selected API shape follows the official GPT-5.6, Responses API web search, Structured Outputs, and safety-identifier guidance.

## 12. Image-generation direction

Image generation produces design references and static course artwork, not baked screenshots of UI controls.

Required assets:

1. `course-observatory-hero.png` — a wide, premium orbital installation used behind course introductions.
2. `planet-material-study.png` — a square material study showing layered mineral, paper, lacquer, and atmospheric planet surfaces used as the implementation reference.

Visual constraints:

- Japanese editorial studio restraint.
- Dark ink space, warm ivory, muted coral, dusty violet, mineral cyan.
- No text, logos, portraits, interface chrome, watermark, or generic sci-fi spaceship imagery.
- Sculptural orbital relationships rather than literal astronomy.
- Large areas of calm negative space so typography stays readable.

The final 3D nodes remain procedural and interactive. The render guides shader color, roughness, rings, haze, and particle density; it does not replace the WebGL scene with a flat image.

## 13. 3D visual system

### 13.1 Planet materials

Each planet combines:

- A high-segment sphere with a lesson-group base palette.
- A custom shader or layered standard material with low-frequency surface variation.
- A slightly larger transparent atmosphere shell with fresnel falloff.
- One or two thin orbital rings with controlled additive blending.
- A selection halo and slow light pulse that never changes hit geometry.

Importance changes radius and atmospheric intensity, not material complexity.

### 13.2 Particle layers

- One instanced/points-based deep star field.
- A sparse orbital dust field around the relationship cluster.
- Short-lived selection particles emitted by GPU-friendly buffers, not React components.
- Relationship lines gain a subtle traveling pulse only when highlighted.
- Reduced-motion mode renders the fields statically.

### 13.3 Performance safeguards

- Cap device pixel ratio around `1.35` on desktop and `1.15` on mobile.
- Use shared geometries and memoized materials.
- Avoid heavyweight post-processing and per-node canvases.
- Keep labels in the existing HTML projection layer for accessibility and reliable clicking.
- Use adaptive quality to reduce particles before reducing interaction fidelity.
- Preserve the existing camera-focus transition and relationship-line click protection.

## 14. Components and boundaries

```text
components/
  navigation/
    ExhibitionHeader.tsx
    LessonSwitcher.tsx
  courses/
    CourseIndex.tsx
    CourseIntroduction.tsx
    CourseFieldGuide.tsx
  characters/
    CharacterAtlas.tsx
    CharacterFilters.tsx
    CharacterResearchForm.tsx
    CharacterResearchResult.tsx
  learning/
    LearningExperience.tsx
    ObservatoryHeader.tsx
    CharacterRail.tsx
    EvidenceDrawer.tsx
  galaxy/
    GalaxyScene.tsx
    PlanetNode.tsx
    GalaxyParticles.tsx
    RelationshipField.tsx
  motion/
    SmoothScrollProvider.tsx

lib/
  characters/
    directory.ts
  openai/
    character-research.ts
```

`app` routes stay thin. Lesson data is loaded on the server and transformed into serializable view models. Animation and form state live only in client components. OpenAI calls remain server-only.

## 15. Accessibility and safety

- All course and character destinations exist as semantic links.
- The character atlas and lesson switcher are fully keyboard operable.
- 3D labels remain real buttons in a separate HTML layer.
- The bottom character rail provides an always-clickable alternative to planet hit testing.
- Reduced motion removes smooth-scroll interception, camera drift, particle emission, parallax, and large spatial transitions.
- Reduced transparency replaces glass surfaces with opaque materials.
- Custom AI content is labeled, separated from reviewed content, and always displays citations.
- External citations open with safe link attributes and remain visibly identifiable.

## 16. Testing and acceptance criteria

### Motion

- Rapid alternating wheel input remains responsive and does not continue drifting after input stops.
- No simultaneous CSS and Lenis smooth scrolling is active.
- Landing desktop retains its horizontal method sequence without blank or stuck pin states.
- Mobile and reduced-motion routes use native document flow.

### Navigation and directories

- Header links reach home, courses, characters, both lessons, and sources.
- Course index is rendered from validated lesson packs.
- Character atlas exposes every reviewed character exactly once per lesson association and filters without network access.
- Character links open the correct lesson with a focus-character query.

### GPT research

- Input validation rejects missing, oversized, and malformed payloads.
- A mocked GPT-5.6 structured response is parsed and citations are deduplicated.
- Missing API configuration returns `503` without leaking configuration values.
- Refusal and upstream failures produce stable, readable UI states.

### 3D and browser quality

- Planet selection still wins when a relationship line intersects the pointer ray.
- Repeated focus changes produce no camera discontinuity or DOM removal error.
- Particles never intercept pointer events.
- Desktop and mobile pages have no horizontal overflow.
- Browser console contains no runtime, hydration, GSAP, Lenis, React Three Fiber, or API errors.
- Production build, lint, TypeScript, content validation, unit/component/integration tests, and Playwright tests pass.

## 17. Resolved decisions

- Direction: **A — Orbital Learning Observatory**.
- Copy: English by default.
- Navigation: shared across landing, courses, characters, and lessons.
- Character selection: dedicated `/characters` page plus a persistent in-lesson character rail.
- Custom lookup: GPT-5.6 Responses API with required web search and visible citations.
- Reviewed and generated content: always visually and structurally separated.
- 3D look: procedural implementation guided by generated render studies.
- Scroll feel: one interruptible Lenis/GSAP motion clock on capable desktop devices; native flow elsewhere.
- Existing evidence, mission, offline, 2D, and accessibility behavior remains authoritative.
