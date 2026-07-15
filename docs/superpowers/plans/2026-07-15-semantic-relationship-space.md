# Semantic Relationship Space Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop learning observatory a single-viewport workspace and reorganize its galaxy into a deterministic, selected-person-centered 3D relationship coordinate system.

**Architecture:** A pure layout module derives semantic coordinates and relationship prominence from reviewed lesson edges. One R3F position store interpolates every planet, line, pulse, hit target, and projected label toward those coordinates without per-frame React state. Desktop CSS bounds the active workspace to `100svh`, while the existing responsive stack remains a natural document at `1180px` and below.

**Tech Stack:** Next.js, React, TypeScript, React Three Fiber, Three.js, CSS, Vitest, Testing Library, Playwright

## Global Constraints

- English remains the default product language.
- Reviewed lesson packs remain authoritative; do not add AI inference or mutate relationship schemas.
- Desktop `min-width: 1181px` has no document scrollbar in the active lesson.
- Tablet and mobile retain natural vertical flow and the complete 2D fallback.
- The same lesson and selected target must always produce the same coordinates.
- Reduced-motion mode must snap, not interpolate.
- Planet hit spheres, HTML labels, evidence, missions, and character-rail interaction must remain reliable.
- Do not introduce a physics engine, force simulation, or post-processing dependency.

---

## File map

- `lib/layout/relationship-space.ts`: pure semantic scoring, graph degree, deterministic coordinates, edge prominence.
- `lib/layout/relationship-transition.ts`: pure current-position store creation and damp/snap frame update.
- `components/galaxy/RelationshipSpaceController.tsx`: one R3F frame owner for current positions.
- `components/galaxy/RelationshipAxesLegend.tsx`: target-mode DOM legend and accessible explanation.
- `components/galaxy/GalaxyScene.tsx`: selects overview/target layout and shares the current-position store.
- `components/galaxy/PlanetNode.tsx`: reads one mutable current vector each frame.
- `components/galaxy/RelationshipField.tsx`: updates 3D edge geometry from shared current vectors and applies prominence.
- `app/globals.css`: desktop height ownership, gesture containment, legend styling, responsive reset.
- `tests/unit/relationship-space.test.ts`: semantic coordinate and determinism contract.
- `tests/unit/relationship-transition.test.ts`: interpolation and reduced-motion contract.
- `tests/components/relationship-axes-legend.test.tsx`: legend visibility and copy.
- `e2e/galaxy-interaction.spec.ts`: desktop viewport, wheel containment, semantic origin, Z-depth, repeated selection.

---

### Task 1: Deterministic semantic relationship layout

**Files:**
- Create: `tests/unit/relationship-space.test.ts`
- Create: `lib/layout/relationship-space.ts`
- Modify: `tests/unit/layout.test.ts`

**Interfaces:**
- Consumes: `LessonPack`, `RelationshipEdge`, `GalaxyPoint`, and `createGalaxyLayout(pack)`.
- Produces:
  - `RelationshipLayer = "origin" | "direct" | "second-degree" | "context"`
  - `RelationshipProminence = "origin" | "second-degree" | "context"`
  - `RelationshipSpacePoint extends GalaxyPoint { layer; degree; radius }`
  - `RelationshipSpaceLayout { points; degrees; targetId }`
  - `scoreRelationship(edge, targetId): { direction; valence; context }`
  - `createRelationshipSpace(pack, targetId): RelationshipSpaceLayout`
  - `classifyRelationshipProminence(edge, layout): RelationshipProminence`

- [ ] **Step 1: Write failing semantic-axis tests**

```ts
import { describe, expect, it } from "vitest";
import { createRelationshipSpace, scoreRelationship } from "@/lib/layout/relationship-space";
import { getLessonPack } from "@/lib/lessons/repository";

const romeo = getLessonPack("romeo-and-juliet")!;

describe("semantic relationship space", () => {
  it("places the selected target at the origin deterministically", () => {
    const first = createRelationshipSpace(romeo, "romeo");
    const second = createRelationshipSpace(romeo, "romeo");
    expect(first.points.get("romeo")).toMatchObject({ x: 0, y: 0, z: 0, layer: "origin" });
    expect([...first.points]).toEqual([...second.points]);
  });

  it("keeps strong direct relations closer than weak and second-degree relations", () => {
    const layout = createRelationshipSpace(romeo, "juliet");
    expect(layout.points.get("romeo")!.radius).toBeLessThan(layout.points.get("paris")!.radius);
    expect(layout.points.get("romeo")!.radius).toBeLessThan(layout.points.get("mercutio")!.radius);
  });

  it("maps love above conflict and private bonds in front of public rivalry", () => {
    const romance = romeo.relationships.find((edge) => edge.id === "romeo-loves-juliet")!;
    const conflict = romeo.relationships.find((edge) => edge.id === "tybalt-challenges-romeo")!;
    expect(scoreRelationship(romance, "romeo").valence).toBeGreaterThan(0);
    expect(scoreRelationship(conflict, "romeo").valence).toBeLessThan(0);
    expect(scoreRelationship(romance, "romeo").context).toBeGreaterThan(scoreRelationship(conflict, "romeo").context);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
npm test -- tests/unit/relationship-space.test.ts
```

Expected: FAIL because `@/lib/layout/relationship-space` does not exist.

- [ ] **Step 3: Implement the semantic score and graph-degree model**

Implement fixed maps for base valence/context and reviewed tag adjustments:

```ts
const TYPE_VALENCE = {
  romance: 1,
  friendship: 0.8,
  family: 0.55,
  alliance: 0.5,
  mentorship: 0.3,
  service: 0.15,
  influence: 0.1,
  conflict: -1,
  "political-rivalry": -0.9,
} satisfies Record<RelationshipEdge["type"], number>;

const TYPE_CONTEXT = {
  romance: 1,
  friendship: 0.8,
  family: 0.85,
  mentorship: 0.35,
  service: -0.25,
  alliance: -0.45,
  influence: -0.65,
  conflict: -0.35,
  "political-rivalry": -1,
} satisfies Record<RelationshipEdge["type"], number>;
```

Use edge direction for X, type/tag scores for Y/Z, breadth-first graph distance for layers, `6.5 - strength * 0.65` for direct radius, `7.2–9.4` for degree two, and `10.5–12` for context. Normalize the semantic vector, apply only a bounded seed-derived collision lane, round to three decimals, and preserve the target at exact zero.

- [ ] **Step 4: Add completeness and separation tests**

```ts
it("keeps all people finite, separated, and inside the teaching field", () => {
  const layout = createRelationshipSpace(romeo, "romeo");
  const points = [...layout.points.values()];
  expect(points).toHaveLength(romeo.characters.length);
  for (const point of points) {
    expect(Number.isFinite(point.x + point.y + point.z)).toBe(true);
    expect(Math.hypot(point.x, point.y, point.z)).toBeLessThanOrEqual(12.5);
  }
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y, points[i].z - points[j].z)).toBeGreaterThan(0.9);
    }
  }
});
```

- [ ] **Step 5: Run layout tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/relationship-space.test.ts tests/unit/layout.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit the pure model**

```powershell
git add lib/layout/relationship-space.ts tests/unit/relationship-space.test.ts tests/unit/layout.test.ts
git commit -m "feat: model semantic relationship space"
```

---

### Task 2: Desktop single-viewport workspace

**Files:**
- Modify: `e2e/galaxy-interaction.spec.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `.learning-workspace`, `.workspace-grid`, `.observatory-stage`, `.galaxy-viewport`, `.workspace-panel`, and `.character-rail` structure.
- Produces: desktop-only bounded workspace and isolated wheel/overscroll regions.

- [ ] **Step 1: Write a failing desktop viewport browser test**

```ts
test("desktop observatory owns one viewport without document scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/romeo-and-juliet?focus=romeo");
  const before = await page.evaluate(() => ({ y: scrollY, client: document.documentElement.clientHeight, scroll: document.documentElement.scrollHeight }));
  expect(before.scroll).toBeLessThanOrEqual(before.client + 1);
  await page.locator(".galaxy-canvas").hover();
  await page.mouse.wheel(0, 600);
  expect(await page.evaluate(() => scrollY)).toBe(before.y);
});
```

- [ ] **Step 2: Run the viewport test and verify RED**

Run against a clean local server:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
npx playwright test e2e/galaxy-interaction.spec.ts --grep "owns one viewport" --workers=1
```

Expected: FAIL because document scroll height exceeds the viewport.

- [ ] **Step 3: Implement desktop height ownership**

Add a desktop-only block after the legacy fallback rules:

```css
@media (min-width: 1181px) {
  .learning-workspace {
    height: 100svh;
    min-height: 0;
    overflow: hidden;
  }

  .learning-workspace .workspace-grid {
    height: calc(100svh - 7.8rem);
    min-height: 0;
    overflow: hidden;
  }

  .observatory-stage {
    min-height: 0;
    grid-template-rows: minmax(0, 1fr) auto;
    overflow: hidden;
  }

  .learning-workspace .workspace-panel,
  .learning-workspace .galaxy-viewport {
    min-height: 0;
    height: 100%;
  }

  .learning-workspace .workspace-panel {
    overscroll-behavior: contain;
  }

  .galaxy-canvas {
    overscroll-behavior: none;
    touch-action: none;
  }
}
```

- [ ] **Step 4: Verify desktop GREEN and mobile unchanged**

Run:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
npx playwright test e2e/galaxy-interaction.spec.ts e2e/accessibility.spec.ts --workers=1
```

Expected: desktop document has no scrollbar; mobile/native accessibility behavior still passes.

- [ ] **Step 5: Commit the viewport correction**

```powershell
git add app/globals.css e2e/galaxy-interaction.spec.ts
git commit -m "fix: bound the desktop observatory viewport"
```

---

### Task 3: Shared animated R3F position space

**Files:**
- Create: `tests/unit/relationship-transition.test.ts`
- Create: `lib/layout/relationship-transition.ts`
- Create: `components/galaxy/RelationshipSpaceController.tsx`
- Modify: `components/galaxy/PlanetNode.tsx`
- Modify: `components/galaxy/RelationshipField.tsx`
- Modify: `components/galaxy/GalaxyScene.tsx`

**Interfaces:**
- Consumes: `RelationshipSpaceLayout.points`, `THREE.Vector3`, `reduceMotion`.
- Produces:
  - `RelationshipPositionStore = Map<string, THREE.Vector3>`
  - `createRelationshipPositionStore(points): RelationshipPositionStore`
  - `advanceRelationshipPositions(store, targets, delta, snap): void`
  - `<RelationshipSpaceController store targets reduceMotion />`

- [ ] **Step 1: Write failing transition-store tests**

```ts
it("damps every current point toward its semantic target", () => {
  const store = createRelationshipPositionStore(new Map([["romeo", { x: 4, y: 0, z: 0 }]]));
  const targets = new Map([["romeo", { x: 0, y: 0, z: 0 }]]);
  advanceRelationshipPositions(store, targets, 1 / 60, false);
  expect(store.get("romeo")!.x).toBeGreaterThan(0);
  expect(store.get("romeo")!.x).toBeLessThan(4);
});

it("snaps in reduced-motion mode", () => {
  const store = createRelationshipPositionStore(new Map([["romeo", { x: 4, y: 0, z: 0 }]]));
  advanceRelationshipPositions(store, new Map([["romeo", { x: 0, y: 1, z: 2 }]]), 1 / 60, true);
  expect(store.get("romeo")!.toArray()).toEqual([0, 1, 2]);
});
```

- [ ] **Step 2: Run transition tests and verify RED**

Run:

```powershell
npm test -- tests/unit/relationship-transition.test.ts
```

Expected: FAIL because the transition module does not exist.

- [ ] **Step 3: Implement the pure position-store update**

Use frame-rate-independent damping:

```ts
const alpha = snap ? 1 : 1 - Math.exp(-8 * Math.min(delta, 0.1));
current.lerp(target, alpha);
```

Create missing vectors from their target and remove no vectors during a transition.

- [ ] **Step 4: Connect one R3F frame controller**

`RelationshipSpaceController` calls `advanceRelationshipPositions` from one `useFrame`. `GalaxyScene` creates the store once from overview coordinates, memoizes target coordinates from `selectedCharacterId`, and passes each shared vector to planets, edges, and the label projector.

Update `PlanetNode` to copy its shared vector into `groupRef.current.position` each frame. Update `RelationshipField` to update its two position-buffer vertices and pulse endpoints from the same vectors each frame. Update label projection to read the shared vectors instead of immutable layout points.

- [ ] **Step 5: Remove camera fly-to behavior in target mode**

Keep `OrbitControls.target` at `[0, 0, 0]`. Remove `CameraFocus` from selection changes; selection now moves the semantic space around a stable origin. Preserve damping, zoom limits, pointer hit priority, and reset behavior.

- [ ] **Step 6: Run focused unit and component suites**

Run:

```powershell
npm test -- tests/unit/relationship-transition.test.ts tests/unit/camera-focus.test.ts tests/components/learning-experience.test.tsx
npx tsc --noEmit
```

Expected: all focused tests and type checking pass. The camera-focus utility may remain tested for other consumers even if no longer used by the galaxy.

- [ ] **Step 7: Commit the shared 3D transition system**

```powershell
git add lib/layout/relationship-transition.ts tests/unit/relationship-transition.test.ts components/galaxy/RelationshipSpaceController.tsx components/galaxy/PlanetNode.tsx components/galaxy/RelationshipField.tsx components/galaxy/GalaxyScene.tsx
git commit -m "feat: animate target-centered relationship space"
```

---

### Task 4: Semantic legend and relationship prominence

**Files:**
- Create: `tests/components/relationship-axes-legend.test.tsx`
- Create: `components/galaxy/RelationshipAxesLegend.tsx`
- Modify: `components/galaxy/GalaxyScene.tsx`
- Modify: `components/galaxy/RelationshipField.tsx`
- Modify: `app/globals.css`
- Modify: `e2e/galaxy-interaction.spec.ts`

**Interfaces:**
- Consumes: selected target name, relationship-space layers, selected/highlighted edge state.
- Produces: `<RelationshipAxesLegend targetName />`, semantic line tone/opacity, diagnostic world-coordinate data attributes.

- [ ] **Step 1: Write failing legend and visibility tests**

```tsx
render(<RelationshipAxesLegend targetName="Romeo" />);
expect(screen.getByRole("note", { name: "Relationship space axes" })).toHaveTextContent("Romeo is the origin");
expect(screen.getByText(/affinity \/ conflict/i)).toBeVisible();
expect(screen.getByText(/personal \/ public/i)).toBeVisible();
```

- [ ] **Step 2: Run the component test and verify RED**

Run:

```powershell
npm test -- tests/components/relationship-axes-legend.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the restrained overlay**

Render a non-interactive DOM note only when `selectedCharacterId` resolves to a character. Use four compact rows for near/far, up/down, front/back, and incoming/outgoing. Add screen-reader text to the canvas description and `pointer-events: none` in CSS.

- [ ] **Step 4: Apply semantic line prominence**

Pass `RelationshipProminence` into `RelationshipField`. Selected and mission-highlighted edges remain strongest; origin edges are next; second-degree edges are reduced; context edges are faint. Use positive/collaborative tone, conflict tone, and neutral/influence tone derived from the fixed relationship type map.

- [ ] **Step 5: Add world-coordinate diagnostics and browser assertions**

The label projector writes current `data-world-x`, `data-world-y`, and `data-world-z` values each frame. Extend Playwright:

```ts
await page.getByRole("button", { name: "Select Romeo" }).click();
await expect(page.locator('[data-character-label="Romeo"]')).toHaveAttribute("data-space-origin", "true");
await expect.poll(async () => Number(await page.locator('[data-character-label="Romeo"]').getAttribute("data-world-x"))).toBeCloseTo(0, 1);

const depths = await page.locator("[data-world-z]").evaluateAll((nodes) => nodes.map((node) => Number((node as HTMLElement).dataset.worldZ)));
expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(2);
```

- [ ] **Step 6: Run component and browser tests**

Run:

```powershell
npm test -- tests/components/relationship-axes-legend.test.tsx
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
npx playwright test e2e/galaxy-interaction.spec.ts --workers=1
```

Expected: legend and 3D semantic-depth journeys pass with no page errors.

- [ ] **Step 7: Commit the explanatory layer**

```powershell
git add components/galaxy/RelationshipAxesLegend.tsx components/galaxy/GalaxyScene.tsx components/galaxy/RelationshipField.tsx app/globals.css tests/components/relationship-axes-legend.test.tsx e2e/galaxy-interaction.spec.ts
git commit -m "feat: explain semantic relationship axes"
```

---

### Task 5: Documentation, full verification, and publication

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`

**Interfaces:**
- Consumes: completed viewport and semantic-space behavior.
- Produces: user-facing description, architecture notes, verified `main` publication.

- [ ] **Step 1: Document the spatial rules**

Add the four encodings to README and explain in architecture that selection creates deterministic target coordinates while one R3F position store drives planets, edges, labels, and hit geometry.

- [ ] **Step 2: Run the repository verification gate**

Run:

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run content:validate
npm run build
```

Expected: zero failures; record exact test counts and route output.

- [ ] **Step 3: Run all production Chromium journeys**

Start the optimized app on port `3010`, then run:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3010'
npx playwright test --workers=1
```

Expected: all journeys pass, including desktop no-scroll, mobile natural flow, target origin, depth distribution, stable selection, and existing lesson completion.

- [ ] **Step 4: Inspect visually in the real browser**

Verify French Revolution and Romeo and Juliet active workspaces at desktop size. Confirm no document scrollbar, internal evidence scrolling, useful depth after orbit rotation, stable target switching, no label obstruction, and no console errors.

- [ ] **Step 5: Commit documentation**

```powershell
git add README.md docs/ARCHITECTURE.md
git commit -m "docs: describe semantic relationship space"
```

- [ ] **Step 6: Publish and verify the exact remote SHA**

```powershell
git push origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
git status --short
```

Expected: local and remote `main` SHAs match and the worktree is clean.
