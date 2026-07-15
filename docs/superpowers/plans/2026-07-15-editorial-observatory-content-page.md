# Editorial Observatory Content Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the active lesson as an editorial observatory with a dominant, well-spaced 3D relationship field and fixed-size, crisp HTML character labels.

**Architecture:** Keep `LearningExperience` as the owner of lesson state and extract only the active lesson composition into a slot-based `ObservatoryShell`. Replace ray-inherited relationship placement with deterministic semantic sectors, centralize camera fitting in a pure layout helper, and keep label projection in HTML using snapped translation without CSS scaling. Styling is consolidated into one final observatory layer that uses the existing paper exhibition header and a dark full-bleed stage.

**Tech Stack:** Next.js 16, React 19, TypeScript, React Three Fiber, Three.js, Motion, CSS, Vitest, Testing Library, Playwright.

## Global Constraints

- Product copy remains English by default.
- Desktop at widths above 1180px is a single `100svh` viewport without document scrolling.
- Tablet from 801px to 1180px and mobile up to 800px use natural vertical document flow.
- The selected person remains exactly `[0, 0, 0]`; orbit target remains fixed at the origin and panning remains disabled.
- Direct shell radius is 6.8–9.2 world units, second-degree shell radius is 10.2–13.2, and context shell radius is 13.5–15.5.
- Non-origin nodes must be deterministically separated by at least 2.2 world units.
- Character names use fixed 13–14px HTML text; label transforms contain translation only and never CSS `scale()`.
- Preserve reviewed evidence, mission evaluation, GPT-5.6 contracts, complete 2D equivalence, WebGL fallback, keyboard access, reduced motion, and both complete lesson journeys.
- Do not add post-processing, bloom, physics, free-flight controls, or image-based planets.

---

## File map

- Create `components/learning/ObservatoryShell.tsx`: semantic, slot-based active lesson composition.
- Create `lib/layout/relationship-camera.ts`: pure bounded camera-fit calculation.
- Create `lib/layout/galaxy-label.ts`: pure half-pixel snapping and translation-only label transform.
- Create `tests/unit/relationship-camera.test.ts`: camera frame bounds and determinism.
- Create `tests/unit/galaxy-label.test.ts`: crisp translation contract.
- Create `tests/components/observatory-shell.test.tsx`: active workspace landmark and content-slot contract.
- Modify `lib/layout/relationship-space.ts`: deterministic semantic sectors, shell radii, and 2.2-unit separation.
- Modify `tests/unit/relationship-space.test.ts`: shell, separation, depth, and deterministic placement coverage.
- Modify `components/galaxy/GalaxyScene.tsx`: camera frame, label detail metadata, snapped transforms, and no scale.
- Modify `components/galaxy/PlanetNode.tsx`: moderately larger planet and hit radii.
- Modify `components/learning/LearningExperience.tsx`: paper header and `ObservatoryShell` composition.
- Modify `components/learning/MissionPanel.tsx`: five-mark progress sequence.
- Modify `components/learning/EvidencePanel.tsx`: contextual sheet semantics while preserving content behavior.
- Modify `components/learning/CharacterRail.tsx`: filmstrip label and more legible entries.
- Modify `tests/components/learning-experience.test.tsx`: shell landmarks, paper header, fallback, and selection regression.
- Modify `app/globals.css`: editorial observatory materials, viewport layout, fixed-size labels, and responsive modes.
- Modify `e2e/galaxy-interaction.spec.ts`: viewport, label, separation, zoom, and repeated-selection regression checks.
- Modify `docs/superpowers/specs/2026-07-15-editorial-observatory-content-page-design.md`: final implementation status.

### Task 1: Deterministic semantic sectors and camera framing

**Files:**
- Modify: `tests/unit/relationship-space.test.ts`
- Create: `tests/unit/relationship-camera.test.ts`
- Modify: `lib/layout/relationship-space.ts`
- Create: `lib/layout/relationship-camera.ts`

**Interfaces:**
- Consumes: `LessonPack`, `RelationshipSpacePoint`, and the existing `createRelationshipSpace(pack, targetId)` return type.
- Produces: `RELATIONSHIP_SHELLS`, `MIN_RELATIONSHIP_SEPARATION`, and `fitRelationshipCamera(points, options?) => RelationshipCameraFrame`.

- [ ] **Step 1: Write failing semantic-sector tests**

Add shell and minimum-separation assertions for every target in both official lessons:

```ts
import {
  MIN_RELATIONSHIP_SEPARATION,
  RELATIONSHIP_SHELLS,
  createRelationshipSpace,
} from "@/lib/layout/relationship-space";

for (const lesson of [romeo, revolution]) {
  for (const target of lesson.characters) {
    const layout = createRelationshipSpace(lesson, target.id);
    const nonOrigin = [...layout.points.values()].filter((point) => point.layer !== "origin");

    for (const point of nonOrigin) {
      const shell = RELATIONSHIP_SHELLS[point.layer];
      expect(point.radius).toBeGreaterThanOrEqual(shell.min);
      expect(point.radius).toBeLessThanOrEqual(shell.max);
      expect(Math.abs(point.z)).toBeLessThan(15.5);
    }

    for (let first = 0; first < nonOrigin.length; first += 1) {
      for (let second = first + 1; second < nonOrigin.length; second += 1) {
        expect(Math.hypot(
          nonOrigin[first].x - nonOrigin[second].x,
          nonOrigin[first].y - nonOrigin[second].y,
          nonOrigin[first].z - nonOrigin[second].z,
        )).toBeGreaterThanOrEqual(MIN_RELATIONSHIP_SEPARATION);
      }
    }
  }
}
```

- [ ] **Step 2: Run the relationship-space test and confirm the old radii fail**

Run: `npm test -- tests/unit/relationship-space.test.ts`

Expected: FAIL because the current direct, second-degree, and context radii are below the approved shells and the separation constant is not exported.

- [ ] **Step 3: Write the failing camera-frame test**

Create `tests/unit/relationship-camera.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fitRelationshipCamera } from "@/lib/layout/relationship-camera";

describe("relationship camera frame", () => {
  it("returns a deterministic 40 degree frame bounded for orbit controls", () => {
    const points = [
      { x: 0, y: 0, z: 0, layer: "origin" as const, degree: 0, radius: 0 },
      { x: -8, y: 5, z: 3, layer: "direct" as const, degree: 1, radius: 9.2 },
      { x: 10, y: -7, z: -4, layer: "second-degree" as const, degree: 2, radius: 13.2 },
      { x: 14, y: 2, z: 5, layer: "context" as const, degree: null, radius: 15 },
    ];

    const first = fitRelationshipCamera(points, { aspect: 16 / 9 });
    const second = fitRelationshipCamera(points, { aspect: 16 / 9 });
    expect(first).toEqual(second);
    expect(first.fov).toBe(40);
    expect(first.distance).toBeGreaterThanOrEqual(first.minDistance);
    expect(first.distance).toBeLessThanOrEqual(first.maxDistance);
    expect(Number.isFinite(first.distance)).toBe(true);
  });
});
```

- [ ] **Step 4: Run the camera test and confirm the module is missing**

Run: `npm test -- tests/unit/relationship-camera.test.ts`

Expected: FAIL with module resolution for `@/lib/layout/relationship-camera`.

- [ ] **Step 5: Implement semantic sector constants and placement**

In `lib/layout/relationship-space.ts`, define the approved shells and use sorted deterministic sectors instead of child-ray inheritance:

```ts
export const MIN_RELATIONSHIP_SEPARATION = 2.2;
export const RELATIONSHIP_SHELLS = {
  direct: { min: 6.8, max: 9.2 },
  "second-degree": { min: 10.2, max: 13.2 },
  context: { min: 13.5, max: 15.5 },
} as const;

function shellRadius(layer: Exclude<RelationshipLayer, "origin">, strength: number, seed: string) {
  const shell = RELATIONSHIP_SHELLS[layer];
  if (layer === "direct") return shell.max - clamp(strength, 0, 1) * (shell.max - shell.min);
  return shell.min + hashUnit(seed) * (shell.max - shell.min);
}

function sectorDirection(
  semantic: GalaxyPoint,
  index: number,
  total: number,
  seed: string,
  tangentWeight: number,
): GalaxyPoint {
  const angle = ((index + 0.5) / Math.max(total, 1)) * Math.PI * 2
    + (hashUnit(`${seed}:jitter`) - 0.5) * 0.24;
  return normalize({
    x: semantic.x + Math.cos(angle) * tangentWeight,
    y: clamp(semantic.y + (hashUnit(`${seed}:height`) - 0.5) * tangentWeight * 0.36),
    z: semantic.z + Math.sin(angle) * tangentWeight,
  });
}
```

Build direct, second-degree, and context character arrays sorted by ID before placement. Direct nodes use their scored semantic vector with `tangentWeight: 0.55`; second-degree nodes combine the first-hop quadrant with an independent child sector at `tangentWeight: 1.05`; context nodes use `contextualDirection` at the outer shell. Update `placeSeparated` to test `>= MIN_RELATIONSHIP_SEPARATION`, retry deterministic yaw plus bounded pitch, and clamp context Z after every retry.

- [ ] **Step 6: Implement bounded camera fitting**

Create `lib/layout/relationship-camera.ts`:

```ts
import type { RelationshipSpacePoint } from "@/lib/layout/relationship-space";

export interface RelationshipCameraFrame {
  fov: 40;
  distance: number;
  minDistance: number;
  maxDistance: number;
}

export function fitRelationshipCamera(
  points: Iterable<RelationshipSpacePoint>,
  { aspect = 16 / 9, labelMargin = 1.8 }: { aspect?: number; labelMargin?: number } = {},
): RelationshipCameraFrame {
  const teachingPoints = [...points].filter((point) => point.layer !== "context");
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const fov = 40 as const;
  const tangent = Math.tan((fov * Math.PI) / 360);
  const vertical = Math.max(5, ...teachingPoints.map((point) => Math.abs(point.y) + labelMargin));
  const horizontal = Math.max(8, ...teachingPoints.map((point) => Math.abs(point.x) / safeAspect + 1));
  const nearestDepth = Math.max(0, ...teachingPoints.map((point) => point.z));
  const distance = Math.min(32, Math.max(18, nearestDepth + Math.max(vertical, horizontal) / tangent));
  return { fov, distance: Math.round(distance * 100) / 100, minDistance: 8, maxDistance: 34 };
}
```

- [ ] **Step 7: Run both unit suites and make them pass**

Run: `npm test -- tests/unit/relationship-space.test.ts tests/unit/relationship-camera.test.ts`

Expected: both files PASS; all official lesson targets remain deterministic, finite, inside their declared shells, and separated by at least 2.2.

- [ ] **Step 8: Commit spatial layout work**

```bash
git add lib/layout/relationship-space.ts lib/layout/relationship-camera.ts tests/unit/relationship-space.test.ts tests/unit/relationship-camera.test.ts
git commit -m "feat: spread characters through semantic relationship sectors"
```

### Task 2: Crisp labels, camera application, and larger planets

**Files:**
- Create: `tests/unit/galaxy-label.test.ts`
- Create: `lib/layout/galaxy-label.ts`
- Modify: `components/galaxy/GalaxyScene.tsx`
- Modify: `components/galaxy/PlanetNode.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `fitRelationshipCamera`, semantic layout point layers, existing mutable `THREE.Vector3` position store.
- Produces: `snapLabelCoordinate(value: number): number` and `createGalaxyLabelTransform(x, y): string`.

- [ ] **Step 1: Write the failing translation-only label test**

Create `tests/unit/galaxy-label.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createGalaxyLabelTransform, snapLabelCoordinate } from "@/lib/layout/galaxy-label";

describe("galaxy label projection", () => {
  it("snaps to half pixels and never scales text", () => {
    expect(snapLabelCoordinate(28.24)).toBe(28);
    expect(snapLabelCoordinate(28.26)).toBe(28.5);
    const transform = createGalaxyLabelTransform(28.26, 91.74);
    expect(transform).toBe("translate3d(28.5px, 91.5px, 0) translate(-50%, -50%)");
    expect(transform).not.toMatch(/scale/i);
  });
});
```

- [ ] **Step 2: Run the test and confirm the helper is missing**

Run: `npm test -- tests/unit/galaxy-label.test.ts`

Expected: FAIL with module resolution for `@/lib/layout/galaxy-label`.

- [ ] **Step 3: Implement snapped label transforms**

Create `lib/layout/galaxy-label.ts`:

```ts
export function snapLabelCoordinate(value: number): number {
  return Math.round(value * 2) / 2;
}

export function createGalaxyLabelTransform(x: number, y: number): string {
  return `translate3d(${snapLabelCoordinate(x)}px, ${snapLabelCoordinate(y)}px, 0) translate(-50%, -50%)`;
}
```

- [ ] **Step 4: Remove distance scaling from `GalaxyLabelProjector`**

In `components/galaxy/GalaxyScene.tsx`:

- Remove `scale` from `projectedLabels`.
- Measure collision boxes using `offsetWidth` and `offsetHeight` directly.
- Write `element.style.transform = createGalaxyLabelTransform(x, y)`.
- Set opacity from camera distance without changing geometry: `element.style.opacity = String(THREE.MathUtils.clamp(1.2 - distance / 42, 0.56, 1))`.
- Add `data-label-layer` from `semanticLayout?.points.get(character.id)?.layer ?? "context"`.
- Keep `data-planet-x`, `data-planet-y`, and world-coordinate diagnostics.
- Compute `cameraFrame = fitRelationshipCamera(targetPoints.values(), { aspect: viewport.width / Math.max(window.innerHeight, 1) })` and apply `camera={{ position: [0, 1, cameraFrame.distance], fov: cameraFrame.fov }}` plus its min/max distances to `OrbitControls`.

The final transform assignment must be exactly:

```ts
label.element.style.transform = createGalaxyLabelTransform(x, y);
```

- [ ] **Step 5: Increase visual and hit radii without changing planet technology**

In `components/galaxy/PlanetNode.tsx`, use:

```ts
const size = 0.38 + importance * 0.1;
// interaction sphere
<sphereGeometry args={[size * 1.42, 28, 28]} />
```

Keep the procedural shader, rings, selected halo, `stopPropagation`, and pointer cursor behavior unchanged.

- [ ] **Step 6: Establish fixed label typography in CSS**

Update `.galaxy-node-label` so it uses an opaque surface and no rasterizing filter:

```css
.galaxy-node-label {
  min-width: 11.75rem;
  min-height: 3rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0;
  background: rgba(7, 11, 20, 0.96);
  backdrop-filter: none;
  transform-origin: center;
}

.galaxy-node-label strong { font-size: 14px; line-height: 1.15; }
.galaxy-node-label small { font-size: 11px; line-height: 1.2; }
.galaxy-node-label[data-label-layer="context"] small { display: none; }
```

- [ ] **Step 7: Run label, layout, and visual-quality unit tests**

Run: `npm test -- tests/unit/galaxy-label.test.ts tests/unit/relationship-space.test.ts tests/unit/relationship-camera.test.ts tests/unit/galaxy-visual-quality.test.ts`

Expected: all selected unit suites PASS and no label transform contains `scale`.

- [ ] **Step 8: Commit crisp galaxy presentation**

```bash
git add lib/layout/galaxy-label.ts components/galaxy/GalaxyScene.tsx components/galaxy/PlanetNode.tsx app/globals.css tests/unit/galaxy-label.test.ts
git commit -m "feat: keep galaxy labels crisp while zooming"
```

### Task 3: Editorial observatory composition

**Files:**
- Create: `tests/components/observatory-shell.test.tsx`
- Create: `components/learning/ObservatoryShell.tsx`
- Modify: `components/learning/LearningExperience.tsx`
- Modify: `components/learning/MissionPanel.tsx`
- Modify: `components/learning/EvidencePanel.tsx`
- Modify: `components/learning/CharacterRail.tsx`
- Modify: `tests/components/learning-experience.test.tsx`

**Interfaces:**
- Consumes: slot content as `ReactNode`, lesson metadata, and an optional WebGL status string.
- Produces: `ObservatoryShell({ lesson, mission, galaxy, evidence, characterIndex, status }): JSX.Element` with named landmarks.

- [ ] **Step 1: Write the failing shell landmark test**

Create `tests/components/observatory-shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObservatoryShell } from "@/components/learning/ObservatoryShell";
import { getLessonPack } from "@/lib/lessons/repository";

const lesson = getLessonPack("french-revolution")!;

describe("ObservatoryShell", () => {
  it("exposes the editorial rail, dominant stage, evidence sheet, and people filmstrip", () => {
    render(
      <ObservatoryShell
        lesson={lesson}
        mission={<p>mission slot</p>}
        galaxy={<p>galaxy slot</p>}
        evidence={<p>evidence slot</p>}
        characterIndex={<p>people slot</p>}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Current mission" })).toHaveTextContent("mission slot");
    expect(screen.getByRole("region", { name: "Relationship observatory" })).toHaveTextContent("galaxy slot");
    expect(screen.getByRole("complementary", { name: "Evidence sheet" })).toHaveTextContent("evidence slot");
    expect(screen.getByRole("navigation", { name: "People filmstrip" })).toHaveTextContent("people slot");
    expect(screen.getByText("9 people · 12 relationships")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the shell test and confirm the module is missing**

Run: `npm test -- tests/components/observatory-shell.test.tsx`

Expected: FAIL with module resolution for `@/components/learning/ObservatoryShell`.

- [ ] **Step 3: Implement the slot-based shell**

Create `components/learning/ObservatoryShell.tsx`:

```tsx
import type { ReactNode } from "react";
import type { LessonPack } from "@/lib/lessons/schema";

export function ObservatoryShell({
  lesson,
  mission,
  galaxy,
  evidence,
  characterIndex,
  status,
}: {
  lesson: LessonPack;
  mission: ReactNode;
  galaxy: ReactNode;
  evidence: ReactNode;
  characterIndex: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="observatory-shell">
      <aside className="mission-panel" aria-label="Current mission">{mission}</aside>
      <section className="observatory-stage" aria-label="Relationship observatory">
        <header className="observatory-caption">
          <span>{lesson.kind}</span>
          <strong>{lesson.title}</strong>
          <i>{lesson.characters.length} people · {lesson.relationships.length} relationships</i>
        </header>
        {status}
        <div className="galaxy-viewport">{galaxy}</div>
        <aside className="evidence-panel" aria-label="Evidence sheet">{evidence}</aside>
        <nav className="observatory-filmstrip" aria-label="People filmstrip">{characterIndex}</nav>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Move active composition out of `LearningExperience`**

In `components/learning/LearningExperience.tsx`:

- Change the active `ExhibitionHeader` to `theme="paper"`.
- Keep all existing actions and handlers.
- Remove `motion` while retaining `useReducedMotion` for the 3D scene.
- Replace `observatory-titlebar`, `workspace-grid`, and both full-height motion asides with `ObservatoryShell` slots.
- Pass the existing `MissionPanel`, chosen 3D/2D surface, `EvidencePanel`, and `CharacterRail` without changing selection or mission behavior.

The active body becomes:

```tsx
<ObservatoryShell
  lesson={lesson}
  status={!available ? <div className="webgl-status" role="status">3D is unavailable on this device. The complete lesson is open in the 2D relationship list.</div> : undefined}
  mission={<MissionPanel {...missionProps} />}
  galaxy={view === "3d" && available ? <GalaxyScene {...galaxyProps} /> : <RelationshipListView {...listProps} />}
  evidence={<EvidencePanel lesson={lesson} character={focusedCharacter} relationship={focusedRelationship} sessionId={`${lesson.id}:${session.startedAt}`} />}
  characterIndex={<CharacterRail characters={lesson.characters} groups={lesson.groups} selectedCharacterId={focusedCharacterId} onSelect={selectCharacter} />}
/>
```

- [ ] **Step 5: Convert mission progress to five editorial marks**

In `MissionPanel.tsx`, replace the width bar with an ordered sequence while keeping its accessible label:

```tsx
<ol className="mission-progress-track" aria-label={`${position} of ${total} missions`}>
  {Array.from({ length: total }, (_, index) => (
    <li key={index} data-state={index + 1 < position ? "complete" : index + 1 === position ? "current" : "upcoming"}>
      <span>{String(index + 1).padStart(2, "0")}</span>
    </li>
  ))}
</ol>
```

- [ ] **Step 6: Add contextual sheet and filmstrip semantics**

In `EvidencePanel.tsx`, add `data-evidence-state="relationship"`, `"character"`, or `"empty"` to the three top-level states. In `CharacterRail.tsx`, change its internal `nav` to a `div` to prevent nested navigation and rename the visible heading from `People index` to `People in this constellation`; keep the existing `aria-label` on character buttons.

- [ ] **Step 7: Extend the learning experience regression test**

Add this test to `tests/components/learning-experience.test.tsx`:

```tsx
it("renders the approved editorial observatory without changing learning controls", () => {
  const active = createLearningSession(lesson.id, "2026-07-14T00:00:00.000Z");
  const { container } = render(<LearningExperience lesson={lesson} initialSession={active} initialView="2d" webglAvailable />);
  expect(screen.getByRole("complementary", { name: "Current mission" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Relationship observatory" })).toBeVisible();
  expect(screen.getByRole("complementary", { name: "Evidence sheet" })).toBeVisible();
  expect(screen.getByRole("navigation", { name: "People filmstrip" })).toBeVisible();
  expect(container.querySelector(".exhibition-header--paper")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Check mission" })).toBeVisible();
});
```

- [ ] **Step 8: Run component and offline-flow tests**

Run: `npm test -- tests/components/observatory-shell.test.tsx tests/components/learning-experience.test.tsx tests/integration/offline-learning-flow.test.tsx`

Expected: all selected suites PASS; 2D fallback, selection, hints, mission validation, and completion remain available.

- [ ] **Step 9: Commit the new composition**

```bash
git add components/learning/ObservatoryShell.tsx components/learning/LearningExperience.tsx components/learning/MissionPanel.tsx components/learning/EvidencePanel.tsx components/learning/CharacterRail.tsx tests/components/observatory-shell.test.tsx tests/components/learning-experience.test.tsx
git commit -m "feat: reshape lessons as an editorial observatory"
```

### Task 4: Editorial materials and responsive layout

**Files:**
- Modify: `app/globals.css`
- Modify: `e2e/galaxy-interaction.spec.ts`

**Interfaces:**
- Consumes: the semantic classes and landmarks from `ObservatoryShell` and label metadata from `GalaxyScene`.
- Produces: one-viewport desktop layout, tablet flow, mobile 2D-friendly flow, opaque evidence sheet, and bottom filmstrip.

- [ ] **Step 1: Add failing desktop material and layout assertions**

Append to `e2e/galaxy-interaction.spec.ts`:

```ts
test("the editorial observatory uses paper guidance around a dominant ink stage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/french-revolution?focus=robespierre");

  await expect(page.locator(".exhibition-header--paper")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Current mission" })).toHaveCSS("position", "relative");
  await expect(page.getByRole("complementary", { name: "Evidence sheet" })).toHaveCSS("position", "absolute");

  const proportions = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".observatory-shell")!;
    const stage = document.querySelector<HTMLElement>(".observatory-stage")!;
    return { shell: shell.clientWidth, stage: stage.clientWidth };
  });
  expect(proportions.stage / proportions.shell).toBeGreaterThan(0.7);
});
```

- [ ] **Step 2: Run the targeted browser test and confirm the old layout fails**

Run: `npx playwright test e2e/galaxy-interaction.spec.ts --grep "editorial observatory uses paper"`

Expected: FAIL because the new shell classes and overlay positions do not yet have their approved layout.

- [ ] **Step 3: Consolidate the final observatory CSS source of truth**

Replace the legacy active-observatory override at the end of `app/globals.css` with the following structural contract:

```css
.learning-workspace {
  --observatory-paper: #eeece5;
  --observatory-paper-raised: #e2ded3;
  --observatory-ink: #11110f;
  height: 100svh;
  min-height: 0;
  overflow: hidden;
  padding: 5.65rem 0 0;
  color: var(--observatory-ink);
  background: var(--observatory-paper);
}

.observatory-shell {
  height: calc(100svh - 5.65rem);
  min-height: 0;
  display: grid;
  grid-template-columns: clamp(15rem, 17vw, 17rem) minmax(0, 1fr);
  overflow: hidden;
}

.mission-panel {
  position: relative;
  z-index: 3;
  min-height: 0;
  overflow: auto;
  padding: clamp(1.4rem, 2.2vw, 2.2rem) clamp(1.15rem, 1.8vw, 1.8rem);
  color: var(--observatory-ink);
  background: var(--observatory-paper);
  border-right: 1px solid rgba(17, 17, 15, 0.18);
}

.observatory-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  color: #f3f1ea;
  background: #070b14;
}

.observatory-caption {
  position: absolute;
  z-index: 8;
  top: 0;
  right: 0;
  left: 0;
  min-height: 3.25rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(243, 241, 234, 0.14);
  background: rgba(7, 11, 20, 0.94);
}

.galaxy-viewport,
.galaxy-canvas { width: 100%; height: 100%; min-height: 0; overflow: hidden; }

.evidence-panel {
  position: absolute;
  z-index: 9;
  top: 4.25rem;
  right: 1rem;
  width: clamp(20rem, 23vw, 23rem);
  max-height: calc(100% - 11.75rem);
  overflow: auto;
  padding: 1.3rem;
  color: var(--observatory-ink);
  background: rgba(238, 236, 229, 0.97);
  border: 1px solid rgba(17, 17, 15, 0.2);
  box-shadow: -1.2rem 1.2rem 3rem rgba(0, 0, 0, 0.18);
}

.observatory-filmstrip {
  position: absolute;
  z-index: 10;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
}

.character-rail {
  padding: 0.7rem;
  border: 1px solid rgba(243, 241, 234, 0.18);
  background: rgba(7, 11, 20, 0.96);
}

.character-rail-track button { min-width: 14rem; }

.mission-content .eyebrow,
.mission-progress-row > span,
.evidence-content .eyebrow { color: rgba(17, 17, 15, 0.58); }

.mission-content h2 { font-size: clamp(1.55rem, 2.2vw, 1.8rem); color: var(--observatory-ink); }
.mission-content > p,
.evidence-content > p,
.evidence-empty p { color: rgba(17, 17, 15, 0.68); }

.mission-progress-track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.3rem;
  margin: 1rem 0 2rem;
  padding: 0;
  list-style: none;
  background: transparent;
}

.mission-progress-track li {
  padding-top: 0.45rem;
  border-top: 1px solid rgba(17, 17, 15, 0.24);
  color: rgba(17, 17, 15, 0.45);
  font-size: 0.62rem;
}

.mission-progress-track li[data-state="current"] {
  border-color: var(--observatory-ink);
  color: var(--observatory-ink);
  font-weight: 800;
}

.mission-response,
.evidence-content > strong { color: var(--observatory-ink); }

.mission-response textarea {
  color: var(--observatory-ink);
  border-color: rgba(17, 17, 15, 0.24);
  background: rgba(255, 255, 255, 0.42);
}

.mission-hint,
.mission-feedback,
.evidence-callout,
.dispute-note,
.evidence-panel .ai-insight {
  border-radius: 0;
  color: var(--observatory-ink);
  border-color: rgba(17, 17, 15, 0.2);
  background: rgba(255, 255, 255, 0.3);
}

.evidence-content h2,
.evidence-empty h2 { color: var(--observatory-ink); font-size: clamp(1.4rem, 2vw, 1.65rem); }
.evidence-content > a { color: var(--observatory-ink); }
.evidence-badge,
.evidence-panel .tag-list span { color: var(--observatory-ink); border-color: rgba(17, 17, 15, 0.24); }
```

Style mission headings, marks, controls, hints, evidence badges, tags, links, and the AI insight using ink-on-paper contrast. Remove `glass-material`, backdrop blur, broad radii, and equal-weight panel borders from the active workspace. Keep focus-visible outlines at least 2px and never encode mission status with color alone.

- [ ] **Step 4: Implement tablet and mobile flow**

Add exact responsive behavior:

```css
@media (max-width: 1180px) {
  .learning-workspace { height: auto; min-height: 100svh; overflow: visible; }
  .observatory-shell { height: auto; min-height: 0; grid-template-columns: 1fr; overflow: visible; }
  .mission-panel { max-height: none; border-right: 0; border-bottom: 1px solid rgba(17, 17, 15, 0.18); }
  .observatory-stage { min-height: 48rem; }
  .evidence-panel { position: relative; inset: auto; width: auto; max-height: none; margin: 1rem; }
  .observatory-filmstrip { position: relative; inset: auto; margin: 1rem; }
}

@media (max-width: 800px) {
  .learning-workspace { padding-top: 5.2rem; }
  .observatory-stage { min-height: 0; overflow: visible; }
  .galaxy-viewport { min-height: 34rem; }
  .observatory-caption { position: relative; grid-template-columns: 1fr; }
  .observatory-caption i { display: none; }
  .evidence-panel, .observatory-filmstrip { margin: 0.6rem; }
  .character-rail-track button { min-width: 12.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .mission-panel, .evidence-panel, .character-rail-track button { transition: none; animation: none; }
}
```

- [ ] **Step 5: Run component and targeted browser tests**

Run: `npm test -- tests/components/observatory-shell.test.tsx tests/components/learning-experience.test.tsx && npx playwright test e2e/galaxy-interaction.spec.ts --grep "editorial observatory uses paper"`

Expected: component suites and the editorial layout browser assertion PASS.

- [ ] **Step 6: Commit the visual system**

```bash
git add app/globals.css e2e/galaxy-interaction.spec.ts
git commit -m "style: align the lesson workspace with the editorial exhibition"
```

### Task 5: Browser regression coverage and final verification

**Files:**
- Modify: `e2e/galaxy-interaction.spec.ts`
- Modify: `docs/superpowers/specs/2026-07-15-editorial-observatory-content-page-design.md`

**Interfaces:**
- Consumes: label diagnostic attributes, observatory landmarks, Playwright browser runtime, and all existing lesson routes.
- Produces: automated acceptance evidence for scroll containment, label clarity, spatial separation, planet hit priority, and stable selection.

- [ ] **Step 1: Add complete viewport and label assertions**

Extend `e2e/galaxy-interaction.spec.ts`:

```ts
test("desktop labels remain crisp, readable, and separated while zooming", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 2048, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/learn/french-revolution?focus=robespierre");
    const labels = page.locator("[data-character-label]");
    await expect(labels.first()).toHaveAttribute("data-projection-ready", "true");

    const state = await labels.evaluateAll((nodes) => nodes.map((node) => {
      const element = node as HTMLElement;
      const style = getComputedStyle(element);
      return {
        name: element.dataset.characterLabel,
        fontSize: Number.parseFloat(getComputedStyle(element.querySelector("strong")!).fontSize),
        transform: element.style.transform,
        x: Number(element.dataset.planetX),
        y: Number(element.dataset.planetY),
      };
    }));

    expect(state.every((item) => item.fontSize >= 13)).toBe(true);
    expect(state.every((item) => !/scale/i.test(item.transform))).toBe(true);
    const projectedDistances = state.flatMap((first, firstIndex) =>
      state.slice(firstIndex + 1).map((second) => Math.hypot(first.x - second.x, first.y - second.y)),
    );
    expect(Math.min(...projectedDistances)).toBeGreaterThan(24);

    await page.locator(".galaxy-canvas").hover();
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(250);
    expect(await labels.evaluateAll((nodes) => nodes.every((node) => !/scale/i.test((node as HTMLElement).style.transform)))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)).toBeLessThanOrEqual(1);
  }
});
```

- [ ] **Step 2: Run the complete galaxy interaction file**

Run: `npx playwright test e2e/galaxy-interaction.spec.ts`

Expected: every galaxy interaction test PASS with no page errors, no camera jump symptom, translation-only labels, minimum projected separation, and reliable planet selection.

- [ ] **Step 3: Run both official lesson journeys and accessibility fallback**

Run: `npx playwright test e2e/french-revolution.spec.ts e2e/romeo-and-juliet.spec.ts e2e/accessibility.spec.ts`

Expected: three files PASS; both judge paths finish and the mobile keyboard/WebGL fallback remains complete.

- [ ] **Step 4: Inspect the page in a real browser at three breakpoints**

Open `/learn/french-revolution?focus=olympe-de-gouges` at 1440×900, 1024×900, and 390×844. At desktop, rotate and zoom the galaxy, select Olympe de Gouges, Jean-Jacques Rousseau, Louis XVI, and Robespierre twice each, and record any console/page errors. Confirm the evidence sheet never blocks the filmstrip, labels stay sharp, the stage dominates, tablet content enters natural flow, and mobile has no horizontal document overflow.

- [ ] **Step 5: Run the full repository verification command**

Run: `npm run verify`

Expected: ESLint exits 0, all Vitest suites pass, content validation reports both English lesson packs valid, and Next.js production build exits 0.

- [ ] **Step 6: Update the specification implementation status**

Change the design document status only after the browser and repository checks pass:

```md
**Status:** Implemented and verified
```

- [ ] **Step 7: Commit final regression coverage and status**

```bash
git add e2e/galaxy-interaction.spec.ts docs/superpowers/specs/2026-07-15-editorial-observatory-content-page-design.md
git commit -m "test: verify the editorial observatory experience"
```

## Self-review record

- Spec coverage: desktop composition, responsive flow, materials, typography, motion limits, semantic shells, collision spacing, camera frame, fixed HTML labels, component boundaries, unit/component/browser tests, 2D equivalence, and accessibility each map to a task above.
- Marker scan: no unresolved marker, deferred implementation note, or unspecified error-handling step remains.
- Type consistency: `RelationshipSpacePoint`, `RelationshipCameraFrame`, `fitRelationshipCamera`, `snapLabelCoordinate`, `createGalaxyLabelTransform`, and `ObservatoryShell` use the same signatures in producer and consumer tasks.
- Scope: the layout, camera, label, and active-shell changes form one testable observatory redesign; no lesson data or GPT contract rewrite is included.
