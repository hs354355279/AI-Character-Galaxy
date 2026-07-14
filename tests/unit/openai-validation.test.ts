import { afterEach, describe, expect, it, vi } from "vitest";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  createSafetyIdentifier,
  generateAssessment,
  generateExplanation,
  generateSummary,
} from "@/lib/openai/learning-service";

const lesson = getLessonPack("french-revolution")!;
const explanationRequest = {
  lessonId: lesson.id,
  relationshipId: "rousseau-influences-robespierre",
  purpose: "explanation" as const,
  sessionId: "anonymous-session-1789",
};

afterEach(() => vi.unstubAllEnvs());

describe("source-constrained learning service", () => {
  it("rejects unknown source IDs and returns prepared content", async () => {
    const result = await generateExplanation(explanationRequest, lesson, async () => ({
      explanation: "Unsupported claim",
      sourceRefIds: ["missing-source"],
      followUpPrompt: "What evidence supports this?",
    }));
    expect(result.source).toBe("prepared");
    expect(
      result.data.sourceRefIds.every((id) => lesson.sources.some((source) => source.id === id)),
    ).toBe(true);
  });

  it("retries one transient failure and accepts valid structured output", async () => {
    const caller = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({
        explanation: "Rousseau's ideas about popular sovereignty shaped language Robespierre used when explaining political authority.",
        sourceRefIds: ["fr-wikipedia"],
        followUpPrompt: "How did an idea become a political action?",
      });
    const result = await generateExplanation(explanationRequest, lesson, caller);
    expect(caller).toHaveBeenCalledTimes(2);
    expect(result.source).toBe("gpt-5.6");
  });

  it("does not call a model when explored IDs are outside the lesson", async () => {
    const caller = vi.fn();
    const result = await generateAssessment(
      {
        lessonId: lesson.id,
        exploredCharacterIds: ["unknown-person"],
        exploredRelationshipIds: [],
        sessionId: "anonymous-session-1789",
      },
      lesson,
      caller,
    );
    expect(caller).not.toHaveBeenCalled();
    expect(result.source).toBe("prepared");
    expect(result.data.questions).toHaveLength(5);
  });

  it("falls back to a prepared summary when model output references unknown entities", async () => {
    const result = await generateSummary(
      {
        lessonId: lesson.id,
        visitedCharacterIds: ["robespierre"],
        visitedRelationshipIds: [],
        completedMissionIds: ["find-jacobin-leader"],
        sessionId: "anonymous-session-1789",
      },
      lesson,
      async () => ({
        summary: "A summary with an invented person.",
        keyCharacterIds: ["invented-person"],
        relationshipPathIds: [],
        concepts: ["invention"],
        followUpQuestion: "Who was invented?",
      }),
    );
    expect(result.source).toBe("prepared");
    expect(result.data.keyCharacterIds).toEqual(["robespierre"]);
  });

  it("creates a stable privacy-preserving safety identifier", () => {
    const first = createSafetyIdentifier("anonymous-session-1789");
    const second = createSafetyIdentifier("anonymous-session-1789");
    expect(first).toBe(second);
    expect(first).toMatch(/^acg_[a-f0-9]{32}$/);
    expect(first).not.toContain("anonymous-session-1789");
  });
});
