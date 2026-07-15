import { expect, test } from "@playwright/test";

test("global navigation enters a course through the exhibition register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Courses", exact: true }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await page.getByRole("link", { name: /Enter French Revolution/ }).click();
  await expect(page).toHaveURL(/\/learn\/french-revolution$/);
  await expect(page.getByRole("button", { name: "Enter the observatory" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
});

test("character deep links open the active observatory at the requested person", async ({ page }) => {
  await page.goto("/characters");
  await page.getByRole("searchbox", { name: "Search reviewed people" }).fill("Olympe");
  await page.getByRole("link", { name: "Open Olympe de Gouges in course" }).click();
  await expect(page).toHaveURL(/\/learn\/french-revolution\?focus=olympe-de-gouges$/);
  await expect(page.getByRole("heading", { name: "Olympe de Gouges", exact: true })).toBeVisible();
});

test("the global index keeps light text on its ink background from paper pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/characters");
  await page.getByRole("button", { name: "Open navigation index" }).click();

  const index = page.getByRole("dialog", { name: "Exhibition index" });
  await expect(index).toBeVisible();
  await expect(index).toHaveCSS("background-color", "rgb(5, 7, 11)");
  await expect(index).toHaveCSS("color", "rgb(243, 241, 234)");
  await expect(index.getByRole("link", { name: "Exhibition" })).toHaveCSS(
    "color",
    "rgb(243, 241, 234)",
  );
  await expect(index.getByRole("button", { name: /Close/ })).toHaveCSS(
    "color",
    "rgb(243, 241, 234)",
  );
});

test("lesson sources preserve the exhibition shell and return to the active character", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/learn/french-revolution?focus=olympe-de-gouges");
  await page.getByRole("link", { name: "Sources", exact: true }).click();

  await expect(page).toHaveURL(/\/sources\/french-revolution\?returnTo=/);
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Exhibition" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Courses" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Characters" })).toBeVisible();

  const sourcePage = page.locator("main.sources-page");
  await expect(sourcePage).toHaveCSS("background-color", "rgb(238, 236, 229)");
  await expect(sourcePage).toHaveCSS("color", "rgb(17, 17, 15)");

  await navigation.getByRole("link", { name: "Return to lesson" }).click();
  await expect(page).toHaveURL(/\/learn\/french-revolution\?focus=olympe-de-gouges$/);
  await expect(page.getByRole("heading", { name: "Olympe de Gouges", exact: true })).toBeVisible();
});
