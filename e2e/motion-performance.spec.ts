import { expect, test } from "@playwright/test";

test("desktop motion has one damped scroll owner", async ({ page }) => {
  await page.goto("/courses");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.lenisActive))
    .toBe("true");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("reduced motion keeps a native vertical document without overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/courses");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.lenisActive ?? "absent"))
    .toBe("absent");
  const layout = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    entryTransforms: [...document.querySelectorAll<HTMLElement>(".course-index-entry")]
      .map((entry) => getComputedStyle(entry).transform),
  }));
  expect(layout.scrollBehavior).toBe("auto");
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.entryTransforms.every((transform) => transform === "none")).toBe(true);
});
