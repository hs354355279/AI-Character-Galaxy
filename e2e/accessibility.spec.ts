import { expect, test } from "@playwright/test";
import { maryExpansionState } from "../tests/fixtures/network-expansion";

test("keyboard and reduced-motion path preserves the complete 2D lesson", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === "webgl" || contextId === "webgl2") return null;
      return original.call(this, contextId, ...(args as []));
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const firstLesson = page
    .getByRole("article")
    .filter({ hasText: "French Revolution" })
    .getByRole("link", { name: /Start exploration/ });
  for (let press = 0; press < 24; press += 1) {
    await page.keyboard.press("Tab");
    if (await firstLesson.evaluate((element) => element === document.activeElement)) break;
  }
  await expect(firstLesson).toBeFocused();
  await page.keyboard.press("Enter");

  await page.getByRole("button", { name: "Enter the observatory" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("3D is unavailable");
  await expect(page.getByLabel("2D relationship list")).toBeVisible();
  await expect(page.getByText("political rivalry", { exact: true }).first()).toBeVisible();

  const robespierre = page.getByRole("button", { name: "Select Maximilien Robespierre" });
  await robespierre.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Check mission" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Mission complete")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
});

test("mobile restores AI-expanded people with textual provenance and complete keyboard access", async ({ page }) => {
  await page.addInitScript((state) => {
    window.sessionStorage.setItem(
      "ai-character-galaxy:network-expansion:french-revolution",
      JSON.stringify(state),
    );
  }, maryExpansionState);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn/french-revolution?focus=olympe-de-gouges");

  await expect(page.getByLabel("2D relationship list")).toBeVisible();
  const mary = page.getByRole("button", { name: "Select Mary Wollstonecraft" });
  await expect(mary).toContainText("AI expanded");
  await mary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Mary Wollstonecraft", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Mary Wollstonecraft biography/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Inspect Mary Wollstonecraft/ })).toContainText("AI expanded");
  await page.screenshot({
    path: "output/playwright/network-expansion-mobile.png",
    fullPage: true,
  });
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(1);
});
