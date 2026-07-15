import { expect, test } from "@playwright/test";

test("custom GPT research stays visibly separate from reviewed characters", async ({ page }) => {
  await page.route("**/api/characters/query", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "gpt-5.6",
        data: {
          found: true,
          canonicalName: "Mary Wollstonecraft",
          descriptor: "Writer and political philosopher",
          era: "Enlightenment, 1759–1797",
          summary: "Wollstonecraft argued that women deserved education and political recognition as rational citizens.",
          whyItMatters: "Her work extends Enlightenment claims about reason and rights to questions of women's equality.",
          relationships: [
            { name: "William Godwin", connection: "Spouse and intellectual interlocutor." },
            { name: "Mary Shelley", connection: "Daughter and later novelist." },
          ],
          studyPrompts: [
            "How did she extend arguments about rights?",
            "Why did education matter to her political thought?",
          ],
        },
        citations: [{ title: "Biography", url: "https://example.org/bio" }],
      }),
    });
  });

  await page.goto("/characters");
  await page.getByLabel("Character name").fill("Mary Wollstonecraft");
  await page.getByRole("button", { name: "Research character" }).click();
  await expect(page.getByText("Generated with GPT‑5.6 · Web-grounded")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mary Wollstonecraft" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Biography" })).toHaveAttribute("href", "https://example.org/bio");
  await expect(page.getByRole("heading", { name: "Olympe de Gouges" })).toBeVisible();
});
