import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningExperience } from "@/components/learning/LearningExperience";
import { getLessonPack } from "@/lib/lessons/repository";
import { createLearningSession } from "@/lib/session/learning-session";

vi.mock("@/components/galaxy/GalaxyScene", () => ({
  GalaxyScene: () => <div aria-label="Interactive 3D relationship galaxy" />,
}));

const lesson = getLessonPack("french-revolution")!;

describe("LearningExperience", () => {
  it("starts the lesson and completes a local character mission", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);

    await user.click(screen.getByRole("button", { name: /start missions/i }));
    expect(screen.getByRole("heading", { name: /find the jacobin leader/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Select Maximilien Robespierre" }));
    await user.click(screen.getByRole("button", { name: /check mission/i }));
    expect(screen.getByText(/mission complete/i)).toBeVisible();
  });

  it("keeps a selected character synchronized when switching views", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);
    await user.click(screen.getByRole("button", { name: /start missions/i }));
    await user.click(screen.getByRole("button", { name: "Select Maximilien Robespierre" }));
    await user.click(screen.getByRole("button", { name: "3D galaxy" }));

    expect(screen.getByRole("heading", { name: "Maximilien Robespierre" })).toBeVisible();
    expect(screen.getByLabelText("Interactive 3D relationship galaxy")).toBeVisible();
  });

  it("allows one built-in hint per mission", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);
    await user.click(screen.getByRole("button", { name: /start missions/i }));

    const hintButton = screen.getByRole("button", { name: /reveal hint/i });
    await user.click(hintButton);
    expect(screen.getByText(/Look inside the Radical Revolution group/i)).toBeVisible();
    expect(hintButton).toBeDisabled();
  });

  it("offers prepared assessment and discoveries after all missions", async () => {
    const user = userEvent.setup();
    const completed = {
      ...createLearningSession(lesson.id, "2026-07-14T00:00:00.000Z"),
      completedMissionIds: lesson.missions.map((mission) => mission.id),
      visitedCharacterIds: ["robespierre", "rousseau", "louis-xvi"],
      visitedRelationshipIds: ["rousseau-influences-robespierre"],
    };
    render(
      <LearningExperience
        lesson={lesson}
        initialSession={completed}
        initialView="2d"
        webglAvailable
      />,
    );

    await user.click(screen.getByRole("button", { name: /begin comprehension check/i }));
    expect(screen.getByRole("heading", { name: /check your relationship model/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /finish and see discoveries/i }));
    expect(screen.getByRole("heading", { name: /my relationship discoveries/i })).toBeVisible();
  });
});
