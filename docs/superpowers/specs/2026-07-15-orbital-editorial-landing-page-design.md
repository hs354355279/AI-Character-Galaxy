# Orbital Editorial Landing Page Design

**Date:** 2026-07-15

**Status:** Approved direction

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

The landing page will become an orbital editorial exhibition: a restrained Japanese-studio-inspired experience that combines large-format typography, deliberate whitespace, procedural relationship diagrams, and a paced scroll narrative.

The redesign is limited to the public landing page. It must preserve the existing lesson data, source links, learning routes, offline-first behavior, and the dark interactive galaxy used inside lessons. The landing page may use a light editorial canvas with dark spatial interludes so that the transition into the learning experience feels intentional.

The reference is the pacing and editorial sequencing of [syncity.co.jp](https://syncity.co.jp/), not a literal visual copy. AI Character Galaxy must remain recognizable through orbit lines, relationship nodes, evidence language, and the product statement:

> Every person has a universe of relationships.

## 2. Goals

- Make the first visit feel like entering a curated digital exhibition rather than opening a conventional education landing page.
- Establish a continuous narrative from brand statement to learning method to the two available lessons.
- Use motion to explain hierarchy and relationships, not as decoration alone.
- Preserve direct, keyboard-accessible paths to every lesson and source page.
- Keep the experience smooth on modern desktop hardware and appropriately simplified on mobile or reduced-motion devices.
- Keep all user-facing product copy in English unless localization is introduced later.

## 3. Non-goals

- Redesigning the lesson, source, mission, assessment, or summary pages.
- Adding a new free-exploration mode, account system, chat interface, or remote dependency.
- Loading stock photography or third-party media solely to imitate an agency portfolio.
- Adding a second 3D/WebGL scene to the landing page.
- Hiding lesson links behind long animations or scroll-only interactions.

## 4. Experience principles

### 4.1 Editorial before ornamental

Typography, spacing, chapter numbering, and sequencing create the primary visual identity. Orbit diagrams support the content instead of becoming a busy background.

### 4.2 Motion has a job

Each animation communicates one of four things:

- **Arrival:** the opening curtain introduces the exhibition.
- **Hierarchy:** text reveals establish the reading order.
- **Relationship:** layers move at different speeds to imply spatial connection.
- **Continuity:** chapter transitions make the page feel like one journey.

### 4.3 Immediate and interruptible

Interactive feedback begins immediately. Scroll and hover animation can be interrupted without leaving elements in an invalid state. The page must never wait for an artificial loading timer before becoming usable.

### 4.4 One visual climax at a time

The hero, horizontal learning-method section, and lesson exhibitions are the three major motion moments. Supporting sections remain calm so the page has rhythm rather than constant movement.

## 5. Visual system

### 5.1 Palette

Landing-page colors are locally scoped and must not replace the existing application theme.

| Role | Suggested value | Use |
| --- | --- | --- |
| Paper | `#EEECE5` | Primary landing background |
| Warm surface | `#E2DED3` | Section divisions and subtle material |
| Ink | `#11110F` | Primary text and rules |
| Muted ink | `#68675F` | Supporting copy and metadata |
| Space | `#08101F` | Dark exhibition chapters |
| Space ink | `#F3F1EA` | Text on dark chapters |
| Orbit violet | `#8066B3` | Romeo and Juliet visual accent |
| Orbit coral | `#D65E6F` | French Revolution visual accent |

Accent colors appear in procedural artwork and small status details, not in gradients or large UI chrome.

### 5.2 Typography

- Use the existing local application font stack; do not add a blocking remote font request.
- Hero display text uses fluid sizing and compact leading, approximately `clamp(4rem, 10vw, 9.5rem)`.
- Section labels use small uppercase lettering, wide tracking, and numeric prefixes.
- Body copy stays readable at 16–20 px with a restrained line length.
- Headline reveals split by semantic line or word groups. Individual character animation is reserved for short labels to avoid excessive DOM nodes and poor screen-reader output.

### 5.3 Layout

- The page is full-width; content follows a 12-column editorial grid with generous side gutters.
- The existing centered 1180 px card layout is removed from the landing page.
- Dividers and orbit lines may extend beyond the content grid to reinforce depth.
- Whitespace acts as a deliberate pause between high-motion chapters.

### 5.4 Procedural artwork

Lesson visuals are original SVG/CSS compositions generated from stable lesson metadata: nodes, orbital ellipses, relationship lines, numbers, and lesson-specific accent colors. They do not depict historical figures as invented portraits.

Decorative SVG elements are hidden from assistive technology and use `pointer-events: none` so they cannot obstruct lesson links.

## 6. Page narrative

### 6.1 Opening curtain

On the first visit in a browser session:

1. A black curtain covers the viewport.
2. The wordmark appears through opacity and restrained letter-spacing motion.
3. A thin orbit line traces briefly behind the wordmark.
4. The curtain translates upward to reveal the already-rendered hero.

The sequence targets 700–900 ms and never blocks page readiness. A `sessionStorage` flag skips the curtain on repeat visits. Reduced-motion mode skips directly to the final state.

### 6.2 Navigation

The navigation starts transparent over the hero. Once the hero threshold is crossed it gains a warm translucent surface, subtle border, and backdrop blur where supported.

Navigation contains:

- Product wordmark linking to the top.
- `Lessons` anchor linking to the lesson exhibition.
- An `Index` trigger that opens a full-viewport exhibition index.

The index overlay lists `00 — Introduction`, `01 — Method`, `02 — Lessons`, and `03 — Evidence`. Its dark surface expands over the page and each item reveals upward in sequence. Opening the index locks background scrolling, transfers focus into the overlay, and exposes an explicit `Close` action. Escape closes it and returns focus to the trigger.

The material transition uses opacity and transform; it does not animate expensive blur values continuously.

### 6.3 Hero: the brand statement

The hero occupies at least one viewport height and contains:

- Eyebrow: `Evidence-grounded learning · Ages 12–15`
- Display statement:
  - `Every person`
  - `has a universe`
  - `of relationships.`
- Supporting statement: `Explore why relationships mattered.`
- Primary action: `Browse lessons`
- A small scroll cue using a moving rule rather than a bouncing icon.
- A sparse orbital field that slowly settles from a slightly enlarged state.

Reveal order:

1. Wordmark and eyebrow.
2. Display lines, staggered upward by 40 px.
3. Supporting copy and action.
4. Orbit artwork scales from approximately 1.08 to 1 and gains opacity.

The hero timeline runs once and is not tied to scroll progress.

### 6.4 Learning-method exhibition

Desktop uses one pinned horizontal sequence driven by vertical scrolling:

1. `01 — Observe the galaxy`
2. `02 — Follow the evidence`
3. `03 — Explain what changed`

Each panel contains a large verb, one short explanation, a line drawing, and a progress index. Text enters with a small vertical offset while line artwork moves at a slower rate.

On screens below the desktop breakpoint, or with reduced motion enabled, the panels become a normal vertical list without pinning or horizontal translation.

### 6.5 Lesson exhibitions

The two validated lesson records remain the source of truth. Each lesson becomes a near-full-viewport exhibition chapter rather than a glass card.

Each chapter contains:

- Lesson number, subject, and estimated duration.
- Large lesson title.
- Current lesson summary.
- Three learning objectives.
- `Start exploration` as the primary action.
- `View sources` as the secondary action.
- A large procedural orbit composition derived from the lesson palette.

As a chapter enters the viewport:

- A dark panel reveals upward through `clip-path`.
- Artwork scales from roughly 1.08 to 1 and translates vertically toward rest.
- Metadata and title enter in a short stagger.

The full chapter remains usable without animation. Links are never placed inside a transformed decorative overlay.

### 6.6 Evidence manifesto

The existing trust strip is replaced with a spacious editorial closing sequence:

- `Evidence first`
- `Official relationships include a source.`
- `Works offline`
- `Prepared missions and checks stay available.`

Large numbers and thin rules create the rhythm. A slow horizontal marquee may be used only as a decorative duplicate with `aria-hidden="true"`; the readable text remains static.

### 6.7 Footer

The footer returns to the paper background and repeats the brand statement at large scale. It includes the lesson anchor, product name, and the educational positioning without adding unrelated navigation.

## 7. Interaction details

- Text links translate 2–4 px on hover; adjacent arrows translate up to 10 px.
- Lesson artwork scales to at most 1.03 on pointer hover.
- Buttons use an immediate pressed scale and a short, critically damped return.
- Focus-visible states remain clearly outlined and do not rely on hover animation.
- No custom cursor replaces the system cursor.
- Floating nodes move slowly using a small number of transform animations. No timer loop or React state update runs per frame.

## 8. Technical architecture

### 8.1 Rendering boundary

`app/page.tsx` remains a server component. It loads and validates lesson data exactly as it does today, then passes serializable lesson view models into one client-side landing experience.

This keeps content available in the initial HTML while isolating animation lifecycle code from data loading.

### 8.2 Proposed modules

```text
components/home/
  LandingExperience.tsx
  SmoothScroll.tsx
  LoadingScreen.tsx
  Hero.tsx
  SectionTitle.tsx
  OrbitArtwork.tsx
  HorizontalJourney.tsx
  LessonShowcase.tsx
  EvidenceManifesto.tsx

animations/
  landingMotion.ts
  scrollAnimations.ts
```

Existing `LessonCard.tsx` may be removed if it has no consumers after the showcase migration.

### 8.3 Animation tools

- Add `gsap`, `@gsap/react`, and `lenis`.
- Continue using the existing Motion dependency for small declarative state transitions where it is already appropriate.
- Register GSAP plugins once in a client-only module.
- Use `useGSAP` with a scoped root for lifecycle-safe setup and cleanup.
- Integrate Lenis with GSAP's ticker and call `ScrollTrigger.update` from the Lenis scroll callback.
- Use one desktop pinned timeline for the learning-method section. Other reveals use small independent triggers.
- Refresh ScrollTrigger after fonts and responsive layout have stabilized.
- Do not store scroll progress in React state.

### 8.4 Data flow

```text
validated lesson data
        ↓
app/page.tsx (server)
        ↓ serializable lesson view models
LandingExperience (client animation boundary)
        ↓
LessonShowcase × 2 → existing lesson/source routes
```

No new API request is introduced for the landing page.

## 9. Responsive behavior

### Desktop, 1024 px and above

- Full hero choreography.
- Pinned horizontal learning-method sequence.
- Layered lesson artwork and parallax.
- Sticky navigation material transition.

### Tablet, 768–1023 px

- No long horizontal pin.
- Reduced parallax distance.
- Lesson chapters remain immersive but use a simpler two-row layout.

### Mobile, below 768 px

- Natural document scrolling.
- Word- or line-level headline reveals only.
- Static orbit compositions with optional single slow drift.
- No backdrop blur requirement.
- Calls to action remain visible without precision hover.

## 10. Accessibility and user preferences

- Maintain semantic headings, landmarks, lists, and anchors.
- Keep full readable text in the DOM; visual split wrappers are `aria-hidden` duplicates only when needed.
- Respect `prefers-reduced-motion: reduce` by disabling Lenis, opening curtain movement, parallax, pinning, marquees, and floating loops.
- Respect reduced transparency and increased contrast using the existing application media-query strategy.
- Do not allow decorative overlays to receive pointer events.
- Preserve logical focus order when sections are pinned.
- Ensure off-white/black and dark/light text combinations meet WCAG AA contrast requirements.

## 11. Performance constraints

- Prefer `transform` and `opacity`; restrict clip-path animation to the two major lesson reveals.
- Keep the number of continuously floating elements small.
- Avoid per-character splitting for long paragraphs.
- Avoid WebGL, video backgrounds, remote font downloads, and stock image payloads on the landing page.
- Lazy-initialize below-the-fold scroll effects and kill all triggers on unmount or breakpoint change.
- Do not animate box shadow, filter, layout dimensions, or blur every frame.
- Preserve page content and navigation if JavaScript is unavailable.

## 12. Verification and acceptance criteria

### Content and navigation

- Both official lessons appear with their current validated titles and objectives.
- Each `Start exploration` link opens the correct existing lesson route.
- Each `View sources` link opens the correct existing source route.
- No free-exploration or ungrounded AI claim is introduced.

### Motion

- First-session opening curtain completes without blocking interaction or producing layout shift.
- Hero text ends in a crisp, readable final state.
- Desktop horizontal sequence enters and exits without jump, blank space, or stuck pinning.
- Lesson reveals do not intercept clicks.
- Resize and route navigation clean up all ScrollTriggers.

### Accessibility

- The page is fully usable by keyboard.
- Reduced-motion mode has no smooth-scroll interception, horizontal pinning, parallax, or loading curtain movement.
- Decorative artwork is ignored by assistive technology.
- Focus indicators remain visible on both paper and dark sections.

### Quality gates

- Existing unit and component tests pass after updating landing-page expectations.
- New tests cover landing content, route links, and reduced-motion/loader behavior where practical.
- The production build and lint pass.
- Browser playtests cover desktop, mobile, reduced motion, repeated visits, rapid scrolling, and navigation back to the landing page.
- Browser console contains no runtime, hydration, GSAP, or ScrollTrigger errors.

## 13. Resolved decisions

- Direction: **A — Orbital Editorial Exhibition**.
- Scope: landing page only.
- Copy: English by default.
- Base appearance: warm paper editorial canvas with dark galaxy exhibition chapters.
- Imagery: original procedural orbit artwork; no stock photography requirement.
- Smooth scroll: enabled on capable desktop devices and disabled for reduced motion.
- Existing learning routes and evidence-first behavior remain unchanged.
