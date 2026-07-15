import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCharacterQueryHandler,
  POST,
} from "@/app/api/characters/query/route";
import {
  CharacterResearchNotFoundError,
  CharacterResearchUpstreamError,
} from "@/lib/openai/character-research";

const request = (body: unknown) => new Request("http://localhost/api/characters/query", {
  method: "POST",
  body: JSON.stringify(body),
});

afterEach(() => vi.unstubAllEnvs());

describe("character query API", () => {
  it("rejects invalid input and reports missing server configuration", async () => {
    expect((await POST(request({ name: "", sessionId: "session-123" }))).status).toBe(400);
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(request({ name: "Mary Wollstonecraft", sessionId: "session-123" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Character research is not configured." });
  });

  it("maps not-found and exhausted upstream calls without leaking internals", async () => {
    const notFound = createCharacterQueryHandler(async () => {
      throw new CharacterResearchNotFoundError();
    });
    const upstream = createCharacterQueryHandler(async () => {
      throw new CharacterResearchUpstreamError(new Error("secret upstream body"));
    });

    expect((await notFound(request({ name: "Unknown", sessionId: "session-123" }))).status).toBe(422);
    const response = await upstream(request({ name: "Known", sessionId: "session-123" }));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("secret upstream body");
  });
});
