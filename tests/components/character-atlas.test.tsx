import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CharacterAtlas } from "@/components/characters/CharacterAtlas";
import { createCharacterDirectory } from "@/lib/characters/directory";
import { getAllLessonPacks } from "@/lib/lessons/repository";

describe("CharacterAtlas", () => {
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
});
