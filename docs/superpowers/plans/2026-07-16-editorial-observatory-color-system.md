# Editorial Observatory Color System Implementation Plan

> **For Codex:** Execute this plan inline with `executing-plans`; use `test-driven-development` for every behavior change and `verification-before-completion` before handoff.

**Goal:** Replace the active lesson workspace's mismatched beige/primary-color treatment with the approved cool editorial observatory palette, mineral constellation materials, and course-aware accents while preserving layout, camera, and interaction behavior.

**Architecture:** Add one framework-neutral palette module as the shared source of truth for course accents, mineral group colors, and Three.js material derivation. The React workspace exposes the active course as a modifier class, CSS maps semantic surface roles to the approved observatory tokens, and the WebGL scene consumes the same palette contract for fog, lights, selection, planets, and AI-expanded nodes. Tests cover the contract at unit/component level and Playwright verifies computed browser styles and interaction states.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind-compatible global CSS, React Three Fiber/Three.js, Vitest, Testing Library, Playwright.

**Global constraints:** Keep English as the default language; do not alter the approved desktop composition, relationship coordinates, camera controls, focus behavior, 2D fallback, or mobile layout; preserve group symbols as a non-color cue; avoid new animated DOM layers; do not commit the unrelated generated `next-env.d.ts` change.

---

## Task 1: Establish the course-aware palette contract

**Files:**

- Create: `lib/galaxy/observatory-palette.ts`
- Create: `tests/unit/observatory-palette.test.ts`
- Modify: `components/learning/LearningExperience.tsx:262`
- Modify: `tests/components/learning-experience.test.tsx`

- [ ] **Step 1: Write the failing palette contract test**

```ts
import {
  getCourseObservatoryPalette,
  getMineralPlanetColors,
  MINERAL_GROUP_COLORS,
} from "@/lib/galaxy/observatory-palette";

expect(getCourseObservatoryPalette("french-revolution").accent).toBe("#bd5b63");
expect(getCourseObservatoryPalette("romeo-and-juliet").accent).toBe("#8d75ad");
expect(MINERAL_GROUP_COLORS.radical).toBe("#bd5b63");
expect(getMineralPlanetColors("#bd5b63")).toMatchObject({
  base: expect.stringMatching(/^#/),
  highlight: expect.stringMatching(/^#/),
  shadow: expect.stringMatching(/^#/),
});
```

- [ ] **Step 2: Run the unit test and confirm it fails because the module does not exist**

Run: `npm run test -- tests/unit/observatory-palette.test.ts`

Expected: FAIL with an unresolved `@/lib/galaxy/observatory-palette` import.

- [ ] **Step 3: Implement the typed palette module**

```ts
export const MINERAL_GROUP_COLORS = {
  monarchy: "#b79a5b",
  constitutional: "#5d83b1",
  radical: "#bd5b63",
  ideas: "#8d75ad",
  postRevolution: "#579583",
} as const;

export const COURSE_OBSERVATORY_PALETTES = {
  "french-revolution": { accent: "#bd5b63", accentStrong: "#914750", accentSoft: "#eee1e1" },
  "romeo-and-juliet": { accent: "#8d75ad", accentStrong: "#66587f", accentSoft: "#ebe5ef" },
} as const;
```

Use `THREE.Color` only inside the derivation function so `PlanetNode` receives stable, precomputed cool-stone `base`, `highlight`, and lifted `shadow` colors without the existing warm `#f0ece2` mix.

- [ ] **Step 4: Write a failing component assertion for the course modifier class**

```ts
expect(screen.getByTestId("learning-workspace")).toHaveClass(
  "learning-workspace--french-revolution",
);
```

- [ ] **Step 5: Add the deterministic workspace modifier**

```tsx
<main
  className={`learning-workspace learning-workspace--${lesson.kind}`}
  data-testid="learning-workspace"
>
```

- [ ] **Step 6: Run focused tests and commit**

Run: `npm run test -- tests/unit/observatory-palette.test.ts tests/components/learning-experience.test.tsx`

Expected: PASS.

Commit: `git add lib/galaxy/observatory-palette.ts tests/unit/observatory-palette.test.ts components/learning/LearningExperience.tsx tests/components/learning-experience.test.tsx && git commit -m "feat: add observatory palette contract"`

## Task 2: Apply semantic editorial observatory surfaces

**Files:**

- Modify: `app/globals.css:4357-4835`
- Modify: `e2e/galaxy-interaction.spec.ts`

- [ ] **Step 1: Add failing browser assertions for semantic surface roles**

At 1440 x 900, assert that the workspace uses a cool shell, the galaxy stage remains a distinct dark spatial surface, and the evidence sheet uses the raised editorial paper rather than the old beige values. Repeat the course-accent assertion for both lesson routes.

```ts
await expect(workspace).toHaveCSS("background-color", "oklch(0.962 0.008 255)");
await expect(stage).toHaveCSS("background-color", "oklch(0.135 0.022 258)");
await expect(workspace).toHaveAttribute("class", /learning-workspace--french-revolution/);
```

- [ ] **Step 2: Run the focused Playwright test and confirm the old colors fail**

Run: `npx playwright test e2e/galaxy-interaction.spec.ts --project=chromium --grep "editorial observatory palette"`

Expected: FAIL on computed colors.

- [ ] **Step 3: Define semantic tokens and course modifiers**

```css
.learning-workspace {
  --obs-shell: oklch(96.2% 0.008 255);
  --obs-shell-raised: oklch(92.5% 0.012 255);
  --obs-sheet: oklch(98% 0.006 255);
  --obs-ink: oklch(19% 0.018 255);
  --obs-muted: oklch(43% 0.018 255);
  --obs-rule: oklch(76% 0.014 255);
  --obs-stage: oklch(13.5% 0.022 258);
  --obs-stage-raised: oklch(18.5% 0.028 258);
  --obs-stage-active: oklch(23% 0.032 258);
  --obs-stage-ink: oklch(92% 0.012 255);
  --obs-stage-muted: oklch(70% 0.02 255);
  --obs-stage-rule: oklch(34% 0.025 258);
}

.learning-workspace--french-revolution {
  --obs-accent: oklch(61% 0.145 24);
  --obs-accent-strong: oklch(46% 0.13 24);
  --obs-accent-soft: oklch(91% 0.032 24);
}

.learning-workspace--romeo-and-juliet {
  --obs-accent: oklch(61% 0.12 315);
  --obs-accent-strong: oklch(46% 0.105 315);
  --obs-accent-soft: oklch(91% 0.028 315);
}
```

- [ ] **Step 4: Remap the final lesson-workspace overrides by semantic role**

Replace warm paper, opaque white, generic black, and unrelated bright-blue focus treatments in the final override block. Use `--obs-shell` for navigation/mission framing, `--obs-sheet` for evidence, `--obs-stage*` for stage/filmstrip/labels, `--obs-accent*` only for selected, progress, focus, and primary actions, and restrained 1 px rules instead of the existing large evidence-panel shadow.

- [ ] **Step 5: Verify desktop and responsive regressions**

Run: `npx playwright test e2e/galaxy-interaction.spec.ts --project=chromium --grep "editorial observatory palette|desktop observatory layout|mobile"`

Expected: PASS.

- [ ] **Step 6: Commit the UI palette**

Commit: `git add app/globals.css e2e/galaxy-interaction.spec.ts && git commit -m "feat: refine observatory workspace colors"`

## Task 3: Move lesson content to the mineral constellation family

**Files:**

- Modify: `content/lesson-packs/french-revolution.json`
- Modify: `content/lesson-packs/romeo-and-juliet.json`
- Modify: `lib/network-expansion/schemas.ts`
- Modify: `tests/content/lesson-pack-validation.test.ts`
- Modify: `tests/integration/network-expansion-api.test.ts`

- [ ] **Step 1: Add failing validation assertions for the approved group colors**

```ts
expect(french.groups.map((group) => group.color)).toEqual([
  "#b79a5b",
  "#5d83b1",
  "#bd5b63",
  "#8d75ad",
  "#579583",
]);
```

Assert Romeo uses the same family and that AI-expanded groups use the verdigris color rather than the current saturated teal.

- [ ] **Step 2: Run focused content tests and observe the color mismatch**

Run: `npm run test -- tests/content/lesson-pack-validation.test.ts tests/integration/network-expansion-api.test.ts`

Expected: FAIL on group colors.

- [ ] **Step 3: Update group colors without changing group IDs or symbols**

Map French Revolution groups to brass, lapis, garnet coral, amethyst, and verdigris. Map Romeo and Juliet groups to lapis, garnet coral, and amethyst. Keep all letter markers and text labels unchanged for accessible redundancy.

- [ ] **Step 4: Update the AI-expanded group color**

Use `#579583` in the runtime expansion group and update exact API snapshots/fixtures where needed.

- [ ] **Step 5: Run content and expansion tests, then commit**

Run: `npm run test -- tests/content/lesson-pack-validation.test.ts tests/integration/network-expansion-api.test.ts tests/unit/network-expansion-storage.test.ts`

Expected: PASS.

Commit: `git add content/lesson-packs/french-revolution.json content/lesson-packs/romeo-and-juliet.json lib/network-expansion/schemas.ts tests/content/lesson-pack-validation.test.ts tests/integration/network-expansion-api.test.ts && git commit -m "feat: adopt mineral constellation colors"`

## Task 4: Rebalance planet materials, selection, and 3D lighting

**Files:**

- Modify: `components/galaxy/PlanetNode.tsx`
- Modify: `components/galaxy/GalaxyScene.tsx`
- Modify: `lib/galaxy/observatory-palette.ts`
- Modify: `tests/unit/observatory-palette.test.ts`
- Modify: `e2e/galaxy-interaction.spec.ts`

- [ ] **Step 1: Add failing unit tests for material and scene palettes**

Assert that a planet's highlight is less chromatic and lighter than its group color, its shadow is lifted rather than multiplied toward black, and the scene returns course-specific selection plus neutral-cool key/fill/rim colors.

- [ ] **Step 2: Run the unit test and confirm missing behavior fails**

Run: `npm run test -- tests/unit/observatory-palette.test.ts`

Expected: FAIL on missing scene/material fields.

- [ ] **Step 3: Thread the course palette through the scene**

```tsx
const observatoryPalette = getCourseObservatoryPalette(graph.id);

<PlanetNode
  color={group.color}
  selectionColor={observatoryPalette.accent}
  {...nodeProps}
/>
```

Keep the current relationship-space positions, camera controller, pointer handling, labels, and animation timing untouched.

- [ ] **Step 4: Replace warm/additive planet treatments**

Use the palette module's cool stone highlight and lifted shadow in the shader uniforms. Reduce halo/ring opacity and additive glare, set selected wireframes to the course accent, and use muted verdigris for AI-expanded nodes. Do not introduce texture downloads or extra draw-call layers.

- [ ] **Step 5: Rebalance scene fog and lights**

Use the approved deep blue-black stage fog, a neutral-cool hemisphere key, low-chroma violet fill, and a lower-intensity course-colored rim. Preserve performance settings and the current canvas/camera configuration.

- [ ] **Step 6: Verify interaction states in Chromium**

Run: `npx playwright test e2e/galaxy-interaction.spec.ts --project=chromium --grep "selects a visible planet|retains selection|editorial observatory palette"`

Expected: PASS with clickable labels, selected details, and stable camera behavior.

- [ ] **Step 7: Commit the WebGL treatment**

Commit: `git add components/galaxy/PlanetNode.tsx components/galaxy/GalaxyScene.tsx lib/galaxy/observatory-palette.ts tests/unit/observatory-palette.test.ts e2e/galaxy-interaction.spec.ts && git commit -m "feat: polish mineral galaxy lighting"`

## Task 5: Browser QA and release verification

**Files:**

- Verify: `app/globals.css`
- Verify: `components/galaxy/GalaxyScene.tsx`
- Verify: `components/galaxy/PlanetNode.tsx`
- Verify: both lesson routes and the 2D/mobile fallbacks

- [ ] **Step 1: Start the production-like development server**

Run: `npm run dev`

Expected: Next.js serves the project at `http://localhost:3000` with no runtime overlay.

- [ ] **Step 2: Inspect both courses at required desktop sizes**

Capture and inspect:

- `/learn/french-revolution` at 1440 x 900 and 1920 x 1080
- `/learn/romeo-and-juliet` at 1440 x 900 and 1920 x 1080

Confirm the shell is cool-neutral, the evidence sheet reads as one editorial surface, the stage retains depth, mineral groups are distinct but restrained, selected states use the active course accent, and all labels remain crisp and legible.

- [ ] **Step 3: Inspect interaction and fallback states**

Select planets from multiple camera angles, use the people rail, toggle 2D list, open sources and return, resize to mobile, and check `prefers-reduced-motion`. Confirm no pointer occlusion, camera jump, overflow, unreadable labels, or navigation regression.

- [ ] **Step 4: Run the complete automated verification**

Run: `npm run verify`

Expected: lint, type-check, and all Vitest suites pass.

Run: `npm run test:e2e`

Expected: all Playwright projects pass.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Review scope and push**

Run: `git status --short`

Expected: only the intentionally preserved generated `next-env.d.ts` change remains outside the commits.

Run: `git log --oneline --max-count=6`

Expected: the plan and implementation commits are present above the approved design-spec commit.

Run: `git push origin main`

Expected: `main` is updated on `hs354355279/AI-Character-Galaxy`.

