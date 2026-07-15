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
