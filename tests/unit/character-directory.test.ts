import { describe, expect, it } from "vitest";
import {
  createCharacterDirectory,
  filterCharacters,
} from "@/lib/characters/directory";
import { getAllLessonPacks } from "@/lib/lessons/repository";

describe("character directory", () => {
  const entries = createCharacterDirectory(getAllLessonPacks());

  it("normalizes every reviewed lesson character into one authoritative entry", () => {
    expect(entries).toHaveLength(18);
    expect(entries.find((entry) => entry.name === "Olympe de Gouges")?.lessonHref)
      .toBe("/learn/french-revolution?focus=olympe-de-gouges");
    expect(entries.find((entry) => entry.name === "Juliet Capulet")?.sourceHref)
      .toBe("/sources/romeo-and-juliet");
  });

  it("searches reviewed summaries, tags, groups, and lesson names", () => {
    expect(
      filterCharacters(entries, { query: "rights", lessonId: "all", groupId: "all" })
        .some((entry) => entry.name === "Olympe de Gouges"),
    ).toBe(true);
    expect(
      filterCharacters(entries, {
        query: "",
        lessonId: "romeo-and-juliet",
        groupId: "capulet-house",
      }).every((entry) => entry.lessonId === "romeo-and-juliet"),
    ).toBe(true);
  });
});
