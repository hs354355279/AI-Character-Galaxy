import { describe, expect, it, vi } from "vitest";
import {
  CharacterResearchNotFoundError,
  queryCharacterResearch,
} from "@/lib/openai/character-research";
import {
  CharacterResearchProfileSchema,
  CharacterResearchRequestSchema,
} from "@/lib/openai/character-schemas";

const validProfile = {
  found: true,
  canonicalName: "Mary Wollstonecraft",
  descriptor: "Writer and political philosopher",
  era: "Enlightenment, 1759–1797",
  summary: "Mary Wollstonecraft argued that women deserved education and political recognition as rational citizens.",
  whyItMatters: "Her work connects Enlightenment claims about reason and rights to later movements for women's equality.",
  relationships: [
    { name: "William Godwin", connection: "Political philosopher, spouse, and intellectual interlocutor." },
    { name: "Mary Shelley", connection: "Her daughter, who became a major novelist." },
  ],
  studyPrompts: [
    "How did Wollstonecraft extend Enlightenment arguments about rights?",
    "Why did education matter to her political thought?",
  ],
};

describe("GPT character research", () => {
  it("constrains custom names and session identifiers", () => {
    expect(() => CharacterResearchRequestSchema.parse({ name: "", sessionId: "12345678" })).toThrow();
    expect(() => CharacterResearchRequestSchema.parse({ name: "A".repeat(101), sessionId: "12345678" })).toThrow();
    expect(CharacterResearchProfileSchema.parse(validProfile).found).toBe(true);
  });

  it("deduplicates web citations from a validated structured profile", async () => {
    const result = await queryCharacterResearch(
      { name: "Mary Wollstonecraft", context: "political thought", sessionId: "session-123" },
      async () => ({
        profile: validProfile,
        citations: [
          { title: "Biography", url: "https://example.org/bio" },
          { title: "Biography", url: "https://example.org/bio" },
        ],
      }),
    );
    expect(result.source).toBe("gpt-5.6");
    expect(result.citations).toEqual([{ title: "Biography", url: "https://example.org/bio" }]);
  });

  it("retries one transient failure and maps ambiguous identities to not found", async () => {
    const transient = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce({ profile: validProfile, citations: [] });
    await expect(queryCharacterResearch(
      { name: "Mary Wollstonecraft", sessionId: "session-123" },
      transient,
    )).resolves.toMatchObject({ source: "gpt-5.6" });
    expect(transient).toHaveBeenCalledTimes(2);

    await expect(queryCharacterResearch(
      { name: "Possibly Nobody", sessionId: "session-123" },
      async () => ({
        profile: {
          ...validProfile,
          found: false,
          canonicalName: "",
          descriptor: "",
          era: "",
          summary: "",
          whyItMatters: "",
          relationships: [],
          studyPrompts: [],
        },
        citations: [],
      }),
    )).rejects.toBeInstanceOf(CharacterResearchNotFoundError);
  });
});
