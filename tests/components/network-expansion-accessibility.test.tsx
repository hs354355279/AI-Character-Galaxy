import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkExpansionControl } from "@/components/learning/NetworkExpansionControl";
import { CharacterRail } from "@/components/learning/CharacterRail";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  createEmptyExpansionState,
  createRuntimeRelationshipGraph,
} from "@/lib/network-expansion/runtime-graph";
import { maryExpansionState } from "@/tests/fixtures/network-expansion";

const lesson = getLessonPack("french-revolution")!;
const reviewedGraph = createRuntimeRelationshipGraph(lesson, createEmptyExpansionState(lesson.id));
const focus = reviewedGraph.characters.find((character) => character.id === "olympe-de-gouges")!;

const props = {
  lessonId: lesson.id,
  focus,
  sessionId: "session-network-123",
  existingCharacterNames: lesson.characters.map((character) => character.name),
  existingRelationshipKeys: [],
  onExpanded: vi.fn(),
};

afterEach(() => vi.unstubAllGlobals());

describe("relationship expansion accessibility", () => {
  it("announces loading and prevents duplicate activation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    render(<NetworkExpansionControl {...props} />);

    const action = screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" });
    await user.click(action);

    expect(screen.getByLabelText("AI relationship network expansion")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Researching verified relationships…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    await user.click(screen.getByRole("button", { name: "Researching verified relationships…" }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps errors visible and explains a disabled capacity state", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
    const { rerender } = render(<NetworkExpansionControl {...props} />);
    await user.click(screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The relationship network could not be expanded right now.",
    );

    rerender(
      <NetworkExpansionControl
        {...props}
        disabledReason="Expansion limit reached for this session"
      />,
    );
    const disabled = screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAccessibleDescription("Expansion limit reached for this session");
  });

  it("keeps AI provenance textual in keyboard-accessible people controls", () => {
    const graph = createRuntimeRelationshipGraph(lesson, maryExpansionState);
    render(
      <CharacterRail
        characters={graph.characters}
        groups={graph.groups}
        selectedCharacterId={null}
        onSelect={vi.fn()}
      />,
    );

    const person = screen.getByRole("button", { name: "Select Mary Wollstonecraft" });
    expect(person).toHaveTextContent("AI expanded");
    expect(person).not.toHaveAttribute("tabindex", "-1");
  });
});
