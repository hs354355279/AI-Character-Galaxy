import { expect, test } from "@playwright/test";
import { maryExpansionBatch } from "../tests/fixtures/network-expansion";

const recursiveExpansionBatch = {
  ...maryExpansionBatch,
  characters: [
    maryExpansionBatch.characters[0],
    {
      ...maryExpansionBatch.characters[0],
      id: "ai-nicolas-de-condorcet",
      name: "Nicolas de Condorcet",
      role: "Philosopher and political reformer",
      summary: "Nicolas de Condorcet argued for political reform, education, and equal civic rights during the Revolution.",
      sourceRefIds: ["source-condorcet"],
      citationIds: ["source-condorcet"],
    },
    {
      ...maryExpansionBatch.characters[0],
      id: "ai-thomas-paine",
      name: "Thomas Paine",
      role: "Political writer and revolutionary",
      summary: "Thomas Paine defended republican government and participated in political debate during the French Revolution.",
      sourceRefIds: ["source-paine"],
      citationIds: ["source-paine"],
    },
  ],
  relationships: [
    maryExpansionBatch.relationships[0],
    {
      ...maryExpansionBatch.relationships[0],
      id: "ai-olympe-de-gouges-ai-nicolas-de-condorcet-influence",
      toCharacterId: "ai-nicolas-de-condorcet",
      sourceRefIds: ["source-condorcet"],
      citationIds: ["source-condorcet"],
      summary: "Their reform arguments intersected in debates about political equality and citizenship.",
    },
    {
      ...maryExpansionBatch.relationships[0],
      id: "ai-olympe-de-gouges-ai-thomas-paine-alliance",
      toCharacterId: "ai-thomas-paine",
      type: "alliance" as const,
      sourceRefIds: ["source-paine"],
      citationIds: ["source-paine"],
      summary: "Their revolutionary politics connected them within debates about republican government and rights.",
    },
  ],
  citations: [
    maryExpansionBatch.citations[0],
    { id: "source-condorcet", title: "Nicolas de Condorcet biography", url: "https://example.org/condorcet" },
    { id: "source-paine", title: "Thomas Paine biography", url: "https://example.org/paine" },
  ],
};

async function startFrenchRevolution(page: import("@playwright/test").Page) {
  await page.goto("/learn/french-revolution");
  await page.getByRole("button", { name: "Enter the observatory" }).click();
}

test("a planet remains selectable when a relationship line crosses in front of it", async ({ page }) => {
  await startFrenchRevolution(page);

  const label = page.locator('[data-character-label="Olympe de Gouges"]');
  await expect(label).toHaveAttribute("data-projection-ready", "true");
  const canvasBox = await page.locator(".galaxy-canvas").boundingBox();
  const planet = await label.evaluate((element) => ({
    x: Number((element as HTMLElement).dataset.planetX),
    y: Number((element as HTMLElement).dataset.planetY),
  }));

  expect(canvasBox).not.toBeNull();
  expect(Number.isFinite(planet.x + planet.y)).toBe(true);
  if (!canvasBox) return;

  await page.mouse.click(canvasBox.x + planet.x, canvasBox.y + planet.y);

  await expect(page.getByRole("heading", { name: "Olympe de Gouges", exact: true })).toBeVisible();
  await expect(page.getByText("Relationship evidence", { exact: true })).toHaveCount(0);
});

test("the character rail repeatedly re-centers relationship space without runtime errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration failed/i.test(message.text())) {
      pageErrors.push(message.text());
    }
  });

  await startFrenchRevolution(page);

  const names = [
    "Maximilien Robespierre",
    "Louis XVI",
    "Marie Antoinette",
    "Gilbert du Motier, Marquis de Lafayette",
  ];

  for (let round = 0; round < 3; round += 1) {
    for (const name of names) {
      await page.getByRole("button", { name: `Select ${name}` }).click();
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await expect(page.getByText("Relationship evidence", { exact: true })).toHaveCount(0);
    }
  }

  expect(pageErrors).toEqual([]);
});

test("desktop observatory owns one viewport without document scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/romeo-and-juliet?focus=romeo");
  await expect(page.locator('[data-character-label="Romeo Montague"]')).toHaveAttribute(
    "data-projection-ready",
    "true",
  );

  const before = await page.evaluate(() => ({
    y: scrollY,
    client: document.documentElement.clientHeight,
    scroll: document.documentElement.scrollHeight,
  }));
  expect(before.scroll).toBeLessThanOrEqual(before.client + 1);

  const galaxyViewport = await page.locator(".galaxy-viewport").evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }));
  expect(galaxyViewport.scroll).toBeLessThanOrEqual(galaxyViewport.client + 1);

  await page.locator(".galaxy-canvas").hover();
  await page.mouse.wheel(0, 600);
  expect(await page.evaluate(() => scrollY)).toBe(before.y);
});

test("a selected character becomes the origin of a genuinely three-dimensional space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/romeo-and-juliet?focus=romeo");

  const romeo = page.locator('[data-character-label="Romeo Montague"]');
  await expect(romeo).toHaveAttribute("data-space-origin", "true");
  await expect.poll(async () => Math.abs(Number(await romeo.getAttribute("data-world-x")))).toBeLessThan(0.1);
  await expect.poll(async () => Math.abs(Number(await romeo.getAttribute("data-world-y")))).toBeLessThan(0.1);
  await expect.poll(async () => Math.abs(Number(await romeo.getAttribute("data-world-z")))).toBeLessThan(0.1);

  await expect.poll(async () => page.locator("[data-world-z]").evaluateAll((nodes) => {
    const depths = nodes.map((node) => Number((node as HTMLElement).dataset.worldZ));
    return Math.max(...depths) - Math.min(...depths);
  })).toBeGreaterThan(2);

  const juliet = page.locator('[data-character-label="Juliet Capulet"]');
  await page.getByRole("button", { name: "Select Juliet Capulet" }).click();
  await expect(juliet).toHaveAttribute("data-space-origin", "true");
  await expect(romeo).not.toHaveAttribute("data-space-origin", "true");
  await expect.poll(async () => Math.abs(Number(await juliet.getAttribute("data-world-z")))).toBeLessThan(0.1);
});

test("the editorial observatory uses paper guidance around a dominant ink stage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/french-revolution?focus=robespierre");

  await expect(page.locator(".exhibition-header--paper")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Current mission" })).toHaveCSS(
    "position",
    "relative",
  );
  await expect(page.getByRole("complementary", { name: "Evidence sheet" })).toHaveCSS(
    "position",
    "absolute",
  );

  const proportions = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".observatory-shell")!;
    const stage = document.querySelector<HTMLElement>(".observatory-stage")!;
    return { shell: shell.clientWidth, stage: stage.clientWidth };
  });
  expect(proportions.stage / proportions.shell).toBeGreaterThan(0.7);
});

test("desktop labels remain crisp, readable, and separated while zooming", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 2048, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/learn/french-revolution?focus=robespierre");
    const labels = page.locator("[data-character-label]");
    await expect(labels.first()).toHaveAttribute("data-projection-ready", "true");

    const state = await labels.evaluateAll((nodes) => nodes.map((node) => {
      const element = node as HTMLElement;
      return {
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
    expect(await labels.evaluateAll((nodes) => nodes.every(
      (node) => !/scale/i.test((node as HTMLElement).style.transform),
    ))).toBe(true);
    expect(await page.evaluate(
      () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
    )).toBeLessThanOrEqual(1);
  }
});

test("tablet observatory keeps every surface inside the document width", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/learn/french-revolution?focus=olympe-de-gouges");
  await expect(page.locator(".galaxy-viewport")).toBeVisible();

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    galaxyWidth: document.querySelector<HTMLElement>(".galaxy-viewport")!.clientWidth,
    documentWidth: document.documentElement.clientWidth,
  }));

  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.galaxyWidth).toBeLessThanOrEqual(layout.documentWidth);
});

test("mobile opens the complete 2D relationship view without document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn/french-revolution?focus=olympe-de-gouges");
  await page.waitForTimeout(300);

  await expect(page.getByLabel("2D relationship list")).toBeVisible();
  await expect(page.getByRole("button", { name: "2D list", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".galaxy-canvas")).toHaveCount(0);
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(1);
});

test("a sourced GPT-5.6 expansion grows 3D and 2D around the selected origin and survives refresh", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
  await page.route("**/api/learning/expand-network", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ source: "gpt-5.6", data: recursiveExpansionBatch }),
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/french-revolution?focus=olympe-de-gouges");

  const origin = page.locator('[data-character-label="Olympe de Gouges"]');
  await expect(origin).toHaveAttribute("data-projection-ready", "true");
  await page.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" }).click();

  await expect(page.getByRole("status")).toContainText("Added 3 people");
  await expect(page.locator(".character-rail-heading")).toContainText("12 subjects");
  await expect(page.locator(".galaxy-canvas")).toHaveAttribute("data-character-count", "12");
  await expect(page.locator(".galaxy-canvas")).toHaveAttribute("data-relationship-count", "15");
  for (const name of ["Mary Wollstonecraft", "Nicolas de Condorcet", "Thomas Paine"]) {
    await expect(page.locator(`[data-character-label="${name}"]`)).toHaveAttribute(
      "data-projection-ready",
      "true",
    );
  }
  await expect(origin).toHaveAttribute("data-space-origin", "true");
  await expect.poll(async () => Math.abs(Number(await origin.getAttribute("data-world-x")))).toBeLessThan(0.1);
  await expect.poll(async () => Math.abs(Number(await origin.getAttribute("data-world-y")))).toBeLessThan(0.1);
  await expect.poll(async () => Math.abs(Number(await origin.getAttribute("data-world-z")))).toBeLessThan(0.1);
  await page.screenshot({
    path: "output/playwright/network-expansion-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Select Mary Wollstonecraft" }).click();
  await expect(page.getByRole("heading", { name: "Mary Wollstonecraft", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Mary Wollstonecraft biography/ })).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-character-label="Mary Wollstonecraft"]')).toHaveAttribute(
    "data-projection-ready",
    "true",
  );
  await page.getByRole("button", { name: "2D list", exact: true }).click();
  await expect(page.getByText("12 people · 15 links")).toBeVisible();
  await expect(page.getByRole("button", { name: /Inspect Mary Wollstonecraft/ })).toContainText("AI expanded");
  await expect(page.getByRole("button", { name: /Olympe de Gouges.*Mary Wollstonecraft/ })).toBeVisible();
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
});
