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

test("the character rail drives repeated camera focus without runtime errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

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

  await page.locator(".galaxy-canvas").hover();
  await page.mouse.wheel(0, 600);
  expect(await page.evaluate(() => scrollY)).toBe(before.y);
});
