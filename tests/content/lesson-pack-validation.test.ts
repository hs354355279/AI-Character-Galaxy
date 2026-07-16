import { describe, expect, it } from "vitest";
import { getAllLessonPacks } from "@/lib/lessons/repository";
import { EXPANDED_GROUP } from "@/lib/network-expansion/schemas";

describe("official lesson packs", () => {
  it("ships two English, evidence-complete, mission-safe packs", () => {
    const packs = getAllLessonPacks();

    expect(packs.map((pack) => pack.id).sort()).toEqual([
      "french-revolution",
      "romeo-and-juliet",
    ]);

    for (const pack of packs) {
      expect(pack.locale).toBe("en");
      expect(pack.characters.length).toBeLessThanOrEqual(12);
      expect(pack.relationships.length).toBeLessThanOrEqual(25);
      expect(pack.missions.length).toBeGreaterThanOrEqual(4);
      expect(pack.missions.length).toBeLessThanOrEqual(6);
      expect(pack.characters.every((node) => node.sourceRefIds.length > 0)).toBe(true);
      expect(
        pack.relationships.every(
          (edge) => edge.sourceRefIds.length > 0 && edge.evidenceSummary.length > 0,
        ),
      ).toBe(true);

      const missionEdges = new Set(
        pack.missions.flatMap((mission) => mission.relevantRelationshipIds),
      );
      expect(
        pack.relationships
          .filter((edge) => missionEdges.has(edge.id))
          .every((edge) => edge.confidence >= 0.7),
      ).toBe(true);

      const characterIds = new Set(pack.characters.map((node) => node.id));
      expect(
        pack.relationships.every(
          (edge) =>
            characterIds.has(edge.fromCharacterId) &&
            characterIds.has(edge.toCharacterId),
        ),
      ).toBe(true);
    }
  });

  it("requires literary evidence locators and neutral dispute notes", () => {
    const packs = getAllLessonPacks();
    const literature = packs.find((pack) => pack.kind === "literature");
    const history = packs.find((pack) => pack.kind === "history");

    expect(literature?.relationships.every((edge) => Boolean(edge.evidenceLocation))).toBe(true);
    expect(
      history?.relationships
        .filter((edge) => edge.isDisputed)
        .every((edge) => Boolean(edge.disputeNote)),
    ).toBe(true);
  });

  it("uses the approved mineral constellation family without removing symbol cues", () => {
    const packs = getAllLessonPacks();
    const history = packs.find((pack) => pack.id === "french-revolution")!;
    const literature = packs.find((pack) => pack.id === "romeo-and-juliet")!;

    expect(history.groups.map((group) => group.color)).toEqual([
      "#b79a5b",
      "#5d83b1",
      "#bd5b63",
      "#8d75ad",
      "#579583",
    ]);
    expect(literature.groups.map((group) => group.color)).toEqual([
      "#5d83b1",
      "#bd5b63",
      "#8d75ad",
    ]);
    expect([...history.groups, ...literature.groups].every((group) => group.symbol.length > 0)).toBe(
      true,
    );
    expect(EXPANDED_GROUP.color).toBe("#579583");
  });
});
