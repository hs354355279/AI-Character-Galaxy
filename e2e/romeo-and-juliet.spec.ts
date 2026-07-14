import { expect, test, type Page } from "@playwright/test";

async function checkAndContinue(page: Page) {
  await page.getByRole("button", { name: "Check mission" }).click();
  await expect(page.getByText("Mission complete")).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
}

test("Romeo and Juliet judge path compares characters and explains a turning point", async ({ page }) => {
  await page.goto("/learn/romeo-and-juliet");
  await page.getByRole("button", { name: /Start missions/ }).click();
  await page.getByRole("button", { name: "2D list" }).click();

  await page.getByRole("button", { name: "Select Friar Laurence" }).click();
  await checkAndContinue(page);

  for (const name of ["Juliet Capulet", "Tybalt Capulet", "Lord Capulet"]) {
    await page.getByRole("button", { name: `Select ${name}` }).click();
  }
  await checkAndContinue(page);

  await page.getByRole("button", { name: "Select Romeo Montague" }).click();
  await page.getByRole("button", { name: "Select Juliet Capulet" }).click();
  await page.getByRole("button").filter({ hasText: "Friar Laurence → Romeo Montague" }).click();
  await page.getByRole("button").filter({ hasText: "Friar Laurence → Juliet Capulet" }).click();
  await checkAndContinue(page);

  await page.getByRole("button", { name: "Select Romeo Montague" }).click();
  await page.getByRole("button", { name: "Select Juliet Capulet" }).click();
  await page.getByLabel("Your evidence-based explanation").fill(
    "Romeo reacts quickly to immediate danger, while Juliet balances love with the pressure and control of her household.",
  );
  await checkAndContinue(page);

  await page.getByRole("button").filter({ hasText: "Tybalt Capulet → Mercutio" }).click();
  await page.getByLabel("Your evidence-based explanation").fill(
    "Tybalt kills Mercutio, Romeo answers with violence, and that chain of conflict causes Romeo's banishment from Verona.",
  );
  await checkAndContinue(page);

  await page.getByRole("button", { name: /Begin comprehension check/ }).click();
  await page.getByRole("button", { name: /Finish and see discoveries/ }).click();
  await expect(page.getByRole("heading", { name: "My Relationship Discoveries" })).toBeVisible();
  await expect(page.getByText(/family loyalties and trusted relationships/i)).toBeVisible();
});
