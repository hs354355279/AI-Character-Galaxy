import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createExpandNetworkHandler,
  POST,
} from "@/app/api/learning/expand-network/route";
import {
  NetworkExpansionConfigurationError,
  NetworkExpansionNotFoundError,
  NetworkExpansionUpstreamError,
} from "@/lib/openai/network-expansion";
import type { NetworkExpansionBatch } from "@/lib/network-expansion/schemas";

const validBody = {
  lessonId: "french-revolution",
  focus: {
    id: "olympe-de-gouges",
    name: "Olympe de Gouges",
    role: "Writer and rights advocate",
    summary: "Olympe de Gouges demanded political rights for women during the French Revolution.",
  },
  existingCharacterNames: ["Olympe de Gouges"],
  existingRelationshipKeys: [],
  sessionId: "session-network-123",
};

const request = (body: unknown) => new Request("http://localhost/api/learning/expand-network", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const batch: NetworkExpansionBatch = {
  focusCharacterId: "olympe-de-gouges",
  characters: [{
    id: "ai-mary-wollstonecraft",
    name: "Mary Wollstonecraft",
    aliases: [],
    role: "Writer and political philosopher",
    summary: "Mary Wollstonecraft argued that women deserved education and recognition as rational citizens.",
    groupId: "ai-expanded-network",
    importance: 3,
    sourceRefIds: ["source-wollstonecraft"],
    learningTags: ["rights"],
    provenance: "ai-expanded",
    citationIds: ["source-wollstonecraft"],
  }],
  relationships: [{
    id: "ai-olympe-de-gouges-ai-mary-wollstonecraft-influence",
    fromCharacterId: "olympe-de-gouges",
    toCharacterId: "ai-mary-wollstonecraft",
    type: "influence",
    direction: "undirected",
    strength: 4,
    summary: "Their writings joined a wider revolutionary debate about women's political rights.",
    evidenceSummary: "Published texts and modern scholarship document their interventions in rights debates.",
    sourceRefIds: ["source-wollstonecraft"],
    confidence: 0.86,
    isDisputed: false,
    learningTags: ["rights"],
    provenance: "ai-expanded",
    citationIds: ["source-wollstonecraft"],
  }],
  citations: [{ id: "source-wollstonecraft", title: "Biography", url: "https://example.org/wollstonecraft" }],
  generatedAt: "2026-07-16T00:00:00.000Z",
};

afterEach(() => vi.unstubAllEnvs());

describe("relationship network expansion API", () => {
  it("rejects invalid JSON and invalid request data", async () => {
    const invalidJson = await POST(new Request("http://localhost/api/learning/expand-network", {
      method: "POST",
      body: "{",
    }));
    expect(invalidJson.status).toBe(400);
    expect((await POST(request({ ...validBody, focus: { id: "x" } }))).status).toBe(400);
  });

  it("returns a validated successful batch", async () => {
    const handler = createExpandNetworkHandler(async () => ({ source: "gpt-5.6", data: batch }));
    const response = await handler(request(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ source: "gpt-5.6", data: batch });
  });

  it("maps domain failures to sanitized status codes", async () => {
    const cases = [
      [new NetworkExpansionNotFoundError(), 422],
      [new NetworkExpansionConfigurationError(), 503],
      [new NetworkExpansionUpstreamError(new Error("secret upstream body")), 502],
    ] as const;

    for (const [error, status] of cases) {
      const handler = createExpandNetworkHandler(async () => { throw error; });
      const response = await handler(request(validBody));
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain("secret upstream body");
    }
  });
});
