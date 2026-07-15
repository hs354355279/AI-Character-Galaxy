# AI Relationship Network Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace optional GPT-5.6 detail generation with a web-grounded action that automatically adds verified people and relationships around the selected character in the runtime 2D/3D galaxy.

**Architecture:** Keep the reviewed `LessonPack` immutable and store AI additions in a strict, session-scoped overlay. Derive a minimal `RelationshipGraph` for graph-facing components, while missions and assessments continue to consume only the reviewed lesson. A new Responses API route uses required web search plus Zod Structured Outputs, validates citations, normalizes IDs, and returns at most three additions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, OpenAI Responses API, React Three Fiber, Three.js, Vitest, Testing Library, Playwright.

## Global Constraints

- Product copy remains English by default.
- GPT-5.6 adds at most three people per request and at most twelve AI people per lesson session.
- AI additions persist only through `sessionStorage` in the current browser tab.
- The official lesson pack, mission answers, assessments, source pages, and reviewed progress remain immutable.
- Every AI relationship requires at least one visible, clickable citation extracted from OpenAI Web Search output.
- Missing configuration, refusals, timeouts, invalid output, duplicates-only output, and unsourced output add nothing to the graph.
- The selected person remains exactly at `[0, 0, 0]`; existing positions do not jump when nodes are added.
- 2D, 3D, filmstrip, evidence, keyboard, reduced-motion, and mobile behavior remain equivalent.

---

## File map

- Create `lib/network-expansion/schemas.ts`: shared request, model, batch, state, citation, and runtime graph types.
- Create `lib/network-expansion/runtime-graph.ts`: deterministic IDs, deduplication, capacity enforcement, and immutable graph merge.
- Create `lib/network-expansion/storage.ts`: strict `sessionStorage` load/save boundary.
- Create `lib/openai/network-expansion-prompts.ts`: focused relationship-research instructions.
- Create `lib/openai/network-expansion.ts`: retry, citation validation, normalization, and sanitized domain errors.
- Create `app/api/learning/expand-network/route.ts`: validated API handler.
- Create `components/learning/NetworkExpansionControl.tsx`: loading, success, error, and capacity interaction.
- Modify graph/layout components to consume `RelationshipGraph` instead of a complete `LessonPack`.
- Modify `LearningExperience.tsx` to own and persist the expansion overlay.
- Modify `EvidencePanel.tsx` to show details immediately and expose network expansion only for selected characters.
- Delete `components/learning/AiInsight.tsx` and its component test because detail generation is no longer a product surface.

---

### Task 1: Strict expansion state and immutable runtime graph

**Files:**
- Create: `lib/network-expansion/schemas.ts`
- Create: `lib/network-expansion/runtime-graph.ts`
- Create: `lib/network-expansion/storage.ts`
- Create: `tests/unit/network-expansion-state.test.ts`
- Create: `tests/unit/network-expansion-storage.test.ts`

**Interfaces:**
- Produces `RelationshipGraph`, `RuntimeCharacter`, `RuntimeRelationship`, `ExpansionCitation`, `NetworkExpansionBatch`, and `RelationshipNetworkExpansionState`.
- Produces `createEmptyExpansionState(lessonId)`, `mergeExpansionBatch(lesson, state, batch)`, `createRuntimeRelationshipGraph(lesson, state)`, `loadExpansionState(lessonId, storage)`, and `saveExpansionState(state, storage)`.

- [ ] **Step 1: Write failing state and graph tests**

Cover strict schema rejection, deterministic `ai-` IDs, case/alias deduplication, an existing-person/new-edge result, the twelve-person limit, and immutability of the original lesson. The core assertion must demonstrate the intended boundary:

```ts
const original = structuredClone(lesson);
const next = mergeExpansionBatch(lesson, createEmptyExpansionState(lesson.id), batch);
const graph = createRuntimeRelationshipGraph(lesson, next);

expect(graph.characters).toHaveLength(lesson.characters.length + 3);
expect(graph.characters.filter((item) => item.provenance === "ai-expanded")).toHaveLength(3);
expect(lesson).toEqual(original);
```

- [ ] **Step 2: Run the tests and confirm RED**

Run:

```powershell
npx vitest run tests/unit/network-expansion-state.test.ts tests/unit/network-expansion-storage.test.ts
```

Expected: FAIL because the network-expansion modules do not exist.

- [ ] **Step 3: Implement the shared contracts**

Define strict Zod schemas with these stable shapes:

```ts
export interface RelationshipGraph {
  id: string;
  layoutSeed: string;
  groups: CharacterGroup[];
  characters: RuntimeCharacter[];
  relationships: RuntimeRelationship[];
}

export type RuntimeCharacter = CharacterNode & {
  provenance: "reviewed" | "ai-expanded";
  citationIds: string[];
};

export type RuntimeRelationship = RelationshipEdge & {
  provenance: "reviewed" | "ai-expanded";
  citationIds: string[];
};
```

Use a stable `Expanded network` group with ID `ai-expanded-network`, symbol `AI`, and color `#61c9b4`. Normalize names with Unicode normalization, lowercase comparison, collapsed whitespace, and alias comparison. Generate IDs from canonical names, prefix AI nodes/edges with `ai-`, and append a deterministic numeric suffix only on a genuine slug collision.

- [ ] **Step 4: Implement session persistence**

Use the key `ai-character-galaxy:network-expansion:<lessonId>`. `loadExpansionState` must return an empty state when JSON parsing, schema parsing, version matching, or lesson matching fails. `saveExpansionState` must serialize only schema-owned fields.

- [ ] **Step 5: Run tests and confirm GREEN**

Run the Task 1 Vitest command and `npm run lint`.

- [ ] **Step 6: Commit Task 1**

```powershell
git add lib/network-expansion tests/unit/network-expansion-state.test.ts tests/unit/network-expansion-storage.test.ts
git commit -m "feat: model session-scoped relationship expansions"
```

---

### Task 2: Web-grounded GPT-5.6 expansion service and API route

**Files:**
- Create: `lib/openai/network-expansion-prompts.ts`
- Create: `lib/openai/network-expansion.ts`
- Modify: `lib/openai/client.ts`
- Create: `app/api/learning/expand-network/route.ts`
- Create: `tests/unit/network-expansion-service.test.ts`
- Create: `tests/integration/network-expansion-api.test.ts`

**Interfaces:**
- Consumes `ExpandNetworkRequestSchema`, `NetworkExpansionModelOutputSchema`, and `NetworkExpansionBatchSchema` from Task 1.
- Produces `queryRelationshipNetworkExpansion(input, injectedCaller?)` and `createExpandNetworkHandler(service?)`.

- [ ] **Step 1: Write failing service tests**

Test that the service:

- replaces client data with the reviewed focus when the ID is in the lesson;
- retries one transient failure;
- accepts only model source URLs present in extracted web citations;
- drops duplicate existing names;
- returns at most three people;
- throws `NetworkExpansionNotFoundError` when every candidate is duplicate or unsourced;
- throws `NetworkExpansionConfigurationError` without `OPENAI_API_KEY` and no injected caller.

Use an injected caller returning a real structured object rather than mocking internal helpers.

- [ ] **Step 2: Write failing route tests**

Exercise `createExpandNetworkHandler` with real `Request` objects and assert `400`, `422`, `503`, `502`, and a sanitized `200` payload. Verify a secret upstream error string is absent from the response body.

- [ ] **Step 3: Run tests and confirm RED**

```powershell
npx vitest run tests/unit/network-expansion-service.test.ts tests/integration/network-expansion-api.test.ts
```

Expected: FAIL because the service and route do not exist.

- [ ] **Step 4: Implement the prompt and caller**

The developer prompt must require direct, documentable relationships, concise English for ages 12–15, no quotations, no inferred acquaintance presented as fact, a maximum of three candidates, and empty candidates when evidence is insufficient. The user prompt must include focus identity, lesson title/kind, existing names, existing relationship keys, and the instruction to return different relationships.

Add `callRelationshipNetworkExpansionModel` to `lib/openai/client.ts` using the existing client/model helpers:

```ts
const response = await client().responses.parse({
  model: model(),
  reasoning: { effort: "low" },
  tools: [{ type: "web_search", search_context_size: "low" }],
  tool_choice: "required",
  include: ["web_search_call.action.sources"],
  safety_identifier: safetyIdentifier,
  input: [
    { role: "developer", content: NETWORK_EXPANSION_DEVELOPER_PROMPT },
    { role: "user", content: buildNetworkExpansionPrompt(request, context) },
  ],
  text: { format: zodTextFormat(NetworkExpansionModelOutputSchema, "relationship_network_expansion") },
}, { timeout: 20_000 });
```

Reuse and generalize the existing citation extractor instead of duplicating response parsing.

- [ ] **Step 5: Implement service validation and route errors**

Normalize citation URLs, require every accepted relationship to reference at least one extracted source, generate server-owned IDs, cap results, and return only validated fields. Map domain errors to the exact status codes and messages in the approved spec.

- [ ] **Step 6: Run tests and confirm GREEN**

Run the Task 2 Vitest command, all existing OpenAI unit/integration tests, and `npm run lint`.

- [ ] **Step 7: Commit Task 2**

```powershell
git add lib/openai app/api/learning/expand-network tests/unit/network-expansion-service.test.ts tests/integration/network-expansion-api.test.ts
git commit -m "feat: research verified relationship expansions"
```

---

### Task 3: Make the 2D/3D galaxy accept a growing runtime graph

**Files:**
- Modify: `lib/layout/galaxy-layout.ts`
- Modify: `lib/layout/relationship-space.ts`
- Modify: `lib/layout/relationship-transition.ts`
- Modify: `components/galaxy/GalaxyScene.tsx`
- Modify: `components/accessibility/RelationshipListView.tsx`
- Modify: `components/learning/CharacterRail.tsx`
- Modify: `components/learning/EvidencePanel.tsx`
- Modify: `tests/unit/relationship-transition.test.ts`
- Modify: `tests/unit/relationship-space.test.ts`
- Create: `tests/components/runtime-relationship-graph.test.tsx`

**Interfaces:**
- Consumes `RelationshipGraph`, `RuntimeCharacter`, and `RuntimeRelationship` from Task 1.
- Produces `ensureRelationshipPositions(positions, targets, spawn)` and graph-facing components that no longer require a complete `LessonPack`.

- [ ] **Step 1: Write failing dynamic-layout tests**

Add an AI person and edge to a runtime graph and assert:

- the AI person receives a deterministic direct-shell point around the selected focus;
- the selected focus remains `[0, 0, 0]`;
- `ensureRelationshipPositions` adds a missing vector at the supplied origin without replacing existing vector instances;
- 2D list and filmstrip render an AI provenance label.

- [ ] **Step 2: Run tests and confirm RED**

```powershell
npx vitest run tests/unit/relationship-space.test.ts tests/unit/relationship-transition.test.ts tests/components/runtime-relationship-graph.test.tsx
```

- [ ] **Step 3: Narrow layout inputs to `RelationshipGraph`**

Change `createGalaxyLayout`, `createRelationshipSpace`, and relationship helper inputs from `LessonPack` to `RelationshipGraph`. Keep mission-specific code untouched. Structural typing must allow reviewed runtime graphs and expanded runtime graphs without relaxing `LessonPackSchema`.

- [ ] **Step 4: Preserve existing vectors and spawn additions at the origin**

Implement:

```ts
export function ensureRelationshipPositions(
  positions: RelationshipPositionStore,
  targets: Map<string, GalaxyPoint>,
  spawn: GalaxyPoint,
): void {
  for (const id of targets.keys()) {
    if (!positions.has(id)) positions.set(id, new THREE.Vector3(spawn.x, spawn.y, spawn.z));
  }
}
```

`GalaxyScene` keeps one position store for its mounted lifetime, reconciles missing nodes before rendering, and lets `RelationshipSpaceController` interpolate them to targets. Reduced motion snaps on the next frame.

- [ ] **Step 5: Render runtime provenance across graph surfaces**

Use `AI` in labels, filmstrip markers, and 2D entries when `provenance === "ai-expanded"`. Preserve existing click targets, relationship line raycasting, label transforms, and camera limits.

- [ ] **Step 6: Run tests and confirm GREEN**

Run the Task 3 command and the existing galaxy/layout/component test files.

- [ ] **Step 7: Commit Task 3**

```powershell
git add lib/layout components/galaxy components/accessibility/RelationshipListView.tsx components/learning/CharacterRail.tsx components/learning/EvidencePanel.tsx tests
git commit -m "feat: support growing runtime relationship graphs"
```

---

### Task 4: Replace detail generation with automatic graph expansion

**Files:**
- Create: `components/learning/NetworkExpansionControl.tsx`
- Modify: `components/learning/LearningExperience.tsx`
- Modify: `components/learning/EvidencePanel.tsx`
- Delete: `components/learning/AiInsight.tsx`
- Delete: `tests/components/ai-insight.test.tsx`
- Modify: `tests/components/learning-experience.test.tsx`
- Create: `tests/components/network-expansion-control.test.tsx`

**Interfaces:**
- Consumes Task 1 state/graph/storage helpers and Task 2 response contract.
- `NetworkExpansionControl` receives `lessonId`, `focus`, `sessionId`, `existingCharacterNames`, `existingRelationshipKeys`, `disabledReason`, and `onExpanded(batch)`.

- [ ] **Step 1: Write failing default-detail and expansion tests**

Assert that selecting a character immediately shows role, summary, tags, and sources; `Explain with GPT-5.6` is absent; `Expand relationship galaxy with GPT-5.6` is present; a successful mocked fetch automatically adds returned nodes; success is announced; the original selected character remains selected; a rejected fetch changes no graph counts.

- [ ] **Step 2: Write failing restore test**

Seed `sessionStorage` with a valid expansion state, render `LearningExperience`, and assert the AI person appears in the filmstrip and 2D list. Seed malformed JSON and assert only reviewed characters appear.

- [ ] **Step 3: Run tests and confirm RED**

```powershell
npx vitest run tests/components/network-expansion-control.test.tsx tests/components/learning-experience.test.tsx
```

- [ ] **Step 4: Implement `NetworkExpansionControl`**

Use one in-flight request per focus and exact copy from the spec. On success call `onExpanded(response.data)` before announcing names. On any non-OK response map the sanitized API error to the approved UI message. Do not create local fallback relationships.

- [ ] **Step 5: Make `LearningExperience` own the overlay**

Create expansion state from `createEmptyExpansionState`, restore it in an effect, save after restoration, derive `runtimeGraph`, and use that graph only for GalaxyScene, RelationshipListView, CharacterRail, and EvidencePanel. Keep mission evaluation, assessment, source links, and session completion bound to `lesson`.

- [ ] **Step 6: Make selected details immediate**

Remove both `AiInsight` render paths. Render reviewed or AI details directly from runtime metadata. AI citations must be `<a target="_blank" rel="noreferrer">` elements with visible titles. Show the expansion control only for a selected character, not for a selected relationship.

- [ ] **Step 7: Run tests and confirm GREEN**

Run the Task 4 command, all component tests, and `npm run lint`.

- [ ] **Step 8: Commit Task 4**

```powershell
git add components/learning tests/components lib/network-expansion
git commit -m "feat: expand the selected character network"
```

---

### Task 5: Editorial expansion states, motion, and accessibility

**Files:**
- Modify: `app/globals.css`
- Modify: `components/galaxy/PlanetNode.tsx`
- Create: `tests/components/network-expansion-accessibility.test.tsx`

**Interfaces:**
- Consumes runtime provenance and `NetworkExpansionControl` state.
- Produces visible AI provenance, origin pulse, success/error messaging, and reduced-motion behavior.

- [ ] **Step 1: Write failing accessibility test**

Assert the action has an accessible name, loading disables duplicate activation, status uses `aria-live="polite"`, error text remains visible, AI provenance is textual, and the capacity state explains why the action is disabled.

- [ ] **Step 2: Run test and confirm RED**

```powershell
npx vitest run tests/components/network-expansion-accessibility.test.tsx
```

- [ ] **Step 3: Implement editorial states**

Style the control as part of the evidence sheet rather than a nested SaaS card. Add a small orbit glyph, measured loading pulse, concise success line, and citation list. AI planets use the stable expanded-network color plus a visible `AI` label. Keep transforms/opacity GPU-friendly and disable orbital motion under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Run tests and confirm GREEN**

Run the Task 5 test, accessibility tests, and `npm run lint`.

- [ ] **Step 5: Commit Task 5**

```powershell
git add app/globals.css components/galaxy/PlanetNode.tsx tests/components/network-expansion-accessibility.test.tsx
git commit -m "style: reveal AI-expanded relationship orbits"
```

---

### Task 6: Browser regression, documentation, and full verification

**Files:**
- Modify: `e2e/galaxy-interaction.spec.ts`
- Modify: `e2e/accessibility.spec.ts`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-16-ai-relationship-network-expansion-design.md`

**Interfaces:**
- Uses the public UI and mocks only `/api/learning/expand-network`; it does not mock graph components.

- [ ] **Step 1: Add a deterministic browser fixture**

Intercept the expansion route and return three characters with three relationships and citations. The response must use the same shared schema as production fixtures.

- [ ] **Step 2: Write failing browser tests**

At 1440×900:

- select a reviewed character;
- expand and assert the count grows by three;
- assert three new planet labels and relationship lines exist;
- assert the reviewed focus remains `data-space-origin="true"` at world coordinates `0,0,0`;
- select an AI person and verify details/citations are immediate;
- refresh and verify the same AI nodes remain;
- switch to 2D and verify the same nodes and relationships;
- assert no page errors and no horizontal overflow.

At 390×844, restore the same session expansion and verify complete 2D access, textual provenance, keyboard reachability, and bounded document width.

- [ ] **Step 3: Run browser tests and confirm RED**

Run the focused tests against a fresh local server. The initial failure must be caused by missing expansion behavior, not selector or fixture errors.

- [ ] **Step 4: Run browser tests and confirm GREEN**

Run the same focused desktop and mobile tests after Tasks 1–5. Expected: all expansion, persistence, origin, 2D parity, citation, console, and overflow assertions pass.

- [ ] **Step 5: Update documentation**

README must describe GPT-5.6 as a web-grounded relationship expansion feature, document the three-per-call/twelve-per-tab limits, session-only persistence, required clickable citations, and the fact that reviewed lesson content remains complete without an API key. Mark the specification `Implemented and verified` only after all verification commands pass.

- [ ] **Step 6: Run full verification**

```powershell
npm run verify
```

Then run the complete Playwright suite against a fresh server:

```powershell
npm run test:e2e
```

Expected: lint, all Vitest files, two content packs, production build, and all Chromium tests pass with zero failures.

- [ ] **Step 7: Inspect real browser output**

Capture desktop and mobile screenshots in `output/playwright/`, inspect them visually, switch focus repeatedly, rotate/zoom the 3D graph, refresh once, and confirm console errors remain zero.

- [ ] **Step 8: Commit Task 6**

```powershell
git add e2e README.md docs/superpowers/specs/2026-07-16-ai-relationship-network-expansion-design.md
git commit -m "test: verify recursive AI relationship expansion"
```

---

## Plan self-review

- Every approved acceptance criterion maps to Tasks 1–6.
- The official `LessonPackSchema` remains unchanged and retains its reviewed content limits.
- Shared names (`RelationshipGraph`, `RelationshipNetworkExpansionState`, `NetworkExpansionBatch`, `NetworkExpansionControl`) are consistent across tasks.
- API, storage, runtime graph, UI, motion, accessibility, and browser behavior each have an explicit red/green test cycle.
- No task requires a database, account system, open-ended chat, or unsourced fallback content.
