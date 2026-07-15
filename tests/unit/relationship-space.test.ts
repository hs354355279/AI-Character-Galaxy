import { describe, expect, it } from "vitest";
import {
  classifyRelationshipProminence,
  createRelationshipSpace,
  scoreRelationship,
} from "@/lib/layout/relationship-space";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  createEmptyExpansionState,
  createRuntimeRelationshipGraph,
  mergeExpansionBatch,
} from "@/lib/network-expansion/runtime-graph";
import type { NetworkExpansionBatch } from "@/lib/network-expansion/schemas";

const romeo = getLessonPack("romeo-and-juliet")!;
const revolution = getLessonPack("french-revolution")!;

describe("semantic relationship space", () => {
  it("places the selected target at the origin deterministically", () => {
    const first = createRelationshipSpace(romeo, "romeo");
    const second = createRelationshipSpace(romeo, "romeo");

    expect(first.points.get("romeo")).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
      layer: "origin",
      degree: 0,
      radius: 0,
    });
    expect([...first.points]).toEqual([...second.points]);
  });

  it("keeps strong direct relations closer than weak and second-degree relations", () => {
    const layout = createRelationshipSpace(romeo, "juliet");

    expect(layout.points.get("romeo")!.radius).toBeLessThan(
      layout.points.get("paris")!.radius,
    );
    expect(layout.points.get("romeo")!.radius).toBeLessThan(
      layout.points.get("mercutio")!.radius,
    );
    expect(layout.points.get("mercutio")!.layer).toBe("second-degree");
  });

  it("maps love above conflict and private bonds in front of political rivalry", () => {
    const romance = romeo.relationships.find((edge) => edge.id === "romeo-loves-juliet")!;
    const conflict = romeo.relationships.find((edge) => edge.id === "tybalt-challenges-romeo")!;
    const rivalry = revolution.relationships.find((edge) => edge.id === "lafayette-conflicts-radicals")!;

    expect(scoreRelationship(romance, "romeo").valence).toBeGreaterThan(0);
    expect(scoreRelationship(conflict, "romeo").valence).toBeLessThan(0);
    expect(scoreRelationship(romance, "romeo").context).toBeGreaterThan(
      scoreRelationship(rivalry, "robespierre").context,
    );
  });

  it("places incoming and outgoing directed relationships on opposite X sides", () => {
    const influence = revolution.relationships.find(
      (edge) => edge.id === "rousseau-influences-robespierre",
    )!;

    expect(scoreRelationship(influence, "rousseau").direction).toBeGreaterThan(0);
    expect(scoreRelationship(influence, "robespierre").direction).toBeLessThan(0);
  });

  it("keeps every person finite, separated, and inside the teaching field", () => {
    const layout = createRelationshipSpace(romeo, "romeo");
    const points = [...layout.points.values()];

    expect(points).toHaveLength(romeo.characters.length);
    for (const point of points) {
      expect(Number.isFinite(point.x + point.y + point.z)).toBe(true);
      expect(Math.hypot(point.x, point.y, point.z)).toBeLessThanOrEqual(15.51);
    }
    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        expect(
          Math.hypot(
            points[first].x - points[second].x,
            points[first].y - points[second].y,
            points[first].z - points[second].z,
          ),
        ).toBeGreaterThan(0.9);
      }
    }
  });

  it("places every official lesson in separated semantic shells", () => {
    const shells = {
      origin: { min: 0, max: 0 },
      direct: { min: 6.8, max: 9.2 },
      "second-degree": { min: 10.2, max: 13.2 },
      context: { min: 13.5, max: 15.5 },
    } as const;

    for (const lesson of [romeo, revolution]) {
      for (const target of lesson.characters) {
        const layout = createRelationshipSpace(lesson, target.id);
        const nonOrigin = [...layout.points.values()].filter(
          (point) => point.layer !== "origin",
        );

        for (const point of nonOrigin) {
          const shell = shells[point.layer];
          expect(point.radius).toBeGreaterThanOrEqual(shell.min);
          expect(point.radius).toBeLessThanOrEqual(shell.max);
          expect(Math.abs(point.z)).toBeLessThan(15.5);
        }

        for (let first = 0; first < nonOrigin.length; first += 1) {
          for (let second = first + 1; second < nonOrigin.length; second += 1) {
            expect(
              Math.hypot(
                nonOrigin[first].x - nonOrigin[second].x,
                nonOrigin[first].y - nonOrigin[second].y,
                nonOrigin[first].z - nonOrigin[second].z,
              ),
            ).toBeGreaterThanOrEqual(2.2);
          }
        }
      }
    }
  });

  it("classifies target, second-degree, and contextual relationship prominence", () => {
    const layout = createRelationshipSpace(romeo, "juliet");
    const romance = romeo.relationships.find((edge) => edge.id === "romeo-loves-juliet")!;
    const friendship = romeo.relationships.find((edge) => edge.id === "romeo-friends-mercutio")!;
    const turningPoint = romeo.relationships.find((edge) => edge.id === "tybalt-kills-mercutio")!;

    expect(classifyRelationshipProminence(romance, layout)).toBe("origin");
    expect(classifyRelationshipProminence(friendship, layout)).toBe("second-degree");
    expect(classifyRelationshipProminence(turningPoint, layout)).toBe("context");
  });

  it("places a newly expanded person deterministically on the focus person's direct shell", () => {
    const batch: NetworkExpansionBatch = {
      focusCharacterId: "olympe-de-gouges",
      characters: [{
        id: "ai-mary-wollstonecraft",
        name: "Mary Wollstonecraft",
        aliases: [],
        role: "Writer and political philosopher",
        summary: "Mary Wollstonecraft argued that women deserved education and recognition as rational citizens.",
        groupId: "ai-expanded-network",
        importance: 3,
        sourceRefIds: ["source-wollstonecraft"],
        learningTags: ["rights"],
        provenance: "ai-expanded",
        citationIds: ["source-wollstonecraft"],
      }],
      relationships: [{
        id: "ai-olympe-de-gouges-ai-mary-wollstonecraft-influence",
        fromCharacterId: "olympe-de-gouges",
        toCharacterId: "ai-mary-wollstonecraft",
        type: "influence",
        direction: "undirected",
        strength: 4,
        summary: "Their published arguments joined a wider debate about women's political rights.",
        evidenceSummary: "Published texts and scholarship document their related interventions in revolutionary rights debates.",
        sourceRefIds: ["source-wollstonecraft"],
        confidence: 0.86,
        isDisputed: false,
        learningTags: ["rights"],
        provenance: "ai-expanded",
        citationIds: ["source-wollstonecraft"],
      }],
      citations: [{ id: "source-wollstonecraft", title: "Biography", url: "https://example.org/wollstonecraft" }],
      generatedAt: "2026-07-16T00:00:00.000Z",
    };
    const state = mergeExpansionBatch(
      revolution,
      createEmptyExpansionState(revolution.id),
      batch,
    );
    const graph = createRuntimeRelationshipGraph(revolution, state);

    const first = createRelationshipSpace(graph, "olympe-de-gouges");
    const second = createRelationshipSpace(graph, "olympe-de-gouges");

    expect(first.points.get("olympe-de-gouges")).toMatchObject({ x: 0, y: 0, z: 0 });
    expect(first.points.get("ai-mary-wollstonecraft")).toMatchObject({ layer: "direct", degree: 1 });
    expect(first.points.get("ai-mary-wollstonecraft")).toEqual(
      second.points.get("ai-mary-wollstonecraft"),
    );
  });
});
