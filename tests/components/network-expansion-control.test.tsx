import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkExpansionControl } from "@/components/learning/NetworkExpansionControl";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  createEmptyExpansionState,
  createRuntimeRelationshipGraph,
} from "@/lib/network-expansion/runtime-graph";
import { maryExpansionBatch } from "@/tests/fixtures/network-expansion";

const lesson = getLessonPack("french-revolution")!;
const focus = createRuntimeRelationshipGraph(
  lesson,
  createEmptyExpansionState(lesson.id),
).characters.find((character) => character.id === "olympe-de-gouges")!;

afterEach(() => vi.unstubAllGlobals());

describe("NetworkExpansionControl", () => {
  it("sends the selected focus and inserts a successful batch before announcing it", async () => {
    const user = userEvent.setup();
    const onExpanded = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      source: "gpt-5.6",
      data: maryExpansionBatch,
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <NetworkExpansionControl
        lessonId={lesson.id}
        focus={focus}
        sessionId="session-network-123"
        existingCharacterNames={lesson.characters.map((character) => character.name)}
        existingRelationshipKeys={[]}
        onExpanded={onExpanded}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" }));

    expect(onExpanded).toHaveBeenCalledWith(maryExpansionBatch);
    expect(await screen.findByRole("status")).toHaveTextContent("Added 1 person: Mary Wollstonecraft");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.focus).toMatchObject({ id: "olympe-de-gouges", name: "Olympe de Gouges" });
  });

  it("leaves graph mutation to the parent only after a valid response", async () => {
    const user = userEvent.setup();
    const onExpanded = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "No new verified relationships were found.",
    }), { status: 422 })));

    render(
      <NetworkExpansionControl
        lessonId={lesson.id}
        focus={focus}
        sessionId="session-network-123"
        existingCharacterNames={lesson.characters.map((character) => character.name)}
        existingRelationshipKeys={[]}
        onExpanded={onExpanded}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Expand relationship galaxy with GPT-5.6" }));

    expect(onExpanded).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No new verified relationships were found for this person.",
    );
  });
});
