import { expect, test, type Page } from "@playwright/test";

async function checkAndContinue(page: Page) {
  await page.getByRole("button", { name: "Check mission" }).click();
  await expect(page.getByText("Mission complete")).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
}

test("French Revolution judge path reaches relationship discoveries", async ({ page }) => {
  await page.goto("/");
  const lessonCard = page.getByRole("article").filter({ hasText: "French Revolution" });
  await lessonCard.getByRole("link", { name: /Start exploration/ }).click();
  await page.getByRole("button", { name: /Start missions/ }).click();
  await page.getByRole("button", { name: "2D list" }).click();

  await page.getByRole("button", { name: "Select Maximilien Robespierre" }).click();
  await checkAndContinue(page);

  for (const name of ["Maximilien Robespierre", "Georges Danton", "Jean-Paul Marat"]) {
    await page.getByRole("button", { name: `Select ${name}` }).click();
  }
  await checkAndContinue(page);

  await page.getByRole("button", { name: "Select Jean-Jacques Rousseau" }).click();
  await page.getByRole("button", { name: "Select Louis XVI" }).click();
  await page
    .getByRole("button")
    .filter({ hasText: "Jean-Jacques Rousseau → Maximilien Robespierre" })
    .click();
  await expect(page.getByRole("heading", { name: /Rousseau.*Robespierre/ })).toBeVisible();
  await page.getByRole("link", { name: /Open lesson sources/ }).click();
  await expect(page.getByRole("heading", { name: "French Revolution: People and Factions" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Trace an idea into conflict" })).toBeVisible();
  await page.getByRole("button", { name: "2D list" }).click();

  await page.getByRole("button", { name: "Select Jean-Jacques Rousseau" }).click();
  await page.getByRole("button", { name: "Select Louis XVI" }).click();
  await page
    .getByRole("button")
    .filter({ hasText: "Jean-Jacques Rousseau → Maximilien Robespierre" })
    .click();
  await page
    .getByRole("button")
    .filter({ hasText: "Maximilien Robespierre → Louis XVI" })
    .click();
  await checkAndContinue(page);

  await page.getByRole("button", { name: "Select Gilbert du Motier, Marquis de Lafayette" }).click();
  await page.getByRole("button", { name: "Select Maximilien Robespierre" }).click();
  await page.getByLabel("Your evidence-based explanation").fill(
    "Lafayette favored constitutional limits, while Robespierre argued for a republic shaped by popular sovereignty.",
  );
  await checkAndContinue(page);

  await page
    .getByRole("button")
    .filter({ hasText: "Maximilien Robespierre ↔ Georges Danton" })
    .click();
  await page.getByLabel("Your evidence-based explanation").fill(
    "Their alliance became conflict when Danton urged restraint and Robespierre supported continued revolutionary repression.",
  );
  await checkAndContinue(page);

  await expect(page.getByRole("heading", { name: /mapped the full learning path/i })).toBeVisible();
  await page.getByRole("button", { name: /Begin comprehension check/ }).click();
  await page.getByRole("button", { name: /Finish and see discoveries/ }).click();
  await expect(page.getByRole("heading", { name: "My Relationship Discoveries" })).toBeVisible();
  await expect(page.getByText("5", { exact: true }).last()).toBeVisible();
});
