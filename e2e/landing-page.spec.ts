import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("acg-landing-intro-seen", "1"));
});

test("desktop exhibition loads artwork and moves the learning method horizontally", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /every person has a universe of relationships/i }),
  ).toBeVisible();
  await expect(page.locator(".hero-art img")).toHaveJSProperty("complete", true);

  await page.locator(".journey-section").scrollIntoViewIfNeeded();
  const initialTransform = await page.locator(".journey-track").evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  const movedTransform = await page.locator(".journey-track").evaluate(
    (element) => getComputedStyle(element).transform,
  );

  expect(movedTransform).not.toBe(initialTransform);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("mobile reduced-motion mode remains a natural vertical document", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".loading-screen")).toHaveCount(0);
  await expect(page.locator(".journey-track")).toHaveCSS("transform", "none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
});
