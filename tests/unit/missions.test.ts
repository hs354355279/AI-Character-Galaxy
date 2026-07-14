import { describe, expect, it } from "vitest";
import { getLessonPack } from "@/lib/lessons/repository";
import { evaluateMission } from "@/lib/missions/evaluate";

const french = getLessonPack("french-revolution")!;
const romeo = getLessonPack("romeo-and-juliet")!;

describe("evaluateMission", () => {
  it("completes an exact character discovery", () => {
    const mission = french.missions.find((item) => item.id === "find-jacobin-leader")!;
    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["robespierre"],
        selectedRelationshipIds: [],
        writtenResponse: "",
      }),
    ).toEqual({ complete: true, feedback: "Character discovered." });
  });

  it("requires every requested group member", () => {
    const mission = french.missions.find((item) => item.id === "identify-radical-group")!;
    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["robespierre", "danton"],
        selectedRelationshipIds: [],
        writtenResponse: "",
      }).complete,
    ).toBe(false);
  });

  it("completes a trace only when relationships are selected in order", () => {
    const mission = french.missions.find((item) => item.id === "trace-ideas-to-monarchy")!;
    const correct = ["rousseau-influences-robespierre", "robespierre-conflicts-louis"];

    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["rousseau", "robespierre", "louis-xvi"],
        selectedRelationshipIds: correct,
        writtenResponse: "",
      }),
    ).toEqual({ complete: true, feedback: "Path discovered." });

    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["rousseau", "robespierre", "louis-xvi"],
        selectedRelationshipIds: [...correct].reverse(),
        writtenResponse: "",
      }).complete,
    ).toBe(false);
  });

  it("requires both comparison subjects and a meaningful response", () => {
    const mission = romeo.missions.find((item) => item.id === "compare-romeo-juliet")!;
    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["romeo", "juliet"],
        selectedRelationshipIds: ["romeo-loves-juliet"],
        writtenResponse:
          "Romeo acts quickly after conflict, while Juliet weighs love against direct family pressure.",
      }).complete,
    ).toBe(true);
  });

  it("requires the relevant evidence relationship for cause and effect", () => {
    const mission = romeo.missions.find((item) => item.id === "explain-street-fight")!;
    expect(
      evaluateMission(mission, {
        selectedCharacterIds: ["romeo", "mercutio", "tybalt"],
        selectedRelationshipIds: [],
        writtenResponse:
          "Mercutio fights after Romeo refuses Tybalt, and his death causes Romeo to retaliate and be banished.",
      }).complete,
    ).toBe(false);
  });
});
