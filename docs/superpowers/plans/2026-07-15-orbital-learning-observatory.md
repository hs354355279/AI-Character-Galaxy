# Orbital Learning Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the orbital editorial landing-page system across courses and learning, add a reviewed character atlas plus GPT-5.6 web-grounded character research, and upgrade the 3D galaxy while preserving interaction accuracy and accessibility.

**Architecture:** Keep route components server-first and pass serializable lesson/character view models into focused client components. Smooth-scroll, navigation, directory, OpenAI research, and WebGL rendering remain separate modules with explicit contracts. Official lesson data remains immutable; custom GPT profiles are transient and visually labeled.

**Tech Stack:** Next.js App Router, React, TypeScript, GSAP, ScrollTrigger, Lenis, Motion, React Three Fiber, Three.js, Zod, OpenAI Responses API, Vitest, Testing Library, Playwright.

## Global Constraints

- English is the default user-facing language.
- Use `gpt-5.6` or the explicit `OPENAI_MODEL` override for custom character research.
- Custom character research must use Responses API web search and display clickable citations.
- Never merge generated character research into reviewed lesson packs, missions, or evidence.
- Only one smooth-scroll interpolator may control a wheel impulse.
- Reduced-motion mode uses native scrolling and static or cross-fade alternatives.
- Keep all 3D labels as accessible HTML buttons and preserve the 2D fallback.
- Continuously animated browser properties are limited to transform, opacity, and WebGL uniforms.
- User-facing 3D spectacle must not reduce planet selection accuracy.

---

## File map

### Motion and navigation

- `components/motion/SmoothScrollProvider.tsx`: creates one Lenis instance and one GSAP ticker integration.
- `lib/motion/scroll-options.ts`: pure option selection for desktop, touch, and reduced-motion modes.
- `components/navigation/ExhibitionHeader.tsx`: shared semantic header and mobile index.
- `components/navigation/LessonSwitcher.tsx`: direct links to validated lessons.

### Course experience

- `app/courses/page.tsx`: server route loading validated lessons.
- `components/courses/CourseIndex.tsx`: editorial course index.
- `components/learning/LessonIntroduction.tsx`: orbital course prelude.
- `components/learning/LearningExperience.tsx`: phase orchestration and observatory layout.
- `components/learning/CharacterRail.tsx`: always-clickable character selection.

### Character experience

- `lib/characters/directory.ts`: pure reviewed-character normalization and filtering.
- `app/characters/page.tsx`: server route with serialized directory entries.
- `components/characters/CharacterAtlas.tsx`: client filtering and research state.
- `components/characters/CharacterResearchForm.tsx`: validated query form.
- `components/characters/CharacterResearchResult.tsx`: accessible generated profile with citations.

### OpenAI boundary

- `lib/openai/character-schemas.ts`: request and structured response schemas.
- `lib/openai/character-prompts.ts`: concise research instructions.
- `lib/openai/character-research.ts`: Responses API call, citations, retry, and error mapping.
- `app/api/characters/query/route.ts`: HTTP validation and status mapping.

### 3D system

- `components/galaxy/PlanetNode.tsx`: procedural planet, atmosphere, rings, and selection pulse.
- `components/galaxy/GalaxyParticles.tsx`: shared star/dust point buffers.
- `components/galaxy/RelationshipField.tsx`: relationship geometry and highlighted pulse.
- `components/galaxy/GalaxyScene.tsx`: camera, labels, and composition only.

### Assets and tests

- `public/images/learning/course-observatory-hero.png`: generated introduction artwork.
- `public/images/learning/planet-material-study.png`: generated 3D material reference.
- `tests/unit/scroll-options.test.ts`: motion configuration.
- `tests/components/navigation.test.tsx`: shared navigation.
- `tests/components/course-index.test.tsx`: course rendering and links.
- `tests/unit/character-directory.test.ts`: directory normalization and filtering.
- `tests/unit/character-research.test.ts`: schemas, citations, and service behavior.
- `tests/integration/character-query-api.test.ts`: HTTP status and payload contract.
- `tests/components/character-atlas.test.tsx`: filtering, pending, failure, and success UI.
- `tests/components/planet-node.test.tsx`: visual parameters and non-intercepting particles through pure helpers.
- `e2e/observatory-navigation.spec.ts`: routes and lesson switching.
- `e2e/character-atlas.spec.ts`: reviewed and mocked custom lookup paths.
- `e2e/motion-performance.spec.ts`: single scroll owner, reduced motion, and overflow.

---

### Task 1: Damped scroll foundation

**Files:**
- Create: `lib/motion/scroll-options.ts`
- Create: `components/motion/SmoothScrollProvider.tsx`
- Modify: `components/home/LandingExperience.tsx`
- Delete: `components/home/SmoothScroll.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/scroll-options.test.ts`

**Interfaces:**
- Produces: `getScrollMode(input): "native" | "lenis"`
- Produces: `createLenisOptions(): LenisOptions`
- Produces: `<SmoothScrollProvider />`, mounted only on scroll-led editorial surfaces.

- [ ] **Step 1: Write the failing pure motion tests**

```ts
import { describe, expect, it } from "vitest";
import { createLenisOptions, getScrollMode } from "@/lib/motion/scroll-options";

describe("editorial scroll options", () => {
  it("keeps reduced-motion and touch-first experiences native", () => {
    expect(getScrollMode({ reducedMotion: true, coarsePointer: false, width: 1440 })).toBe("native");
    expect(getScrollMode({ reducedMotion: false, coarsePointer: true, width: 390 })).toBe("native");
  });

  it("uses bounded interpolation instead of a long duration", () => {
    const options = createLenisOptions();
    expect(options.lerp).toBeGreaterThanOrEqual(0.085);
    expect(options.lerp).toBeLessThanOrEqual(0.11);
    expect(options.duration).toBeUndefined();
    expect(options.smoothWheel).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and confirm the module is missing**

Run: `npx vitest run tests/unit/scroll-options.test.ts`

Expected: FAIL resolving `@/lib/motion/scroll-options`.

- [ ] **Step 3: Implement the pure option contract**

```ts
import type { LenisOptions } from "lenis";

export function getScrollMode(input: {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
}): "native" | "lenis" {
  return input.reducedMotion || input.coarsePointer || input.width < 768 ? "native" : "lenis";
}

export function createLenisOptions(): LenisOptions {
  return {
    lerp: 0.095,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    syncTouch: false,
  };
}
```

- [ ] **Step 4: Implement the single-clock provider**

Create one Lenis instance only when `getScrollMode` returns `lenis`. Register `ScrollTrigger.update` on Lenis scroll, call `lenis.raf(time * 1000)` from one GSAP ticker callback, and destroy/unregister both callbacks on cleanup. Add `data-lenis-active` to the document element while active and remove it on cleanup.

In CSS, keep native `scroll-behavior: smooth` only when `data-lenis-active` is absent; set `scroll-behavior: auto` when Lenis owns the scroll.

- [ ] **Step 5: Run motion tests, landing tests, and lint**

Run: `npx vitest run tests/unit/scroll-options.test.ts tests/components/home.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: exit 0 with no warnings.

- [ ] **Step 6: Commit**

```bash
git add lib/motion/scroll-options.ts components/motion/SmoothScrollProvider.tsx components/home/LandingExperience.tsx components/home/SmoothScroll.tsx app/globals.css tests/unit/scroll-options.test.ts
git commit -m "fix: smooth editorial scroll motion"
```

---

### Task 2: Generate and register learning artwork

**Files:**
- Create: `public/images/learning/course-observatory-hero.png`
- Create: `public/images/learning/planet-material-study.png`
- Modify: `docs/superpowers/specs/2026-07-15-orbital-learning-observatory-design.md`

**Interfaces:**
- Produces stable image paths consumed by `LessonIntroduction` and CSS.
- Does not produce UI screenshots, portraits, text, or WebGL hit targets.

- [ ] **Step 1: Generate the wide observatory artwork with built-in image generation**

Use case: `stylized-concept`.

Prompt:

```text
Asset type: wide course-introduction hero for AI Character Galaxy.
Primary request: a sculptural orbital relationship observatory floating in dark ink space, with several materially distinct planets connected by hairline arcs and sparse dust.
Style/medium: premium Japanese editorial studio installation, tactile paper, lacquer, mineral pigment, restrained museum photography, not generic science fiction.
Composition/framing: 16:9 landscape; calm negative space across the left and upper center for large English typography; visual weight in the lower right.
Lighting/mood: soft directional gallery light, deep blacks, warm ivory highlights, dusty violet, muted coral, mineral cyan.
Constraints: no people, portraits, UI, letters, words, logos, spaceships, watermark, or excessive nebula gradients.
```

- [ ] **Step 2: Generate the square material study**

Use case: `stylized-concept`.

Prompt:

```text
Asset type: square visual-development material board for interactive WebGL planets.
Primary request: four sculptural planet material studies arranged with generous spacing: warm layered paper and plaster, deep violet mineral crystal dust, muted coral lacquer and stone, mineral cyan ceramic atmosphere. Each has a fine orbit ring and subtle translucent rim.
Style/medium: high-end Japanese product/material photography, restrained Awwwards art direction, physically plausible textures.
Composition/framing: square, orthographic-like study, dark ink backdrop, no labels.
Constraints: no people, text, logos, UI, spaceships, watermark, or busy star clouds.
```

- [ ] **Step 3: Inspect both outputs and copy the selected files into the project**

Validate no text or watermark, useful negative space, and material separation. Copy without overwriting unrelated landing assets.

- [ ] **Step 4: Record exact dimensions and prompts in the design specification**

Add the final dimensions and file sizes to the asset section so the implementation has a stable contract.

- [ ] **Step 5: Commit**

```bash
git add public/images/learning/course-observatory-hero.png public/images/learning/planet-material-study.png docs/superpowers/specs/2026-07-15-orbital-learning-observatory-design.md
git commit -m "assets: add observatory visual studies"
```

---

### Task 3: Shared exhibition navigation and course index

**Files:**
- Create: `components/navigation/LessonSwitcher.tsx`
- Create: `components/navigation/ExhibitionHeader.tsx`
- Create: `app/courses/page.tsx`
- Create: `components/courses/CourseIndex.tsx`
- Modify: `components/home/ExhibitionNav.tsx`
- Modify: `components/home/LandingExperience.tsx`
- Test: `tests/components/navigation.test.tsx`
- Test: `tests/components/course-index.test.tsx`

**Interfaces:**
- `ExhibitionHeader({ lessons, theme, lesson?, actions? })`
- `LessonSwitcher({ lessons, currentLessonId? })`
- `CourseIndex({ lessons: LandingLesson[] })`

- [ ] **Step 1: Write failing navigation and course-index tests**

```tsx
render(<ExhibitionHeader lessons={lessons} theme="paper" />);
expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
expect(screen.getByRole("link", { name: "Characters" })).toHaveAttribute("href", "/characters");
expect(screen.getByRole("link", { name: /French Revolution/ })).toHaveAttribute("href", "/learn/french-revolution");
```

```tsx
render(<CourseIndex lessons={lessons} />);
expect(screen.getAllByRole("article")).toHaveLength(2);
expect(screen.getByRole("link", { name: /Enter French Revolution/ })).toHaveAttribute("href", "/learn/french-revolution");
```

- [ ] **Step 2: Run tests and confirm missing components**

Run: `npx vitest run tests/components/navigation.test.tsx tests/components/course-index.test.tsx`

Expected: FAIL resolving the new modules.

- [ ] **Step 3: Build the shared semantic header**

Use real links for primary destinations and lesson entries. The mobile index uses a button with `aria-expanded`, a labeled dialog-like navigation region, Escape close, scroll lock, and focus return. Keep visual themes as classes, not duplicated markup.

- [ ] **Step 4: Build the server course route and editorial course index**

`app/courses/page.tsx` calls `getAllLessonPacks()`, maps each pack through the existing landing view-model helper, and renders `CourseIndex`. Each article includes course metadata, objectives, generated art, `Enter course`, and `View sources`.

- [ ] **Step 5: Replace landing-only navigation with the shared header**

Preserve the landing `Index` behavior as the home-specific action. Do not duplicate product marks or hidden lesson links.

- [ ] **Step 6: Run tests and build**

Run: `npx vitest run tests/components/navigation.test.tsx tests/components/course-index.test.tsx tests/components/home.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: `/courses` appears as a static route.

- [ ] **Step 7: Commit**

```bash
git add components/navigation components/courses app/courses components/home/ExhibitionNav.tsx components/home/LandingExperience.tsx tests/components/navigation.test.tsx tests/components/course-index.test.tsx
git commit -m "feat: add exhibition course navigation"
```

---

### Task 4: Course prelude and observatory workspace redesign

**Files:**
- Modify: `app/learn/[lessonId]/page.tsx`
- Modify: `components/learning/LearningExperience.tsx`
- Modify: `components/learning/LessonIntroduction.tsx`
- Create: `components/learning/CharacterRail.tsx`
- Modify: `components/learning/MissionPanel.tsx`
- Modify: `components/learning/EvidencePanel.tsx`
- Modify: `app/globals.css`
- Test: `tests/components/introduction.test.tsx`
- Test: `tests/components/learning-experience.test.tsx`

**Interfaces:**
- `LearnPage` accepts `searchParams: Promise<{ focus?: string }>`.
- `LearningExperience` accepts `initialFocusCharacterId?: string`.
- `CharacterRail({ characters, selectedCharacterId, onSelect })`.

- [ ] **Step 1: Extend failing tests for the new course experience**

```tsx
render(<LessonIntroduction lesson={lesson} onStart={onStart} />);
expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: lesson.essentialQuestion })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Enter the observatory" })).toBeInTheDocument();
```

```tsx
render(<LearningExperience lesson={lesson} initialSession={session} webglAvailable={false} />);
expect(screen.getByRole("navigation", { name: "Character selection" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Select Olympe de Gouges" })).toBeInTheDocument();
```

- [ ] **Step 2: Run tests and confirm semantic expectations fail**

Run: `npx vitest run tests/components/introduction.test.tsx tests/components/learning-experience.test.tsx`

Expected: FAIL because the shared header and character rail are absent.

- [ ] **Step 3: Rebuild the course introduction**

Use the generated wide artwork through `next/image`, the shared dark header, line-level title wrappers, a full-width essential-question chapter, numbered objective chapters, group legend, and a single `Enter the observatory` action. Mount `SmoothScrollProvider` only while the introduction is visible.

- [ ] **Step 4: Recompose the active workspace**

Keep existing phase/session logic, but render mission rail, full canvas, character rail, and non-modal evidence drawer in one continuous observatory. The evidence drawer receives the same `character`, `relationship`, and `sessionId` props already used by `EvidencePanel`.

- [ ] **Step 5: Add focus-character query support**

Validate the `focus` search parameter against the lesson's character IDs. If valid, initialize `focusedCharacterId` and enter explore mode; if invalid, ignore it without error.

- [ ] **Step 6: Run focused tests and existing lesson E2E tests**

Run: `npx vitest run tests/components/introduction.test.tsx tests/components/learning-experience.test.tsx tests/integration/offline-learning-flow.test.tsx`

Expected: PASS.

Run: `npx playwright test e2e/french-revolution.spec.ts e2e/romeo-and-juliet.spec.ts e2e/accessibility.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/learn components/learning app/globals.css tests/components/introduction.test.tsx tests/components/learning-experience.test.tsx
git commit -m "feat: redesign the learning observatory"
```

---

### Task 5: Reviewed character directory

**Files:**
- Create: `lib/characters/directory.ts`
- Create: `app/characters/page.tsx`
- Create: `components/characters/CharacterAtlas.tsx`
- Create: `components/characters/CharacterFilters.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/character-directory.test.ts`
- Test: `tests/components/character-atlas.test.tsx`

**Interfaces:**
- `createCharacterDirectory(lessons): CharacterDirectoryEntry[]`
- `filterCharacters(entries, { query, lessonId, groupId }): CharacterDirectoryEntry[]`
- Each entry contains `id`, `lessonId`, `lessonTitle`, `name`, `aliases`, `role`, `summary`, `group`, `learningTags`, `sourceHref`, and `lessonHref`.

- [ ] **Step 1: Write failing normalization and filtering tests**

```ts
const entries = createCharacterDirectory(getAllLessonPacks());
expect(entries).toHaveLength(20);
expect(entries.find((entry) => entry.name === "Olympe de Gouges")?.lessonHref)
  .toBe("/learn/french-revolution?focus=olympe-de-gouges");
expect(filterCharacters(entries, { query: "rights", lessonId: "all", groupId: "all" })
  .some((entry) => entry.name === "Olympe de Gouges")).toBe(true);
```

- [ ] **Step 2: Run the unit test and confirm missing module failure**

Run: `npx vitest run tests/unit/character-directory.test.ts`

Expected: FAIL resolving the new directory module.

- [ ] **Step 3: Implement pure normalization and filtering**

Normalize search text with `toLocaleLowerCase("en")`. Search name, aliases, role, summary, tags, group, and lesson title. Preserve one entry per lesson-character pair so every link has one authoritative lesson context.

- [ ] **Step 4: Build the atlas route and client filters**

The server route loads and serializes entries. The client component renders a semantic search form, lesson/group filters, a result count, and editorial character rows. Each row links to the focused lesson and its source page.

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/unit/character-directory.test.ts tests/components/character-atlas.test.tsx`

Expected: PASS with all 20 reviewed entries visible before filtering.

- [ ] **Step 6: Commit**

```bash
git add lib/characters app/characters components/characters app/globals.css tests/unit/character-directory.test.ts tests/components/character-atlas.test.tsx
git commit -m "feat: add reviewed character atlas"
```

---

### Task 6: GPT-5.6 character research API

**Files:**
- Create: `lib/openai/character-schemas.ts`
- Create: `lib/openai/character-prompts.ts`
- Create: `lib/openai/character-research.ts`
- Modify: `lib/openai/client.ts`
- Create: `app/api/characters/query/route.ts`
- Test: `tests/unit/character-research.test.ts`
- Test: `tests/integration/character-query-api.test.ts`

**Interfaces:**
- `CharacterResearchRequestSchema` with `name`, optional `context`, and `sessionId`.
- `CharacterResearchProfileSchema` with canonical name, descriptor, era, summary, why-it-matters, relationships, and prompts.
- `queryCharacterResearch(input, injectedCaller?)` returns `{ source: "gpt-5.6", data, citations }`.
- Typed errors: `CharacterResearchConfigurationError`, `CharacterResearchNotFoundError`, and `CharacterResearchUpstreamError`.

- [ ] **Step 1: Write failing schema and service tests**

```ts
expect(() => CharacterResearchRequestSchema.parse({ name: "", sessionId: "12345678" })).toThrow();
expect(() => CharacterResearchRequestSchema.parse({ name: "A".repeat(101), sessionId: "12345678" })).toThrow();
```

```ts
const result = await queryCharacterResearch(
  { name: "Mary Wollstonecraft", context: "political thought", sessionId: "session-123" },
  async () => ({
    profile: validProfile,
    citations: [
      { title: "Biography", url: "https://example.org/bio" },
      { title: "Biography", url: "https://example.org/bio" },
    ],
  }),
);
expect(result.citations).toEqual([{ title: "Biography", url: "https://example.org/bio" }]);
```

- [ ] **Step 2: Run tests and confirm missing schemas/service**

Run: `npx vitest run tests/unit/character-research.test.ts`

Expected: FAIL resolving the new modules.

- [ ] **Step 3: Implement the Zod contracts and concise prompt**

The developer prompt requires identification uncertainty, age-appropriate prose, no invented quotations, 2–4 notable relationships, 2–3 study prompts, and explicit web grounding. Include a `found: boolean` field so unrelated or ambiguous input can produce a schema-valid not-found result.

- [ ] **Step 4: Implement the Responses API caller**

Use `responses.parse` with:

```ts
{
  model: process.env.OPENAI_MODEL || "gpt-5.6",
  reasoning: { effort: "low" },
  tools: [{ type: "web_search", search_context_size: "low" }],
  tool_choice: "required",
  include: ["web_search_call.action.sources"],
  safety_identifier: createSafetyIdentifier(input.sessionId),
  input: [developerMessage, userMessage],
  text: { format: zodTextFormat(CharacterResearchProfileSchema, "character_research") },
}
```

Extract `url_citation` annotations and search sources into a deduplicated citation array. Handle refusal items explicitly. Apply a 20-second timeout and one bounded retry.

- [ ] **Step 5: Implement route status mapping**

Return `400` for Zod request failure, `503` for missing `OPENAI_API_KEY`, `422` for `found: false` or refusal, and `502` for exhausted upstream failures. Never include an API key, SDK error body, or prompt in the HTTP response.

- [ ] **Step 6: Run unit and integration tests**

Run: `npx vitest run tests/unit/character-research.test.ts tests/integration/character-query-api.test.ts tests/integration/learning-api.test.ts`

Expected: PASS.

- [ ] **Step 7: Run TypeScript and commit**

Run: `npx tsc --noEmit`

Expected: exit 0.

```bash
git add lib/openai app/api/characters tests/unit/character-research.test.ts tests/integration/character-query-api.test.ts
git commit -m "feat: add gpt character research api"
```

---

### Task 7: Character research interface

**Files:**
- Create: `components/characters/CharacterResearchForm.tsx`
- Create: `components/characters/CharacterResearchResult.tsx`
- Modify: `components/characters/CharacterAtlas.tsx`
- Modify: `app/globals.css`
- Modify: `tests/components/character-atlas.test.tsx`

**Interfaces:**
- `CharacterResearchForm({ onResult })` owns name/context/pending/error state.
- `CharacterResearchResult({ result })` renders the structured profile and citations.

- [ ] **Step 1: Add failing UI tests**

```tsx
await user.type(screen.getByLabelText("Character name"), "Mary Wollstonecraft");
await user.click(screen.getByRole("button", { name: "Research character" }));
expect(await screen.findByRole("status")).toHaveTextContent("Researching sources");
expect(await screen.findByRole("heading", { name: "Mary Wollstonecraft" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Biography" })).toHaveAttribute("href", "https://example.org/bio");
```

- [ ] **Step 2: Run the component test and confirm the form is absent**

Run: `npx vitest run tests/components/character-atlas.test.tsx`

Expected: FAIL finding `Character name`.

- [ ] **Step 3: Implement request and state handling**

Create a stable session ID in `sessionStorage`, disable duplicate submission while pending, send JSON to `/api/characters/query`, and map `400`, `422`, `502`, and `503` responses to specific plain-language messages. Keep the last reviewed directory results visible while research runs.

- [ ] **Step 4: Implement the result exhibition**

Render a generated-content label, canonical identity, summary, why-it-matters chapter, relationship list, prompts, and visible citation links. Add `target="_blank" rel="noreferrer"` to external sources.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run tests/components/character-atlas.test.tsx`

Expected: PASS for success, missing-key, not-found, and upstream-error states.

```bash
git add components/characters app/globals.css tests/components/character-atlas.test.tsx
git commit -m "feat: add character research exhibition"
```

---

### Task 8: Procedural planets and particle field

**Files:**
- Create: `lib/galaxy/visual-quality.ts`
- Create: `components/galaxy/PlanetNode.tsx`
- Create: `components/galaxy/GalaxyParticles.tsx`
- Create: `components/galaxy/RelationshipField.tsx`
- Modify: `components/galaxy/GalaxyScene.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/galaxy-visual-quality.test.ts`
- Modify: `e2e/galaxy-interaction.spec.ts`

**Interfaces:**
- `getGalaxyQuality({ width, devicePixelRatio, reducedMotion })` returns DPR, star count, dust count, and animation flag.
- `PlanetNode` preserves `userData.galaxyInteraction = "planet"` on its hit mesh.
- `GalaxyParticles` renders one points object per field and has no pointer handlers.
- `RelationshipField` preserves planet-first intersection behavior.

- [ ] **Step 1: Write failing quality-budget tests**

```ts
expect(getGalaxyQuality({ width: 390, devicePixelRatio: 3, reducedMotion: false }))
  .toMatchObject({ dpr: 1.15, animate: true });
expect(getGalaxyQuality({ width: 1440, devicePixelRatio: 2, reducedMotion: false }))
  .toMatchObject({ dpr: 1.35, starCount: 520 });
expect(getGalaxyQuality({ width: 1440, devicePixelRatio: 2, reducedMotion: true }))
  .toMatchObject({ animate: false, dustCount: 90 });
```

- [ ] **Step 2: Run the unit test and confirm missing module failure**

Run: `npx vitest run tests/unit/galaxy-visual-quality.test.ts`

Expected: FAIL resolving the visual-quality module.

- [ ] **Step 3: Implement deterministic quality selection**

Clamp DPR before passing it to `Canvas`. Use fixed seeded positions so rerenders do not move stars or dust.

- [ ] **Step 4: Implement the planet visual stack**

Use shared sphere geometry where possible. Add a base material with slow uniform-driven surface movement, a back-face transparent atmosphere shell with fresnel falloff, thin rings, and a selected halo. Keep the invisible/visible hit sphere geometry stable across selected states.

- [ ] **Step 5: Implement shared particle fields and relationship pulses**

Generate star and dust positions once with a seeded helper. Update only rotation/uniform time in `useFrame`. Highlighted relationships may animate a small point along the line; unselected lines stay static.

- [ ] **Step 6: Recompose `GalaxyScene` and preserve labels/camera**

Keep `CameraFocus`, `GalaxyLabelProjector`, controls, and HTML label layer behavior. Replace only node, relationship, star, and lighting implementation. Use `powerPreference: "high-performance"` and the quality DPR.

- [ ] **Step 7: Extend browser regression assertions**

Assert that clicking the existing Olympe de Gouges coordinate still selects the character, repeated label focus creates no page errors, and the canvas exposes one particle-field marker without adding buttons or hit targets.

- [ ] **Step 8: Run focused tests and commit**

Run: `npx vitest run tests/unit/galaxy-visual-quality.test.ts tests/unit/camera-focus.test.ts`

Expected: PASS.

Run: `npx playwright test e2e/galaxy-interaction.spec.ts`

Expected: PASS.

```bash
git add lib/galaxy components/galaxy app/globals.css tests/unit/galaxy-visual-quality.test.ts e2e/galaxy-interaction.spec.ts
git commit -m "feat: upgrade galaxy planets and particles"
```

---

### Task 9: Integration styling and browser journeys

**Files:**
- Modify: `app/globals.css`
- Create: `e2e/observatory-navigation.spec.ts`
- Create: `e2e/character-atlas.spec.ts`
- Create: `e2e/motion-performance.spec.ts`
- Modify: `e2e/accessibility.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Browser tests are the final contract across server routes, client motion, mocked research, and WebGL fallback.

- [ ] **Step 1: Write navigation journey tests**

```ts
await page.goto("/");
await page.getByRole("link", { name: "Courses" }).click();
await expect(page).toHaveURL(/\/courses$/);
await page.getByRole("link", { name: /Enter French Revolution/ }).click();
await expect(page.getByRole("button", { name: "Enter the observatory" })).toBeVisible();
```

- [ ] **Step 2: Write mocked custom-character journey**

Intercept `/api/characters/query` and return a fixture with one citation. Confirm form submission, generated-content label, profile heading, citation link, and return to reviewed characters.

- [ ] **Step 3: Write motion ownership tests**

On desktop, assert `document.documentElement.dataset.lenisActive === "true"` and computed root `scroll-behavior` is `auto`. In reduced-motion mode, assert the data attribute is absent, course chapters use natural vertical layout, and no horizontal overflow exists.

- [ ] **Step 4: Run E2E tests to expose integration gaps**

Run: `npx playwright test e2e/observatory-navigation.spec.ts e2e/character-atlas.spec.ts e2e/motion-performance.spec.ts`

Expected: initial failures identify missing final styling or route wiring.

- [ ] **Step 5: Finish responsive and preference styling**

Apply the paper/dark exhibition palette, fluid display typography, scroll-edge header material, full-bleed observatory, bottom character rail, non-modal evidence drawer, and mobile vertical order. Add reduced-motion, reduced-transparency, and increased-contrast overrides.

- [ ] **Step 6: Run all Playwright tests**

Run: `npx playwright test`

Expected: all landing, navigation, character, accessibility, galaxy, French Revolution, and Romeo and Juliet journeys pass with no page errors.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css e2e playwright.config.ts
git commit -m "test: verify observatory browser journeys"
```

---

### Task 10: Final verification, documentation, and publication

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEMO_SCRIPT.md`

**Interfaces:**
- Documents the new routes, GPT configuration, fallback behavior, and run commands.

- [ ] **Step 1: Update setup documentation**

Document:

```powershell
cd G:\YSF_Digital\project\Devposts
npm install
Copy-Item .env.example .env.local
npm run dev
```

State that reviewed lessons work without an API key and `/characters` custom research requires `OPENAI_API_KEY`. Preserve `OPENAI_MODEL=gpt-5.6`.

- [ ] **Step 2: Run the complete verification gate**

Run: `npm run lint`

Expected: exit 0, no warnings.

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `npm test`

Expected: all test files pass with zero failures.

Run: `npm run content:validate`

Expected: `2/2 lesson packs valid.`

Run: `npm run build`

Expected: static routes include `/`, `/courses`, `/characters`, and `/icon.svg`; dynamic routes include learning, sources, learning APIs, and `/api/characters/query`.

Run: `npx playwright test`

Expected: all Chromium journeys pass.

- [ ] **Step 3: Run repository hygiene checks**

Run: `git diff --check`

Expected: no output.

Run: `git status -sb`

Expected: only intentional documentation changes before the final commit.

- [ ] **Step 4: Commit documentation**

```bash
git add README.md .env.example docs/ARCHITECTURE.md docs/DEMO_SCRIPT.md
git commit -m "docs: document observatory experience"
```

- [ ] **Step 5: Push the verified main branch**

```bash
git push origin main
git ls-remote origin refs/heads/main
```

Expected: the remote `main` SHA exactly matches `git rev-parse HEAD`.

---

## Plan self-review

- Spec coverage: scroll ownership, navigation, courses, lesson prelude, observatory workspace, reviewed directory, GPT-5.6 research, citations, generated assets, procedural planets, particles, accessibility, responsive behavior, verification, and publication each map to a task.
- Type consistency: `CharacterDirectoryEntry`, character research request/profile/result, scroll mode/options, and galaxy quality are defined before consumers.
- Scope control: no account system, persistence database, generated lesson mutation, full 3D site navigation, post-processing stack, or new lesson pack is included.
- Placeholder scan: no deferred implementation markers are present.
