import { expect, test } from "@playwright/test";

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
