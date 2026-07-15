import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NetworkExpansionConfigurationError,
  NetworkExpansionNotFoundError,
  queryRelationshipNetworkExpansion,
  type NetworkExpansionCaller,
} from "@/lib/openai/network-expansion";
import type { ExpandNetworkRequest } from "@/lib/network-expansion/schemas";

const request: ExpandNetworkRequest = {
  lessonId: "french-revolution",
  focus: {
    id: "olympe-de-gouges",
    name: "Untrusted replacement name",
    role: "Untrusted replacement role",
    summary: "This untrusted client summary is long enough to pass request validation.",
  },
  existingCharacterNames: ["Louis XVI", "Olympe de Gouges"],
  existingRelationshipKeys: [],
  sessionId: "session-network-123",
};

const candidate = {
  canonicalName: "Mary Wollstonecraft",
  aliases: [],
  role: "Writer and political philosopher",
  summary: "Mary Wollstonecraft argued that women deserved education and recognition as rational citizens.",
  relationshipType: "influence" as const,
  direction: "undirected" as const,
  strength: 4,
  relationshipSummary: "Their writings joined a wider revolutionary debate about women's political rights.",
  evidenceSummary: "Published texts and modern scholarship document their parallel interventions in rights debates.",
  confidence: 0.86,
  isDisputed: false,
  learningTags: ["rights", "writing"],
  evidenceSourceUrls: ["https://example.org/wollstonecraft"],
};

function result(overrides: Partial<typeof candidate> = {}) {
  return {
    output: { candidates: [{ ...candidate, ...overrides }] },
    citations: [{ title: "Wollstonecraft biography", url: "https://example.org/wollstonecraft" }],
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("GPT relationship network expansion", () => {
  it("uses the reviewed lesson record as the authoritative focus", async () => {
    let received: ExpandNetworkRequest | undefined;
    const caller: NetworkExpansionCaller = async (input) => {
      received = input;
      return result();
    };

    const response = await queryRelationshipNetworkExpansion(request, caller);

    expect(received?.focus).toMatchObject({
      id: "olympe-de-gouges",
      name: "Olympe de Gouges",
      role: "Writer and rights advocate",
    });
    expect(response.data.characters[0]).toMatchObject({
      id: "ai-mary-wollstonecraft",
      provenance: "ai-expanded",
    });
    expect(response.data.relationships[0].fromCharacterId).toBe("olympe-de-gouges");
  });

  it("requires candidate sources to match extracted web citations", async () => {
    await expect(queryRelationshipNetworkExpansion(request, async () => ({
      ...result(),
      citations: [{ title: "Different source", url: "https://example.org/different" }],
    }))).rejects.toBeInstanceOf(NetworkExpansionNotFoundError);
  });

  it("deduplicates existing names and rejects a duplicates-only response", async () => {
    await expect(queryRelationshipNetworkExpansion(request, async () => result({
      canonicalName: "Louis XVI",
    }))).rejects.toBeInstanceOf(NetworkExpansionNotFoundError);
  });

  it("retries one transient failure and caps accepted people at three", async () => {
    const caller = vi.fn<NetworkExpansionCaller>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce({
        output: {
          candidates: [
            candidate,
            { ...candidate, canonicalName: "Nicolas de Condorcet", evidenceSourceUrls: ["https://example.org/condorcet"] },
            { ...candidate, canonicalName: "Thomas Paine", evidenceSourceUrls: ["https://example.org/paine"] },
          ],
        },
        citations: [
          { title: "Wollstonecraft", url: "https://example.org/wollstonecraft" },
          { title: "Condorcet", url: "https://example.org/condorcet" },
          { title: "Paine", url: "https://example.org/paine" },
        ],
      });

    const response = await queryRelationshipNetworkExpansion(request, caller);
    expect(caller).toHaveBeenCalledTimes(2);
    expect(response.data.characters).toHaveLength(3);
    expect(response.data.relationships).toHaveLength(3);
  });

  it("requires server configuration when no caller is injected", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(queryRelationshipNetworkExpansion(request))
      .rejects.toBeInstanceOf(NetworkExpansionConfigurationError);
  });
});
