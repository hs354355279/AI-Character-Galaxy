import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LearningExperience } from "@/components/learning/LearningExperience";
import { getLessonPack } from "@/lib/lessons/repository";
import { createLearningSession } from "@/lib/session/learning-session";
import { saveExpansionState, expansionStorageKey } from "@/lib/network-expansion/storage";
import { maryExpansionBatch, maryExpansionState } from "@/tests/fixtures/network-expansion";

vi.mock("@/components/galaxy/GalaxyScene", () => ({
  GalaxyScene: () => <div aria-label="Interactive 3D relationship galaxy" />,
}));

const lesson = getLessonPack("french-revolution")!;

afterEach(() => vi.unstubAllGlobals());

describe("LearningExperience", () => {
  it("starts the lesson and completes a local character mission", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);

    await user.click(screen.getByRole("button", { name: "Enter the observatory" }));
    expect(screen.getByRole("heading", { name: /find the jacobin leader/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Select Maximilien Robespierre" }));
    await user.click(screen.getByRole("button", { name: /check mission/i }));
    expect(screen.getByText(/mission complete/i)).toBeVisible();
  });

  it("keeps a selected character synchronized when switching views", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);
    await user.click(screen.getByRole("button", { name: "Enter the observatory" }));
    await user.click(screen.getByRole("button", { name: "Select Maximilien Robespierre" }));
    await user.click(screen.getByRole("button", { name: "3D galaxy" }));

    expect(screen.getByRole("heading", { name: "Maximilien Robespierre" })).toBeVisible();
    expect(screen.getByLabelText("Interactive 3D relationship galaxy")).toBeVisible();
  });

  it("allows one built-in hint per mission", async () => {
    const user = userEvent.setup();
    render(<LearningExperience lesson={lesson} initialView="2d" webglAvailable />);
    await user.click(screen.getByRole("button", { name: "Enter the observatory" }));

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

  it("keeps every character directly selectable from the observatory rail", () => {
    const active = createLearningSession(lesson.id, "2026-07-14T00:00:00.000Z");
    render(
      <LearningExperience
        lesson={lesson}
        initialSession={active}
        initialView="2d"
        webglAvailable={false}
      />,
    );

    expect(screen.getByRole("navigation", { name: "People filmstrip" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Select Olympe de Gouges" })).toBeVisible();
  });

  it("opens a deep-linked character in the active observatory", () => {
    render(
      <LearningExperience
        lesson={lesson}
        initialFocusCharacterId="olympe-de-gouges"
        initialView="2d"
        webglAvailable={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Olympe de Gouges" })).toBeVisible();
  });

  it("renders the approved editorial observatory without changing learning controls", () => {
    const active = createLearningSession(lesson.id, "2026-07-14T00:00:00.000Z");
    const { container } = render(
      <LearningExperience
        lesson={lesson}
        initialSession={active}
        initialView="2d"
        webglAvailable
      />,
    );

    expect(screen.getByRole("complementary", { name: "Current mission" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Relationship observatory" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Evidence sheet" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "People filmstrip" })).toBeVisible();
    expect(container.querySelector(".exhibition-header--paper")).not.toBeNull();
    expect(screen.getByTestId("learning-workspace")).toHaveClass(
      "learning-workspace--french-revolution",
    );
    expect(screen.getByRole("button", { name: "Check mission" })).toBeVisible();
  });

  it("shows selected details immediately and expands the graph without changing focus", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      source: "gpt-5.6",
      data: maryExpansionBatch,
    }), { status: 200 })));
    render(
      <LearningExperience
        lesson={lesson}
        initialSession={createLearningSession(lesson.id, "2026-07-16T00:00:00.000Z")}
        initialView="2d"
        webglAvailable={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select Olympe de Gouges" }));
    expect(screen.getByRole("heading", { name: "Olympe de Gouges" })).toBeVisible();
    expect(screen.getAllByText(/writer and rights advocate/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /explain with gpt-5.6/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" }));

    const mary = await screen.findByRole("button", { name: "Select Mary Wollstonecraft" });
    expect(mary).toBeVisible();
    expect(screen.getByRole("heading", { name: "Olympe de Gouges" })).toBeVisible();
    expect(screen.getByText("10 people · 13 links")).toBeVisible();
    await user.click(mary);
    expect(screen.getByRole("heading", { name: "Mary Wollstonecraft" })).toBeVisible();
    expect(screen.getByText(/argued that women deserved education/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /mary wollstonecraft biography/i })).toHaveAttribute(
      "href",
      "https://example.org/wollstonecraft",
    );
  });

  it("restores a valid expansion and ignores malformed session data", async () => {
    saveExpansionState(maryExpansionState, window.sessionStorage);
    const { unmount } = render(
      <LearningExperience
        lesson={lesson}
        initialSession={createLearningSession(lesson.id, "2026-07-16T00:00:00.000Z")}
        initialView="2d"
        webglAvailable={false}
      />,
    );

    expect(await screen.findByRole("button", { name: "Select Mary Wollstonecraft" })).toBeVisible();
    unmount();

    window.sessionStorage.setItem(expansionStorageKey(lesson.id), "not-json");
    render(
      <LearningExperience
        lesson={lesson}
        initialSession={createLearningSession(lesson.id, "2026-07-16T00:00:00.000Z")}
        initialView="2d"
        webglAvailable={false}
      />,
    );

    expect(await screen.findByText("9 people · 12 links")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Select Mary Wollstonecraft" })).not.toBeInTheDocument();
  });
});
