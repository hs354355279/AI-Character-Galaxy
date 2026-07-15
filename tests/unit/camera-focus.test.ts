import { describe, expect, it } from "vitest";
import {
  createCameraFocusTransition,
  sampleCameraFocusTransition,
} from "@/lib/layout/camera-focus";

describe("camera focus transition", () => {
  it("preserves the current viewing offset when focusing another planet", () => {
    const transition = createCameraFocusTransition(
      [2, 3, 18],
      [0, 1, 0],
      [-5, 4, 2],
    );

    expect(transition.toTarget).toEqual([-5, 4, 2]);
    expect(transition.toCamera).toEqual([-3, 6, 20]);
  });

  it("moves camera and controls target together without a discontinuity", () => {
    const transition = createCameraFocusTransition(
      [0, 1, 18],
      [0, 0, 0],
      [5, -3, 2],
    );

    expect(sampleCameraFocusTransition(transition, 0)).toEqual({
      camera: [0, 1, 18],
      target: [0, 0, 0],
    });

    const middle = sampleCameraFocusTransition(transition, 0.5);
    expect(middle.camera).toEqual([2.5, -0.5, 19]);
    expect(middle.target).toEqual([2.5, -1.5, 1]);

    expect(sampleCameraFocusTransition(transition, 1)).toEqual({
      camera: [5, -2, 20],
      target: [5, -3, 2],
    });
  });
});
