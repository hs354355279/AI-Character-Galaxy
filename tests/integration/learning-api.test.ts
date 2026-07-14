import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as explain } from "@/app/api/learning/explain/route";
import { POST as assessment } from "@/app/api/learning/assessment/route";
import { POST as summary } from "@/app/api/learning/summary/route";

afterEach(() => vi.unstubAllEnvs());

describe("learning API routes", () => {
  it("returns a prepared explanation when no API key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await explain(
      new Request("http://localhost/api/learning/explain", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "french-revolution",
          relationshipId: "rousseau-influences-robespierre",
          purpose: "explanation",
          sessionId: "anonymous-session-1789",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).source).toBe("prepared");
  });

  it("rejects malformed and unknown lesson input", async () => {
    const response = await assessment(
      new Request("http://localhost/api/learning/assessment", {
        method: "POST",
        body: JSON.stringify({ lessonId: "missing", sessionId: "x" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns a prepared summary without network access", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await summary(
      new Request("http://localhost/api/learning/summary", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "romeo-and-juliet",
          visitedCharacterIds: ["romeo", "juliet"],
          visitedRelationshipIds: ["romeo-loves-juliet"],
          completedMissionIds: ["compare-romeo-juliet"],
          sessionId: "anonymous-session-1597",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("prepared");
    expect(body.data.keyCharacterIds).toEqual(["romeo", "juliet"]);
  });
});
