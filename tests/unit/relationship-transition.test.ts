import { describe, expect, it } from "vitest";
import {
  advanceRelationshipPositions,
  createRelationshipPositionStore,
} from "@/lib/layout/relationship-transition";

describe("relationship-space transitions", () => {
  it("damps every current point toward its semantic target", () => {
    const positions = createRelationshipPositionStore(new Map([
      ["romeo", { x: 4, y: 0, z: 0 }],
    ]));
    const targets = new Map([
      ["romeo", { x: 0, y: 1, z: -2 }],
    ]);

    advanceRelationshipPositions(positions, targets, 1 / 60, false);

    expect(positions.get("romeo")!.x).toBeGreaterThan(0);
    expect(positions.get("romeo")!.x).toBeLessThan(4);
    expect(positions.get("romeo")!.y).toBeGreaterThan(0);
    expect(positions.get("romeo")!.z).toBeLessThan(0);
  });

  it("snaps to the semantic target when reduced motion is requested", () => {
    const positions = createRelationshipPositionStore(new Map([
      ["juliet", { x: -4, y: 2, z: 5 }],
    ]));
    const targets = new Map([
      ["juliet", { x: 0, y: 1, z: 2 }],
    ]);

    advanceRelationshipPositions(positions, targets, 1 / 60, true);

    expect(positions.get("juliet")!.toArray()).toEqual([0, 1, 2]);
  });
});
