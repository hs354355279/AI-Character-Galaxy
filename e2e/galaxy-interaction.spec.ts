import { expect, test } from "@playwright/test";

async function startFrenchRevolution(page: import("@playwright/test").Page) {
  await page.goto("/learn/french-revolution");
  await page.getByRole("button", { name: /Start missions/ }).click();
}

test("a planet remains selectable when a relationship line crosses in front of it", async ({ page }) => {
  await startFrenchRevolution(page);

  const label = page.getByRole("button", { name: "Select Olympe de Gouges" });
  const labelBox = await label.boundingBox();
  const canvasBox = await page.locator(".galaxy-canvas").boundingBox();
  const transform = await label.evaluate((element) => element.style.transform);
  const scale = Number(transform.match(/scale\(([^)]+)\)/)?.[1] ?? 1);

  expect(labelBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (!labelBox || !canvasBox) return;

  const planetX = labelBox.x + labelBox.width / 2;
  const planetY = labelBox.y + labelBox.height / 2 + (0.92 * canvasBox.height * scale / 13);
  await page.mouse.click(planetX, planetY);

  await expect(page.getByRole("heading", { name: "Olympe de Gouges", exact: true })).toBeVisible();
  await expect(page.getByText("Relationship evidence", { exact: true })).toHaveCount(0);
});

test("planet labels select only their character during repeated camera focus", async ({ page }) => {
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
