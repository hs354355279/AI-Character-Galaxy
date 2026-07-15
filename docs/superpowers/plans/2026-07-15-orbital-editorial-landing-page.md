# Orbital Editorial Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static home page with a high-end orbital editorial exhibition that introduces the product, explains the learning loop, and presents both evidence-grounded lessons through responsive, accessible motion.

**Architecture:** Keep `app/page.tsx` as the server-side lesson-data boundary and pass a small serializable view model into a client-side `LandingExperience`. Focused home components own their local interaction and GSAP lifecycle; Lenis is installed once by `SmoothScroll`, and every enhanced behavior falls back to the same semantic document when motion is unavailable.

**Tech Stack:** Next.js, React, TypeScript, `next/image`, CSS/Tailwind base, GSAP, `@gsap/react`, ScrollTrigger, Lenis, Motion for React, Vitest, Testing Library, Playwright.

## Global Constraints

- Scope is the landing page only; learning, source, mission, assessment, and summary pages retain their current behavior.
- All user-facing landing-page copy is English by default.
- Preserve direct links to `/learn/<slug>` and `/sources/<slug>` for both validated lessons.
- Preserve the evidence-first, local-first product position; do not add free exploration or open-ended chat claims.
- Use warm paper `#EEECE5`, ink `#11110F`, space `#08101F`, coral `#D65E6F`, and violet `#8066B3`.
- Use the three approved assets under `public/images/landing/`; only the hero is eager-loaded.
- Use transforms and opacity for continuous animation; animated clip paths are limited to major section reveals.
- Disable Lenis, pinning, parallax, marquees, floating loops, and curtain movement for reduced motion.
- Decorative images and SVG layers use empty alternative text or `aria-hidden="true"` and `pointer-events: none`.
- Do not add WebGL, video, remote fonts, stock imagery, per-frame React state, or a custom cursor.
- Preserve unrelated dirty-worktree changes, including the existing `app/globals.css` galaxy fix.

---

## File Map

**Create:**

- `lib/landing/lesson-view-model.ts` — serializable landing lesson model and approved asset mapping.
- `animations/landingMotion.ts` — one-time GSAP registration plus motion/session constants.
- `components/home/LandingExperience.tsx` — client composition boundary.
- `components/home/SmoothScroll.tsx` — Lenis and GSAP ticker lifecycle.
- `components/home/LoadingScreen.tsx` — first-session curtain.
- `components/home/ExhibitionNav.tsx` — sticky nav and full-screen index.
- `components/home/SectionTitle.tsx` — semantic word reveal.
- `components/home/ParallaxImage.tsx` — local image parallax.
- `components/home/OrbitArtwork.tsx` — non-interactive SVG overlay.
- `components/home/HorizontalJourney.tsx` — desktop pin and mobile fallback.
- `components/home/LessonShowcase.tsx` — lesson exhibitions.
- `components/home/EvidenceManifesto.tsx` — closing safeguards and footer.
- `tests/unit/landing-view-model.test.ts`, `tests/components/exhibition-nav.test.tsx`, `e2e/landing-page.spec.ts`.

**Modify:** `package.json`, `package-lock.json`, `app/page.tsx`, `components/home/Hero.tsx`, `tests/components/home.test.tsx`, `tests/setup.ts`, `app/globals.css`, and `e2e/accessibility.spec.ts`.

**Remove after confirming no consumers:** `components/home/LessonCard.tsx`.

---

### Task 1: Landing data and motion capability foundation

**Files:**
- Create: `lib/landing/lesson-view-model.ts`
- Create: `animations/landingMotion.ts`
- Create: `tests/unit/landing-view-model.test.ts`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `LessonPack`.
- Produces: `LandingLesson`, `createLandingLesson(lesson, index)`, `LANDING_INTRO_SESSION_KEY`, `REDUCED_MOTION_QUERY`, `canAnimateLanding()`.

- [ ] **Step 1: Install the runtime dependencies**

```powershell
npm install gsap @gsap/react lenis
```

Expected: npm exits `0` and records all three packages.

- [ ] **Step 2: Write the failing view-model tests**

Create `tests/unit/landing-view-model.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getLessonPack } from "@/lib/lessons/repository";

describe("landing lesson view model", () => {
  it("maps history to the approved coral artwork", () => {
    const lesson = createLandingLesson(getLessonPack("french-revolution")!, 0);
    expect(lesson).toMatchObject({
      number: "01",
      slug: "french-revolution",
      accent: "coral",
      image: { src: "/images/landing/lesson-french-revolution.png", width: 1122, height: 1402 },
    });
    expect(lesson.objectives).toHaveLength(3);
    expect(fs.existsSync(path.join(process.cwd(), "public", lesson.image.src.replace(/^\//, "")))).toBe(true);
  });

  it("maps literature to the approved violet artwork", () => {
    expect(createLandingLesson(getLessonPack("romeo-and-juliet")!, 1)).toMatchObject({
      number: "02",
      accent: "violet",
      image: { src: "/images/landing/lesson-romeo-and-juliet.png", width: 1122, height: 1402 },
    });
  });
});
```

- [ ] **Step 3: Verify the test fails because the module is missing**

```powershell
npx vitest run tests/unit/landing-view-model.test.ts
```

Expected: FAIL resolving `@/lib/landing/lesson-view-model`.

- [ ] **Step 4: Implement the view model**

Create `lib/landing/lesson-view-model.ts`:

```ts
import type { LessonPack } from "@/lib/lessons/schema";

export interface LandingLesson {
  id: string;
  slug: string;
  number: string;
  kind: LessonPack["kind"];
  estimatedMinutes: number;
  title: string;
  subtitle: string;
  objectives: Array<{ id: string; title: string }>;
  accent: "coral" | "violet";
  image: { src: string; width: number; height: number };
}

const artByKind: Record<LessonPack["kind"], Pick<LandingLesson, "accent" | "image">> = {
  history: {
    accent: "coral",
    image: { src: "/images/landing/lesson-french-revolution.png", width: 1122, height: 1402 },
  },
  literature: {
    accent: "violet",
    image: { src: "/images/landing/lesson-romeo-and-juliet.png", width: 1122, height: 1402 },
  },
};

export function createLandingLesson(lesson: LessonPack, index: number): LandingLesson {
  return {
    id: lesson.id,
    slug: lesson.slug,
    number: String(index + 1).padStart(2, "0"),
    kind: lesson.kind,
    estimatedMinutes: lesson.estimatedMinutes,
    title: lesson.title,
    subtitle: lesson.subtitle,
    objectives: lesson.objectives.slice(0, 3).map(({ id, title }) => ({ id, title })),
    ...artByKind[lesson.kind],
  };
}
```

- [ ] **Step 5: Implement shared motion registration**

Create `animations/landingMotion.ts`:

```ts
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const LANDING_INTRO_SESSION_KEY = "acg-landing-intro-seen";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function canAnimateLanding(): boolean {
  return typeof window !== "undefined"
    && typeof window.ResizeObserver !== "undefined"
    && !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export { gsap, ScrollTrigger, useGSAP };
```

- [ ] **Step 6: Verify and commit**

```powershell
npx vitest run tests/unit/landing-view-model.test.ts
git add package.json package-lock.json animations/landingMotion.ts lib/landing/lesson-view-model.ts tests/unit/landing-view-model.test.ts
git commit -m "feat: add landing motion foundation"
```

Expected: focused tests PASS and only the listed files enter the commit.

---

### Task 2: Semantic editorial exhibition

**Files:**
- Create: `components/home/LandingExperience.tsx`, `HorizontalJourney.tsx`, `LessonShowcase.tsx`, `EvidenceManifesto.tsx`, `OrbitArtwork.tsx`
- Modify: `components/home/Hero.tsx`, `app/page.tsx`, `tests/components/home.test.tsx`
- Remove: `components/home/LessonCard.tsx`

**Interfaces:**
- Consumes: `LandingLesson[]`.
- Produces: `#top`, `#method`, `#official-lessons`, and `#evidence` semantic anchors.

- [ ] **Step 1: Write the failing semantic contract**

Replace `tests/components/home.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("presents the exhibition and both official lessons", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /every person has a universe of relationships/i })).toBeVisible();
    for (const name of ["Observe the galaxy", "Follow the evidence", "Explain what changed"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(screen.getAllByRole("link", { name: /start exploration/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /view sources/i })).toHaveLength(2);
    expect(screen.getByText(/French Revolution: People and Factions/i)).toBeVisible();
    expect(screen.getByText(/Romeo and Juliet: Character Relationships/i)).toBeVisible();
  });

  it("preserves safeguards and excludes free exploration", () => {
    render(<HomePage />);
    expect(screen.getByText("Evidence first")).toBeVisible();
    expect(screen.getByText("Works offline")).toBeVisible();
    expect(screen.queryByText(/free exploration/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and observe the missing brand heading**

```powershell
npx vitest run tests/components/home.test.tsx
```

Expected: FAIL on the new heading.

- [ ] **Step 3: Install the server/client boundary**

Replace `app/page.tsx`:

```tsx
import { LandingExperience } from "@/components/home/LandingExperience";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

export default function HomePage() {
  return <LandingExperience lessons={getAllLessonPacks().map(createLandingLesson)} />;
}
```

Create `components/home/LandingExperience.tsx`:

```tsx
"use client";

import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { EvidenceManifesto } from "./EvidenceManifesto";
import { Hero } from "./Hero";
import { HorizontalJourney } from "./HorizontalJourney";
import { LessonShowcase } from "./LessonShowcase";

export function LandingExperience({ lessons }: { lessons: LandingLesson[] }) {
  return <main id="top" className="home-page">
    <Hero />
    <HorizontalJourney />
    <LessonShowcase lessons={lessons} />
    <EvidenceManifesto />
  </main>;
}
```

- [ ] **Step 4: Implement the hero and method markup**

`Hero.tsx` must render the eager `/images/landing/hero-orbital-exhibition.png`, the three line heading with accessible label `Every person has a universe of relationships.`, `Browse lessons`, and `Scroll to enter`.

`HorizontalJourney.tsx` must render these exact panels:

```ts
const steps = [
  { number: "01", title: "Observe the galaxy", copy: "See people as a living map of roles, loyalties, and pressure." },
  { number: "02", title: "Follow the evidence", copy: "Open every official relationship and trace it back to a source." },
  { number: "03", title: "Explain what changed", copy: "Turn discoveries into a concise evidence-grounded explanation." },
];
```

Use a `journey-section > journey-intro + journey-viewport > journey-track > article` structure so Task 4 can pin only the track.

- [ ] **Step 5: Implement the lesson and evidence markup**

`LessonShowcase.tsx` maps `LandingLesson[]` into `<article className="lesson-exhibition">` elements. Each article renders metadata, title, subtitle, all three view-model objectives, `/learn/${lesson.slug}`, `/sources/${lesson.slug}`, a lazy `next/image`, and `OrbitArtwork`.

`OrbitArtwork.tsx` renders this decorative SVG geometry:

```tsx
<svg className={`orbit-overlay orbit-overlay--${accent}`} viewBox="0 0 600 800" aria-hidden="true">
  <ellipse cx="300" cy="390" rx="250" ry="95" />
  <ellipse cx="300" cy="390" rx="170" ry="310" transform="rotate(28 300 390)" />
  <path d="M40 620 C180 470 330 520 565 220" />
  <circle cx="122" cy="570" r="7" />
  <circle cx="470" cy="270" r="10" />
</svg>
```

`EvidenceManifesto.tsx` renders `Evidence first`, `Works offline`, and `Private by design`, followed by the large closing statement and footer credit.

- [ ] **Step 6: Remove the old card, verify, and commit**

```powershell
Remove-Item -LiteralPath components\home\LessonCard.tsx
npx vitest run tests/components/home.test.tsx tests/unit/landing-view-model.test.ts
git add app/page.tsx components/home tests/components/home.test.tsx
git commit -m "feat: build landing exhibition structure"
```

Expected: focused tests PASS and existing lesson/source routes remain unchanged.

---

### Task 3: Accessible navigation and opening curtain

**Files:**
- Create: `components/home/ExhibitionNav.tsx`, `components/home/LoadingScreen.tsx`, `tests/components/exhibition-nav.test.tsx`
- Modify: `components/home/LandingExperience.tsx`, `tests/setup.ts`

**Interfaces:**
- Consumes: `LANDING_INTRO_SESSION_KEY` and `canAnimateLanding()`.
- Produces: an Index dialog with focus return and a `pending | playing | done` curtain.

- [ ] **Step 1: Make browser capabilities deterministic in tests**

Append to `tests/setup.ts` while preserving the existing `matchMedia` and cleanup:

```ts
class TestResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;
```

Also change the existing `matchMedia` fixture's `matches` value to `query === "(prefers-reduced-motion: reduce)"`. Component tests therefore exercise the static accessible state, while Playwright exercises enhanced motion in a real browser.

- [ ] **Step 2: Write failing navigation tests**

Create `tests/components/exhibition-nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExhibitionNav } from "@/components/home/ExhibitionNav";

describe("exhibition navigation", () => {
  it("opens, locks scroll, closes with Escape, and returns focus", async () => {
    const user = userEvent.setup();
    render(<ExhibitionNav />);
    const trigger = screen.getByRole("button", { name: "Open exhibition index" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Exhibition index" })).toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Exhibition index" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when a chapter link is selected", async () => {
    const user = userEvent.setup();
    render(<ExhibitionNav />);
    await user.click(screen.getByRole("button", { name: "Open exhibition index" }));
    await user.click(screen.getByRole("link", { name: /02.*Lessons/i }));
    expect(screen.queryByRole("dialog", { name: "Exhibition index" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run and observe the missing component**

```powershell
npx vitest run tests/components/exhibition-nav.test.tsx
```

Expected: FAIL resolving `ExhibitionNav`.

- [ ] **Step 4: Implement `ExhibitionNav`**

Use `motion` from `motion/react`. The fixed nav renders the brand, `Lessons`, and an `Index` button with `aria-label="Open exhibition index"`. When open, render a `role="dialog"`, `aria-modal="true"`, `aria-label="Exhibition index"` overlay containing:

```ts
const chapters = [
  ["00", "Introduction", "#top"],
  ["01", "Method", "#method"],
  ["02", "Lessons", "#official-lessons"],
  ["03", "Evidence", "#evidence"],
];
```

Animate the overlay from `clipPath: "inset(0 0 100% 0)"` to `"inset(0 0 0% 0)"` in `0.55s`. In an effect, save and set `document.body.style.overflow = "hidden"`, focus the first overlay control, trap Tab between overlay controls, close on Escape, restore overflow, and return focus to the trigger. Every chapter link calls `setOpen(false)`.

- [ ] **Step 5: Implement `LoadingScreen`**

Use this state transition:

```ts
type CurtainState = "pending" | "playing" | "done";

useEffect(() => {
  if (!canAnimateLanding() || sessionStorage.getItem(LANDING_INTRO_SESSION_KEY)) {
    setState("done");
    return;
  }
  sessionStorage.setItem(LANDING_INTRO_SESSION_KEY, "1");
  setState("playing");
}, []);
```

For `playing`, run a scoped GSAP timeline that reveals the individual characters in `AI Character Galaxy`, scales an orbit rule from zero, then translates the curtain to `yPercent: -102` over `0.58s` with `power3.inOut`. Set `done` in `onComplete`; render nothing in `done`.

- [ ] **Step 6: Compose, verify, and commit**

Place `<LoadingScreen />` and `<ExhibitionNav />` before `<Hero />` in `LandingExperience`.

```powershell
npx vitest run tests/components/exhibition-nav.test.tsx tests/components/home.test.tsx
git add components/home/LandingExperience.tsx components/home/ExhibitionNav.tsx components/home/LoadingScreen.tsx tests/components/exhibition-nav.test.tsx tests/setup.ts
git commit -m "feat: add landing index and opening curtain"
```

Expected: tests PASS, Escape restores focus, and no animation handle keeps Vitest open.

---

### Task 4: GSAP, ScrollTrigger, Lenis, and image motion

**Files:**
- Create: `components/home/SmoothScroll.tsx`, `SectionTitle.tsx`, `ParallaxImage.tsx`
- Modify: `LandingExperience.tsx`, `Hero.tsx`, `ExhibitionNav.tsx`, `HorizontalJourney.tsx`, `LessonShowcase.tsx`

**Interfaces:**
- Consumes: Task 1 motion exports and Task 2 semantic markup.
- Produces: one Lenis instance, locally scoped timelines, and one desktop-only pinned track.

- [ ] **Step 1: Implement the single Lenis owner**

Create `components/home/SmoothScroll.tsx`:

```tsx
"use client";

import Lenis from "lenis";
import { canAnimateLanding, gsap, ScrollTrigger, useGSAP } from "@/animations/landingMotion";

export function SmoothScroll() {
  useGSAP(() => {
    if (!canAnimateLanding()) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.82 });
    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);
  return null;
}
```

- [ ] **Step 2: Implement reusable heading and image reveals**

`SectionTitle.tsx` accepts `{ id, label, title }`, keeps a normal `<h2 aria-label={title}>`, renders visual word spans with `aria-hidden="true"`, and scopes:

```ts
gsap.from(".section-title-word", {
  opacity: 0,
  y: 46,
  duration: 0.75,
  stagger: 0.045,
  ease: "power3.out",
  scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
});
```

Replace the raw intro headings in `HorizontalJourney`, `LessonShowcase`, and `EvidenceManifesto` with `SectionTitle` so all three major chapter headings share this implementation.

`ParallaxImage.tsx` accepts normal `ImageProps`, renders `next/image`, and applies this scoped animation only when `canAnimateLanding()`:

```ts
gsap.fromTo(image.current, { scale: 1.1, y: 54 }, {
  scale: 1,
  y: -20,
  ease: "none",
  scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
});
```

- [ ] **Step 3: Add the hero and nav timelines**

Convert both components to client components with scoped refs. The hero uses:

```ts
gsap.timeline({ defaults: { ease: "power3.out" } })
  .from(".landing-eyebrow", { opacity: 0, y: 18, duration: 0.45 })
  .from(".hero-title-line", { opacity: 0, y: 42, duration: 0.8, stagger: 0.09 }, "-=0.2")
  .from(".hero-support, .scroll-cue", { opacity: 0, y: 20, duration: 0.5, stagger: 0.08 }, "-=0.35")
  .fromTo(".hero-art", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.8 }, 0);
```

The nav creates a ScrollTrigger at `editorial-hero` bottom `96px` and toggles `is-material`. Cleanup must come from scoped `useGSAP` rather than manual global queries.

- [ ] **Step 4: Add the desktop horizontal method timeline**

Use `gsap.matchMedia()` with `(min-width: 1024px) and (prefers-reduced-motion: no-preference)`. Pin the section and translate only the track:

```ts
const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);
gsap.to(track.current, {
  x: () => -distance(),
  ease: "none",
  scrollTrigger: {
    trigger: root.current,
    start: "top top",
    end: () => `+=${distance() + window.innerHeight}`,
    pin: true,
    scrub: 0.8,
    invalidateOnRefresh: true,
  },
});
```

Return `media.revert()` from the `useGSAP` callback.

- [ ] **Step 5: Add lesson reveals**

Wrap each generated image in `ParallaxImage`. For each article, use one `once: true` ScrollTrigger. Reveal the article from `clipPath: "inset(100% 0 0 0)"` and stagger `.lesson-meta`, heading, description, objectives, and actions from `opacity: 0, y: 28`. SVG overlays remain outside the interactive content and retain `pointer-events: none`.

Inside each scoped lesson timeline, animate only the two SVG circles with `y: (index) => index === 0 ? -8 : 8`, `duration: 6`, `repeat: -1`, `yoyo: true`, and `stagger: 0.4`. `useGSAP` kills these slow floating loops on unmount, and `canAnimateLanding()` prevents them in reduced-motion mode.

- [ ] **Step 6: Verify and commit**

```powershell
npx vitest run tests/components/home.test.tsx tests/components/exhibition-nav.test.tsx tests/unit/landing-view-model.test.ts
npx tsc --noEmit
git add animations components/home tests/setup.ts
git commit -m "feat: add responsive landing motion"
```

Expected: tests and TypeScript PASS; reduced-motion rendering stays fully visible.

---

### Task 5: Editorial CSS and responsive visual system

**Files:**
- Modify: `app/globals.css`
- Create: `e2e/landing-page.spec.ts`

**Interfaces:**
- Consumes: all class names from Tasks 2–4.
- Produces: paper/space layout, responsive sections, preference overrides, and interaction states.

- [ ] **Step 1: Write failing browser layout tests**

Create `e2e/landing-page.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("acg-landing-intro-seen", "1"));
});

test("desktop exhibition has loaded artwork and no horizontal overflow", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /every person has a universe of relationships/i })).toBeVisible();
  await expect(page.locator(".hero-art img")).toHaveJSProperty("complete", true);
  await page.getByRole("link", { name: "Browse lessons" }).click();
  await expect(page.getByRole("heading", { name: /choose your first constellation/i })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("mobile reduced-motion mode remains a natural vertical document", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".loading-screen")).toHaveCount(0);
  await expect(page.locator(".journey-track")).toHaveCSS("transform", "none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
```

- [ ] **Step 2: Run the browser test before the new CSS**

```powershell
npx playwright test e2e/landing-page.spec.ts
```

Expected: FAIL on viewport positioning or overflow.

- [ ] **Step 3: Replace only the legacy home CSS block**

Preserve root/shared/learning/galaxy rules and the user's existing galaxy edits. Replace `.home-page` through `.home-footer` with these exact foundations, then retain the same class names for the detailed declarations listed below:

```css
.home-page {
  --paper: #eeece5;
  --paper-raised: #e2ded3;
  --paper-ink: #11110f;
  --paper-muted: #68675f;
  --space: #08101f;
  --space-ink: #f3f1ea;
  width: 100%;
  overflow: clip;
  color: var(--paper-ink);
  background: var(--paper);
}

.exhibition-nav { position: fixed; z-index: 80; top: 1rem; left: 2vw; width: 96vw; display: flex; align-items: center; justify-content: space-between; padding: .8rem 1rem; color: var(--paper-ink); border: 1px solid transparent; transition: background-color 300ms ease, border-color 300ms ease; }
.exhibition-nav.is-material { border-color: rgba(17,17,15,.12); background: rgba(238,236,229,.82); backdrop-filter: blur(18px) saturate(120%); }
.exhibition-nav-actions { display: flex; gap: 1.5rem; align-items: center; }
.exhibition-nav-actions button, .index-close { border: 0; color: inherit; background: transparent; cursor: pointer; }

.editorial-hero { position: relative; min-height: 100svh; display: grid; align-items: end; padding: clamp(7rem,12vw,10rem) 4vw 4vw; isolation: isolate; }
.hero-art { position: absolute; z-index: -1; inset: 0; overflow: hidden; transform-origin: center right; }
.hero-art img { object-fit: cover; object-position: center; }
.hero-editorial-copy { width: min(94rem,100%); }
.landing-eyebrow { margin: 0; font-size: .72rem; font-weight: 740; letter-spacing: .16em; text-transform: uppercase; }
.editorial-display { margin: 1rem 0 0; font-size: clamp(4rem,10vw,9.5rem); line-height: .86; letter-spacing: -.075em; }
.hero-title-line { display: block; width: fit-content; }
.hero-support { width: min(40rem,100%); display: flex; justify-content: space-between; gap: 2rem; align-items: end; margin-top: 3rem; }
.hero-support p { max-width: 24rem; margin: 0; font-size: clamp(1.05rem,1.7vw,1.35rem); }
.editorial-link, .lesson-primary-link { display: inline-flex; gap: 1rem; align-items: center; padding-bottom: .35rem; border-bottom: 1px solid currentColor; font-weight: 720; }
.editorial-link span, .lesson-primary-link span { transition: transform 400ms cubic-bezier(.22,1,.36,1); }
.editorial-link:hover span, .lesson-primary-link:hover span { transform: translate(.45rem,.25rem); }
.scroll-cue { position: absolute; right: 4vw; bottom: 4vw; display: grid; gap: .5rem; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; }
.scroll-cue i { width: 7rem; height: 1px; background: currentColor; transform-origin: left; }

.journey-section { min-height: 100svh; color: var(--space-ink); background: var(--space); }
.journey-intro { padding: 8rem 4vw 3rem; }
.journey-intro h2, .lesson-exhibitions-intro h2, .evidence-manifesto > h2 { max-width: 14ch; margin: 1rem 0 0; font-size: clamp(3rem,7vw,7rem); line-height: .94; letter-spacing: -.06em; }
.journey-viewport { overflow: hidden; }
.journey-track { display: flex; width: max-content; will-change: transform; }
.journey-panel { position: relative; width: 100vw; min-height: 62svh; display: grid; grid-template-columns: .25fr 1fr .7fr; gap: 4vw; align-items: center; padding: 4vw; border-top: 1px solid rgba(243,241,234,.18); }
.journey-panel h3 { margin: 0; font-size: clamp(3.5rem,8vw,8rem); line-height: .88; letter-spacing: -.065em; }
.journey-panel p { max-width: 24rem; color: rgba(243,241,234,.68); font-size: 1.1rem; }

.lesson-exhibitions { padding: 9rem 4vw; background: var(--paper); }
.lesson-exhibitions-intro { min-height: 65svh; display: grid; align-content: center; }
.lesson-exhibitions-intro > p:last-child { max-width: 32rem; color: var(--paper-muted); }
.lesson-exhibition { --lesson-accent: #d65e6f; position: relative; min-height: 100svh; display: grid; grid-template-columns: minmax(0,.8fr) minmax(28rem,1.2fr); gap: 6vw; align-items: center; margin-top: 5rem; padding: clamp(2rem,5vw,5rem); overflow: hidden; color: var(--space-ink); background: var(--space); clip-path: inset(0); }
.lesson-exhibition--violet { --lesson-accent: #8066b3; }
.lesson-meta { display: flex; gap: 1.25rem; color: var(--lesson-accent); font-size: .72rem; font-weight: 740; letter-spacing: .12em; text-transform: uppercase; }
.lesson-exhibition h3 { max-width: 12ch; margin: 2rem 0 1rem; font-size: clamp(3rem,5.5vw,6.8rem); line-height: .92; letter-spacing: -.06em; }
.lesson-exhibition-copy > p, .lesson-exhibition li { color: rgba(243,241,234,.68); }
.lesson-exhibition ul { display: grid; gap: .7rem; margin: 2rem 0; padding: 0; list-style: none; }
.lesson-exhibition li::before { content: "—"; margin-right: .7rem; color: var(--lesson-accent); }
.lesson-actions { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
.lesson-source-link { color: rgba(243,241,234,.78); text-decoration: underline; text-underline-offset: .3rem; }
.lesson-exhibition-art { position: relative; min-width: 0; aspect-ratio: 4/5; overflow: hidden; }
.parallax-image, .parallax-image img { width: 100%; height: 100%; }
.parallax-image { position: relative; overflow: hidden; }
.parallax-image img { object-fit: cover; }
.orbit-overlay { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--lesson-accent); stroke: rgba(243,241,234,.35); stroke-width: 1; pointer-events: none; mix-blend-mode: screen; }

.evidence-manifesto { padding: 12rem 4vw; background: var(--paper-raised); }
.safeguard-list { margin-top: 6rem; border-top: 1px solid rgba(17,17,15,.28); }
.safeguard-row { display: grid; grid-template-columns: .2fr .75fr 1fr; gap: 2rem; align-items: baseline; padding: 2rem 0; border-bottom: 1px solid rgba(17,17,15,.28); }
.safeguard-row h3, .safeguard-row p { margin: 0; }
.safeguard-row p { color: var(--paper-muted); }
.editorial-footer { min-height: 70svh; display: grid; grid-template-columns: 1fr auto; align-content: space-between; padding: 5rem 4vw 2rem; color: var(--space-ink); background: var(--space); }
.editorial-footer p { grid-column: 1/-1; max-width: 12ch; margin: 6rem 0; font-size: clamp(3.5rem,8vw,8rem); line-height: .9; letter-spacing: -.065em; }

.loading-screen, .exhibition-index { position: fixed; z-index: 100; inset: 0; color: var(--space-ink); background: #05070b; }
.loading-screen { display: grid; place-items: center; }
.loading-wordmark { display: flex; font-weight: 720; letter-spacing: .08em; }
.loading-orbit { position: absolute; width: min(22rem,65vw); height: 5rem; border: 1px solid rgba(243,241,234,.42); border-radius: 50%; transform: rotate(-12deg) scaleY(.35); }
.exhibition-index { padding: 2rem 4vw; }
.index-close { display: block; margin-left: auto; }
.index-links { display: grid; margin-top: 10vh; }
.index-links a { display: grid; grid-template-columns: 5rem 1fr auto; align-items: center; padding: 1rem 0; border-bottom: 1px solid rgba(243,241,234,.24); }
.index-links strong { font-size: clamp(2.4rem,7vw,7rem); letter-spacing: -.055em; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
```

- [ ] **Step 4: Add exact responsive and preference overrides**

```css
@media (max-width: 1023px) {
  .journey-track { width: auto; display: grid; transform: none !important; }
  .journey-panel { width: auto; min-height: 65svh; grid-template-columns: 1fr; align-content: center; }
  .lesson-exhibition { grid-template-columns: 1fr 1.1fr; }
}

@media (max-width: 767px) {
  .exhibition-nav { top: .5rem; left: 1rem; width: calc(100% - 2rem); }
  .exhibition-nav-actions > a { display: none; }
  .editorial-hero { min-height: 92svh; padding: 7rem 1.2rem 2rem; }
  .hero-art { opacity: .48; left: 20%; }
  .hero-art img { object-position: 62% center; }
  .editorial-display { font-size: clamp(3.55rem,18vw,6rem); }
  .hero-support { display: grid; gap: 1.5rem; }
  .scroll-cue { display: none; }
  .journey-intro, .lesson-exhibitions, .evidence-manifesto { padding-left: 1.2rem; padding-right: 1.2rem; }
  .journey-panel { padding: 4rem 1.2rem; }
  .lesson-exhibition { min-height: auto; grid-template-columns: 1fr; gap: 3rem; margin-top: 2rem; padding: 4rem 1.2rem 1.2rem; }
  .lesson-exhibition-art { order: -1; }
  .safeguard-row { grid-template-columns: 3rem 1fr; }
  .safeguard-row p { grid-column: 2; }
  .editorial-footer { grid-template-columns: 1fr; padding: 4rem 1.2rem 2rem; }
  .editorial-footer p { font-size: clamp(3rem,15vw,5rem); }
  .index-links a { grid-template-columns: 2.5rem 1fr auto; }
}

@media (prefers-reduced-motion: reduce) {
  .journey-track, .hero-art, .parallax-image img, .lesson-exhibition { transform: none !important; clip-path: none !important; }
  .loading-screen { display: none; }
}

@media (prefers-reduced-transparency: reduce) {
  .exhibition-nav.is-material { background: #eeece5; backdrop-filter: none; }
}

@media (prefers-contrast: more) {
  .home-page { --paper-muted: #3d3c37; }
  .exhibition-nav.is-material { border-color: #11110f; }
}
```

- [ ] **Step 5: Verify CSS and commit**

```powershell
npx playwright test e2e/landing-page.spec.ts
npx vitest run tests/components/home.test.tsx tests/components/exhibition-nav.test.tsx
git add app/globals.css e2e/landing-page.spec.ts
git commit -m "feat: style orbital editorial landing page"
```

Expected: desktop and reduced-motion mobile tests PASS without horizontal overflow.

---

### Task 6: Full regression and real-browser verification

**Files:**
- Modify: `e2e/accessibility.spec.ts`
- Modify only when a failing check identifies a defect: files from Tasks 1–5.

**Interfaces:**
- Consumes: complete landing experience.
- Produces: verified build and desktop/mobile screenshot evidence.

- [ ] **Step 1: Keep the first lesson keyboard-reachable**

In `e2e/accessibility.spec.ts`, change only the fixed Tab loop bound from `12` to `24`; keep the focus assertion and complete 2D lesson path unchanged.

- [ ] **Step 2: Run the complete automated gate**

```powershell
npm run lint
npm test
npm run content:validate
npm run build
npx playwright test
```

Expected: every command exits `0`; the build emits home, lesson, and source routes without hydration warnings; Playwright reports all tests passed.

- [ ] **Step 3: Perform real-browser checks**

At `http://127.0.0.1:3000` in Chromium:

1. Clear session storage and confirm the curtain exits in under one second.
2. Reload and confirm the curtain is skipped.
3. Open/close Index by click, Escape, and chapter link.
4. Scroll slowly and rapidly through the pinned method section; no jump or stuck pin is allowed.
5. Activate both lesson and source links from different scroll positions.
6. Resize from 1440 px to 390 px; the method must become vertical.
7. Enable reduced motion; native scroll and static imagery must remain.
8. Check 1440×1000, 1024×768, 768×1024, and 390×844 for horizontal overflow.
9. Confirm the console has no runtime, hydration, GSAP, ScrollTrigger, or image errors.

- [ ] **Step 4: Capture visual evidence**

Save screenshots as:

```text
output/playwright/landing-desktop.png
output/playwright/landing-mobile.png
```

- [ ] **Step 5: Inspect scope and commit the accessibility adjustment**

```powershell
git diff --check
git status --short
git add e2e/accessibility.spec.ts
git commit -m "test: cover landing accessibility modes"
```

Expected: no whitespace errors; pre-existing galaxy interaction edits remain uncommitted and unaltered.
