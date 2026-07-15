import { describe, expect, it } from "vitest";
import {
  createGalaxyLabelTransform,
  getGalaxyLabelOpacity,
  snapLabelCoordinate,
} from "@/lib/layout/galaxy-label";

describe("galaxy label projection", () => {
  it("snaps to half pixels and never scales text", () => {
    expect(snapLabelCoordinate(28.24)).toBe(28);
    expect(snapLabelCoordinate(28.26)).toBe(28.5);

    const transform = createGalaxyLabelTransform(28.26, 91.74);

    expect(transform).toBe("translate3d(28.5px, 91.5px, 0) translate(-50%, -50%)");
    expect(transform).not.toMatch(/scale/i);
  });

  it("uses distance only for bounded opacity", () => {
    expect(getGalaxyLabelOpacity(1)).toBe(1);
    expect(getGalaxyLabelOpacity(42)).toBe(0.56);
    expect(getGalaxyLabelOpacity(Number.NaN)).toBe(1);
  });
});
