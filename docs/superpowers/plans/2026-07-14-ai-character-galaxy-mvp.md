# AI Character Galaxy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a judge-ready English-language MVP that lets middle-school learners complete evidence-grounded French Revolution and Romeo and Juliet relationship lessons in accessible 3D or 2D views, with GPT-5.6 enhancements and complete offline fallbacks.

**Architecture:** A Next.js App Router application loads two versioned, locally validated lesson-pack JSON files and keeps learning progress in browser `sessionStorage`. Pure TypeScript modules own schema validation, deterministic layout, mission evaluation, and fallbacks; client components own the Apple-inspired learning interface and React Three Fiber scene; server route handlers are the only layer allowed to call the OpenAI Responses API.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, React Three Fiber, Three.js, Drei, Motion, OpenAI JavaScript SDK, Zod, Vitest, React Testing Library, and Playwright.

## Global Constraints

- Default product and content language is English (`locale: "en"`).
- Target track is OpenAI Build Week 2026 Education; submission closes July 21, 2026 at 5:00 PM PT.
- The product must be useful without an account, database, teacher dashboard, student profile, or unrestricted chat.
- Official lessons must remain fully completable without an OpenAI API key, network access, or WebGL.
- Each official lesson may contain at most 12 primary characters and 25 primary relationships.
- Every official character has a source; every official relationship has evidence and a source.
- Relationships with `confidence < 0.7` cannot be referenced by an official mission.
- Disputed history uses `isDisputed: true` and neutral language.
- GPT-5.6 runs only on the server through the Responses API; output is parsed with Zod before use.
- No learner names, school details, contact details, or persistent grades are collected.
- Apple-style design uses system typography, restrained translucent materials, immediate press feedback, spatially consistent drawers, interruptible spring motion, and reduced-motion/transparency/contrast fallbacks.
- Required information is never encoded by color alone; the 2D view exposes the same learning evidence as the 3D view.
- The repository must include an open-source application-code license, source attribution, setup/test/offline instructions, Codex and GPT-5.6 usage sections, a demo script, and the primary Codex Session ID.

---

## File Responsibility Map

- `lib/lessons/schema.ts`: canonical Zod schemas and exported TypeScript types.
- `lib/lessons/repository.ts`: validated lesson loading and lookup.
- `content/lesson-packs/*.json`: frozen official lesson packs.
- `lib/missions/evaluate.ts`: local mission completion rules.
- `lib/layout/galaxy-layout.ts`: deterministic seeded coordinates and group clustering.
- `lib/session/learning-session.ts`: identity-free session state and serialization.
- `lib/openai/*.ts`: constrained prompts, response schemas, server client, and prepared fallbacks.
- `components/home/*`: lesson discovery and judge-facing value proposition.
- `components/learning/*`: introduction, mission, evidence, assessment, and summary states.
- `components/galaxy/*`: 3D scene, nodes, edges, camera focus, and legend.
- `components/accessibility/*`: complete 2D relationship exploration and WebGL fallback.
- `app/api/learning/*`: validated server-only GPT-5.6 endpoints.
- `scripts/*`: source-manifest validation, lesson-pack validation, and review-report generation.
- `tests/*` and `e2e/*`: unit, component, integration, content, and demonstration-path coverage.

### Task 1: Project Foundation, Schemas, and Validated Official Content

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `lib/lessons/schema.ts`, `lib/lessons/repository.ts`
- Create: `content/lesson-packs/french-revolution.json`, `content/lesson-packs/romeo-and-juliet.json`
- Test: `tests/content/lesson-pack-validation.test.ts`

**Interfaces:**
- Produces: `LessonPackSchema`, `LessonPack`, `CharacterNode`, `RelationshipEdge`, `ExplorationMission`, `getLessonPack(id: string): LessonPack | null`, and `getAllLessonPacks(): LessonPack[]`.

- [ ] **Step 1: Initialize Git and install the exact project toolchain**

Run:

```powershell
git init
npm install next react react-dom three @react-three/fiber @react-three/drei motion openai zod
npm install -D typescript @types/node @types/react @types/react-dom @types/three tailwindcss @tailwindcss/postcss vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test eslint eslint-config-next tsx
```

Expected: Git repository initialized and `package-lock.json` created without dependency-resolution errors.

- [ ] **Step 2: Write the failing content contract test**

```ts
import { describe, expect, it } from "vitest";
import { getAllLessonPacks } from "@/lib/lessons/repository";

describe("official lesson packs", () => {
  it("ships two English, evidence-complete, mission-safe packs", () => {
    const packs = getAllLessonPacks();
    expect(packs.map((pack) => pack.id).sort()).toEqual([
      "french-revolution",
      "romeo-and-juliet",
    ]);
    for (const pack of packs) {
      expect(pack.locale).toBe("en");
      expect(pack.characters.length).toBeLessThanOrEqual(12);
      expect(pack.relationships.length).toBeLessThanOrEqual(25);
      expect(pack.characters.every((node) => node.sourceRefIds.length > 0)).toBe(true);
      expect(pack.relationships.every((edge) => edge.sourceRefIds.length > 0 && edge.evidenceSummary.length > 0)).toBe(true);
      const missionEdges = new Set(pack.missions.flatMap((mission) => mission.relevantRelationshipIds));
      expect(pack.relationships.filter((edge) => missionEdges.has(edge.id)).every((edge) => edge.confidence >= 0.7)).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm test -- tests/content/lesson-pack-validation.test.ts`

Expected: FAIL because `@/lib/lessons/repository` does not exist.

- [ ] **Step 4: Implement schemas, repository, and both complete lesson packs**

Implement `LessonPackSchema` with strict nested Zod objects, cross-reference checks in `superRefine`, exactly six supported mission types, source/evidence rules, literary evidence-locator rules, and the 12/25 size caps. Load both JSON files synchronously through imports and call `LessonPackSchema.parse` before exposing them.

The French pack must include at least Louis XVI, Marie Antoinette, Robespierre, Danton, Marat, Lafayette, Olympe de Gouges, and Napoleon; the Romeo and Juliet pack must include Romeo, Juliet, Mercutio, Tybalt, Friar Laurence, the Nurse, Lord Capulet, and Paris. Each pack must contain five progressively ordered missions, five prepared assessment questions, five prepared summary observations, and sources with real URLs, licenses, retrieval dates, hashes, and attribution text.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- tests/content/lesson-pack-validation.test.ts`

Expected: PASS with two validated packs.

Run:

```powershell
git add .
git commit -m "feat: establish validated lesson content foundation"
```

### Task 2: Mission Evaluation, Deterministic Layout, and Session State

**Files:**
- Create: `lib/missions/evaluate.ts`, `lib/layout/galaxy-layout.ts`, `lib/session/learning-session.ts`
- Test: `tests/unit/missions.test.ts`, `tests/unit/layout.test.ts`, `tests/unit/session.test.ts`

**Interfaces:**
- Consumes: `LessonPack`, `ExplorationMission` from `lib/lessons/schema.ts`.
- Produces: `evaluateMission(mission, evidence): MissionEvaluation`, `createGalaxyLayout(pack): Map<string, GalaxyPoint>`, `createLearningSession(packId): LearningSession`, `loadLearningSession(packId, storage): LearningSession`, and `saveLearningSession(session, storage): void`.

- [ ] **Step 1: Write failing pure-function tests**

Cover exact-ID character discovery, complete group sets, ordered trace paths, two-character comparison, evidence-backed explanation, cause/effect relationship selection, same-seed layout equality, different-seed layout inequality, session deduplication, corrupt-session recovery, and absence of identity fields.

```ts
it("completes a trace only when the ordered path connects both endpoints", () => {
  const result = evaluateMission(traceMission, {
    selectedCharacterIds: ["rousseau", "robespierre"],
    selectedRelationshipIds: ["rousseau-influences-robespierre"],
    writtenResponse: "",
  });
  expect(result).toEqual({ complete: true, feedback: "Path discovered." });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit`

Expected: FAIL because mission, layout, and session modules do not exist.

- [ ] **Step 3: Implement minimal deterministic pure modules**

Use a seeded Mulberry32 PRNG. Place group centers on a ring, characters on deterministic local orbits, and compute `x/y/z` without a frame-time physics simulation. Keep mission rules data-driven through each mission's `completionRule`. Serialize only lesson ID, timestamps, visited IDs, completed mission IDs, used hints, and assessment answers.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- tests/unit`

Expected: all unit tests PASS.

Run:

```powershell
git add lib tests/unit
git commit -m "feat: add deterministic learning engine"
```

### Task 3: Apple-Inspired Home, Introduction, and Source Pages

**Files:**
- Create: `app/page.tsx`, `app/learn/[lessonId]/page.tsx`, `app/sources/[lessonId]/page.tsx`, `app/not-found.tsx`
- Create: `components/home/Hero.tsx`, `components/home/LessonCard.tsx`, `components/learning/LessonIntroduction.tsx`, `components/shared/BrandMark.tsx`, `components/shared/MaterialPanel.tsx`
- Test: `tests/components/home.test.tsx`, `tests/components/introduction.test.tsx`, `tests/components/sources.test.tsx`

**Interfaces:**
- Consumes: lesson repository APIs.
- Produces: keyboard-accessible routes and reusable `MaterialPanel` visual primitive.

- [ ] **Step 1: Write failing user-visible component tests**

```tsx
it("presents both official lessons before the experimental path", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { name: /explore why relationships mattered/i })).toBeVisible();
  expect(screen.getAllByRole("link", { name: /start exploration/i })).toHaveLength(2);
  expect(screen.queryByText(/free exploration/i)).not.toBeInTheDocument();
});
```

Also test essential questions, objectives, legends without answer leakage, attribution links, and a readable not-found state.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/components/home.test.tsx tests/components/introduction.test.tsx tests/components/sources.test.tsx`

Expected: FAIL because route and design components do not exist.

- [ ] **Step 3: Implement the pages and design system**

Use a deep-space neutral canvas, high-contrast system type, one accent color per lesson, restrained star texture, large negative-tracked display headings, translucent navigation and cards, visible focus rings, pointer-down scale feedback, and no decorative motion required for comprehension. Use `@media (prefers-reduced-motion: reduce)`, `(prefers-reduced-transparency: reduce)`, and `(prefers-contrast: more)` to replace movement/blur with accessible equivalents. Keep Free Exploration out of the MVP home page so official content stays primary.

- [ ] **Step 4: Verify GREEN, lint, and commit**

Run: `npm test -- tests/components/home.test.tsx tests/components/introduction.test.tsx tests/components/sources.test.tsx`

Expected: PASS.

Run: `npm run lint`

Expected: zero ESLint errors.

Run:

```powershell
git add app components tests/components
git commit -m "feat: create polished lesson discovery experience"
```

### Task 4: Complete 2D and 3D Learning Workspace

**Files:**
- Create: `components/learning/LearningExperience.tsx`, `components/learning/MissionPanel.tsx`, `components/learning/EvidencePanel.tsx`, `components/learning/AssessmentPanel.tsx`, `components/learning/LearningSummary.tsx`
- Create: `components/galaxy/GalaxyScene.tsx`, `components/galaxy/CharacterNode.tsx`, `components/galaxy/RelationshipEdge.tsx`, `components/galaxy/FocusedPath.tsx`, `components/galaxy/GalaxyLegend.tsx`
- Create: `components/accessibility/RelationshipListView.tsx`, `components/accessibility/WebGLBoundary.tsx`
- Test: `tests/components/learning-experience.test.tsx`, `tests/integration/offline-learning-flow.test.tsx`

**Interfaces:**
- Consumes: lesson pack, mission evaluator, deterministic layout, and session APIs.
- Produces: a single synchronized selection model shared by 2D/3D views and a full local learning loop.

- [ ] **Step 1: Write failing interaction tests**

Test introduction-to-missions transition, character selection, evidence selection, one-hint limit per mission, mission completion, view toggle synchronization, reset, prepared assessment, summary, reduced motion, and forced WebGL failure.

```tsx
it("keeps the selected character when switching from 3D to 2D", async () => {
  render(<LearningExperience lesson={lesson} initialView="3d" />);
  await user.click(screen.getByRole("button", { name: "Select Robespierre" }));
  await user.click(screen.getByRole("button", { name: "2D relationship list" }));
  expect(screen.getByRole("heading", { name: "Maximilien Robespierre" })).toBeVisible();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/components/learning-experience.test.tsx tests/integration/offline-learning-flow.test.tsx`

Expected: FAIL because the learning workspace is absent.

- [ ] **Step 3: Implement the synchronized 2D-first learning state**

Build the accessible list and mission/evidence flow before the Canvas. Every node and edge selection updates the same React state. Desktop uses a translucent three-column workspace; narrow screens use interruptible Motion drawers that enter and exit along the same path. Buttons respond on press; sheet springs use no bounce unless released from a drag; reduced motion replaces slides with short cross-fades.

- [ ] **Step 4: Add the progressive 3D visualization**

Lazy-load the Canvas client-side. Render group-colored spheres plus outer role markers, labeled node buttons through Drei HTML, solid/dashed directional edges, and only animate the active path. Focus selected nodes with OrbitControls target updates; disable pan/free-flight. On WebGL failure, render the 2D view with an explanatory status message and preserve all session state.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- tests/components/learning-experience.test.tsx tests/integration/offline-learning-flow.test.tsx`

Expected: PASS for both 2D and forced-fallback flows.

Run:

```powershell
git add components app/learn tests/components tests/integration
git commit -m "feat: deliver accessible relationship exploration workspace"
```

### Task 5: GPT-5.6 Structured Learning Enhancements with Safe Fallbacks

**Files:**
- Create: `lib/openai/schemas.ts`, `lib/openai/prompts.ts`, `lib/openai/client.ts`, `lib/openai/fallbacks.ts`, `lib/openai/learning-service.ts`
- Create: `app/api/learning/explain/route.ts`, `app/api/learning/assessment/route.ts`, `app/api/learning/summary/route.ts`
- Test: `tests/unit/openai-validation.test.ts`, `tests/integration/learning-api.test.ts`

**Interfaces:**
- Produces: `generateExplanation`, `generateAssessment`, and `generateSummary`, each returning `{ source: "gpt-5.6" | "prepared"; data: ValidatedPayload }`.

- [ ] **Step 1: Write failing service tests with injected model callers**

```ts
it("rejects unknown source IDs and returns prepared content", async () => {
  const result = await generateExplanation(request, lesson, async () => ({
    explanation: "Unsupported claim",
    sourceRefIds: ["missing-source"],
    followUpPrompt: "What evidence supports this?",
  }));
  expect(result.source).toBe("prepared");
  expect(result.data.sourceRefIds.every((id) => lesson.sources.some((source) => source.id === id))).toBe(true);
});
```

Test missing API key, timeout, thrown error, invalid structured output, unknown entity/source IDs, one controlled retry, bounded input lengths, and privacy-safe session identifiers.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/unit/openai-validation.test.ts tests/integration/learning-api.test.ts`

Expected: FAIL because OpenAI modules and routes do not exist.

- [ ] **Step 3: Implement constrained Responses API services**

Use `openai.responses.parse`, `model: process.env.OPENAI_MODEL ?? "gpt-5.6"`, `reasoning: { effort: "low" }`, `text: { format: zodTextFormat(schema, name) }`, a privacy-preserving session ID passed as `safety_identifier`, developer instructions stored in code, and context containing only active lesson entity/relationship/source IDs plus reviewed summaries. Never send learner identity. Validate all returned references against the pack after schema parsing.

- [ ] **Step 4: Implement prepared fallbacks and route input validation**

Each route parses a strict request schema, caps free text at 800 characters, allows only IDs from the active lesson, attempts at most two model calls, and returns prepared lesson content on configuration/network/model failures without marking a learner answer incorrect.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- tests/unit/openai-validation.test.ts tests/integration/learning-api.test.ts`

Expected: PASS without requiring `OPENAI_API_KEY`.

Run:

```powershell
git add lib/openai app/api tests/unit tests/integration
git commit -m "feat: add source-constrained gpt learning services"
```

### Task 6: Reproducible Lesson-Pack Validation and Review Pipeline

**Files:**
- Create: `content/manifests/french-revolution.source-manifest.json`, `content/manifests/romeo-and-juliet.source-manifest.json`
- Create: `scripts/validate-lesson-pack.ts`, `scripts/generate-content-review.ts`, `scripts/generate-lesson-pack.ts`
- Create: `content/reports/french-revolution.review.md`, `content/reports/romeo-and-juliet.review.md`
- Test: `tests/content/generation-pipeline.test.ts`

**Interfaces:**
- Produces CLI commands `npm run content:validate`, `npm run content:review`, and `npm run content:generate -- --manifest <path> --output <path>`.

- [ ] **Step 1: Write a failing CLI-level content test**

Assert that source manifests require ID/title/URL/publisher/license/retrieval date/content hash/allowed usage, invalid lesson packs exit nonzero with schema paths, and review reports list low-confidence, disputed, missing-evidence, objective-coverage, and literary-locator findings.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/content/generation-pipeline.test.ts`

Expected: FAIL because pipeline scripts are absent.

- [ ] **Step 3: Implement validation and deterministic review scripts**

The validator must fail loudly and print every issue. The review command must write stable Markdown reports. The generator must require `OPENAI_API_KEY`, read only manifest-approved normalized source excerpts, call GPT-5.6 structured output, save a candidate JSON file rather than overwriting an official pack, and immediately run schema/evidence validation.

- [ ] **Step 4: Verify GREEN, run real content checks, and commit**

Run:

```powershell
npm test -- tests/content/generation-pipeline.test.ts
npm run content:validate
npm run content:review
```

Expected: PASS; both official packs validate; both review reports are generated with zero blocking evidence errors.

Run:

```powershell
git add content scripts tests/content package.json
git commit -m "feat: add reproducible lesson review pipeline"
```

### Task 7: End-to-End Demonstration Paths and Production Quality Gates

**Files:**
- Create: `e2e/french-revolution.spec.ts`, `e2e/romeo-and-juliet.spec.ts`, `e2e/accessibility.spec.ts`
- Modify: `playwright.config.ts`, `package.json`

**Interfaces:**
- Consumes the complete application.
- Produces stable judge-demo flows and `npm run verify`.

- [ ] **Step 1: Write failing Playwright demonstrations**

French flow: choose lesson, start missions, select Rousseau-to-Robespierre influence, open evidence/source, complete prepared assessment, and reach discoveries summary.

Romeo and Juliet flow: choose lesson, compare Romeo and Juliet, explain Friar Laurence's relationship, complete assessment, and reach summary.

Accessibility flow: keyboard-only home-to-lesson navigation, toggle 2D mode, verify labeled relationship types, emulate reduced motion, and block WebGL while completing a mission.

- [ ] **Step 2: Run and verify RED**

Run: `npm run test:e2e`

Expected: at least one demonstration assertion fails until selectors and remaining integration gaps are completed.

- [ ] **Step 3: Fix only behavior required by the failing end-to-end tests**

Add stable accessible labels and deterministic demo-state handling without test-only production APIs. Keep official content and session behavior unchanged.

- [ ] **Step 4: Run the full fresh quality gate**

Run:

```powershell
npm run lint
npm test
npm run content:validate
npm run build
npm run test:e2e
```

Expected: every command exits 0 with zero test failures and no production build errors.

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "test: verify complete educational demonstration flows"
```

### Task 8: Judge Handoff, Open-Source Licensing, and Devpost Readiness

**Files:**
- Create: `README.md`, `LICENSE`, `THIRD_PARTY_CONTENT.md`, `docs/DEMO_SCRIPT.md`, `docs/DEVPOST_SUBMISSION.md`, `docs/ARCHITECTURE.md`
- Create: `public/og-image.svg`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces a complete repository and submission handoff for the Education category.

- [ ] **Step 1: Write documentation acceptance checks**

Add `tests/docs/readme.test.ts` that requires setup, environment, offline demo, content generation, validation, test, architecture, accessibility, safety, Codex-assisted development, GPT-5.6 usage, license, third-party content, demo path, and Session ID sections.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/docs/readme.test.ts`

Expected: FAIL because handoff documents are absent.

- [ ] **Step 3: Write the complete handoff**

Use the MIT license for application code. Keep third-party lesson data attribution separate. Record primary Codex Session ID `019f60d5-b064-7520-aed3-b2c0f6c9dc42`. Include exact local commands, `.env.example`, offline behavior, no-account/no-identity privacy boundary, OpenAI under-18 safeguards, the four judging criteria, and a timed narration script shorter than three minutes that demonstrates both lesson paths plus the generation pipeline.

Prepare Devpost copy with project title, under-200-character tagline, English Markdown description, `built_with` values, Education category, repository/demo placeholders clearly labeled as user-owned publication inputs, and the required custom-field mapping IDs from the live plugin response.

- [ ] **Step 4: Verify documentation and final build**

Run:

```powershell
npm test -- tests/docs/readme.test.ts
npm run verify
git status --short
```

Expected: documentation test and full verification PASS; Git status contains only intentional final documentation changes.

- [ ] **Step 5: Commit**

```powershell
git add README.md LICENSE THIRD_PARTY_CONTENT.md docs public app/layout.tsx tests/docs package.json
git commit -m "docs: prepare OpenAI Build Week judge handoff"
```

## Plan Self-Review

- Spec coverage: all required routes, two lesson packs, 2D/3D parity, local missions, GPT enhancements, offline fallbacks, sources, content pipeline, privacy, accessibility, tests, README, and Devpost deliverables map to tasks above.
- Placeholder scan: publication-only URLs remain explicitly identified as user-owned inputs; no implementation behavior is deferred.
- Type consistency: all runtime content flows through `LessonPack`; all AI services return the same `{ source, data }` discriminated shape; 2D and 3D views share one selection state.
- Scope decision: Free Exploration is intentionally excluded from the judged MVP because it is optional in the approved specification and increases under-18 safety, factual-reliability, and schedule risk.
