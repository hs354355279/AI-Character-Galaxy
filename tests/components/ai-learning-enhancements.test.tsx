import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssessmentPanel } from "@/components/learning/AssessmentPanel";
import { LearningSummary } from "@/components/learning/LearningSummary";
import { getLessonPack } from "@/lib/lessons/repository";
import { createLearningSession } from "@/lib/session/learning-session";

const lesson = getLessonPack("french-revolution")!;
const session = {
  ...createLearningSession(lesson.id, "2026-07-14T00:00:00.000Z"),
  visitedCharacterIds: ["rousseau", "robespierre"],
  visitedRelationshipIds: ["rousseau-influences-robespierre"],
  completedMissionIds: ["find-jacobin-leader"],
};

afterEach(() => vi.unstubAllGlobals());

describe("optional GPT-5.6 learning enhancements", () => {
  it("can replace the prepared assessment with a validated generated check", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            source: "gpt-5.6",
            data: {
              questions: lesson.preparedAssessment.map((question, index) => ({
                ...question,
                prompt: index === 0 ? "How did Rousseau's ideas influence revolutionary action?" : question.prompt,
              })),
            },
          }),
          { status: 200 },
        ),
      ),
    );
    render(<AssessmentPanel lesson={lesson} session={session} onFinish={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /build a gpt-5.6 check/i }));
    expect(await screen.findByText(/How did Rousseau's ideas influence/i)).toBeVisible();
    expect(screen.getByText(/GPT-5.6 · validated/i)).toBeVisible();
  });

  it("can display a validated personal learning summary", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            source: "gpt-5.6",
            data: {
              summary: "You traced how reviewed political ideas moved through a relationship into revolutionary action.",
              keyCharacterIds: ["rousseau", "robespierre"],
              relationshipPathIds: ["rousseau-influences-robespierre"],
              concepts: ["Popular sovereignty", "Political influence"],
              followUpQuestion: "When can an idea change events without direct personal contact?",
            },
          }),
          { status: 200 },
        ),
      ),
    );
    render(<LearningSummary lesson={lesson} session={session} />);
    await user.click(screen.getByRole("button", { name: /create gpt-5.6 summary/i }));
    expect(await screen.findByText(/reviewed political ideas moved/i)).toBeVisible();
    expect(screen.getByText("Popular sovereignty")).toBeVisible();
  });
});
