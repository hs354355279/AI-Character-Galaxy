import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterAtlas } from "@/components/characters/CharacterAtlas";
import { createCharacterDirectory } from "@/lib/characters/directory";
import { getAllLessonPacks } from "@/lib/lessons/repository";

describe("CharacterAtlas", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the reviewed index and filters it without hiding lesson routes", async () => {
    const user = userEvent.setup();
    render(<CharacterAtlas entries={createCharacterDirectory(getAllLessonPacks())} />);

    expect(screen.getByText("18 reviewed people")).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(18);

    await user.type(screen.getByRole("searchbox", { name: "Search reviewed people" }), "Olympe");
    expect(screen.getByRole("heading", { name: "Olympe de Gouges" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Olympe de Gouges in course" }))
      .toHaveAttribute("href", "/learn/french-revolution?focus=olympe-de-gouges");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("researches a custom person and exhibits grounded citations", async () => {
    const user = userEvent.setup();
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    render(<CharacterAtlas entries={createCharacterDirectory(getAllLessonPacks())} />);

    await user.type(screen.getByLabelText("Character name"), "Mary Wollstonecraft");
    await user.click(screen.getByRole("button", { name: "Research character" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Researching sources");

    resolveFetch?.(new Response(JSON.stringify({
      source: "gpt-5.6",
      data: {
        found: true,
        canonicalName: "Mary Wollstonecraft",
        descriptor: "Writer and political philosopher",
        era: "Enlightenment, 1759–1797",
        summary: "She argued that women deserved education and political recognition as rational citizens.",
        whyItMatters: "Her work extended Enlightenment claims about reason and rights to women.",
        relationships: [
          { name: "William Godwin", connection: "Spouse and intellectual interlocutor." },
          { name: "Mary Shelley", connection: "Daughter and later novelist." },
        ],
        studyPrompts: ["How did she extend arguments about rights?", "Why did education matter?"],
      },
      citations: [{ title: "Biography", url: "https://example.org/bio" }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    expect(await screen.findByRole("heading", { name: "Mary Wollstonecraft" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Biography" })).toHaveAttribute("href", "https://example.org/bio");
  });

  it.each([
    [422, "We could not verify that person"],
    [503, "Character research is not configured"],
    [502, "Research sources are temporarily unavailable"],
  ])("maps research status %s to a useful message", async (status, message) => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ error: "Server detail" }),
      { status, headers: { "Content-Type": "application/json" } },
    ));
    render(<CharacterAtlas entries={createCharacterDirectory(getAllLessonPacks())} />);
    await user.type(screen.getByLabelText("Character name"), "Uncertain Person");
    await user.click(screen.getByRole("button", { name: "Research character" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});
