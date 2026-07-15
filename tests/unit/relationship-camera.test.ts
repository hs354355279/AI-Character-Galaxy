import { describe, expect, it } from "vitest";
import { fitRelationshipCamera } from "@/lib/layout/relationship-camera";
import type { RelationshipSpacePoint } from "@/lib/layout/relationship-space";

describe("relationship camera frame", () => {
  it("returns a deterministic 40 degree frame bounded for orbit controls", () => {
    const points: RelationshipSpacePoint[] = [
      { x: 0, y: 0, z: 0, layer: "origin", degree: 0, radius: 0 },
      { x: -8, y: 5, z: 3, layer: "direct", degree: 1, radius: 9.2 },
      { x: 10, y: -7, z: -4, layer: "second-degree", degree: 2, radius: 13.2 },
      { x: 14, y: 2, z: 5, layer: "context", degree: null, radius: 15 },
    ];

    const first = fitRelationshipCamera(points, { aspect: 16 / 9 });
    const second = fitRelationshipCamera(points, { aspect: 16 / 9 });

    expect(first).toEqual(second);
    expect(first.fov).toBe(40);
    expect(first.distance).toBeGreaterThanOrEqual(first.minDistance);
    expect(first.distance).toBeLessThanOrEqual(first.maxDistance);
    expect(Number.isFinite(first.distance)).toBe(true);
  });

  it("falls back to a finite frame for an invalid aspect ratio", () => {
    const points: RelationshipSpacePoint[] = [
      { x: 0, y: 0, z: 0, layer: "origin", degree: 0, radius: 0 },
    ];

    expect(fitRelationshipCamera(points, { aspect: 0 })).toEqual({
      fov: 40,
      distance: 18,
      minDistance: 8,
      maxDistance: 34,
    });
  });
});
