import { describe, expect, it } from "vitest";
import {
  classifyRelationshipProminence,
  createRelationshipSpace,
  scoreRelationship,
} from "@/lib/layout/relationship-space";
import { getLessonPack } from "@/lib/lessons/repository";

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
      expect(Math.hypot(point.x, point.y, point.z)).toBeLessThanOrEqual(12.5);
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

  it("classifies target, second-degree, and contextual relationship prominence", () => {
    const layout = createRelationshipSpace(romeo, "juliet");
    const romance = romeo.relationships.find((edge) => edge.id === "romeo-loves-juliet")!;
    const friendship = romeo.relationships.find((edge) => edge.id === "romeo-friends-mercutio")!;
    const turningPoint = romeo.relationships.find((edge) => edge.id === "tybalt-kills-mercutio")!;

    expect(classifyRelationshipProminence(romance, layout)).toBe("origin");
    expect(classifyRelationshipProminence(friendship, layout)).toBe("second-degree");
    expect(classifyRelationshipProminence(turningPoint, layout)).toBe("context");
  });
});
