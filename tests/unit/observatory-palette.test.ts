import { describe, expect, it } from "vitest";
import {
  getCourseObservatoryPalette,
  getMineralPlanetColors,
  MINERAL_GROUP_COLORS,
} from "@/lib/galaxy/observatory-palette";

describe("observatory palette", () => {
  it("uses a restrained mineral family for course and relationship accents", () => {
    expect(getCourseObservatoryPalette("french-revolution").accent).toBe("#bd5b63");
    expect(getCourseObservatoryPalette("romeo-and-juliet").accent).toBe("#8d75ad");
    expect(MINERAL_GROUP_COLORS).toEqual({
      monarchy: "#b79a5b",
      constitutional: "#5d83b1",
      radical: "#bd5b63",
      ideas: "#8d75ad",
      postRevolution: "#579583",
    });
  });

  it("derives cool stone highlights and lifted shadows from a group color", () => {
    expect(getMineralPlanetColors("#bd5b63")).toEqual({
      base: "#c1767d",
      highlight: "#caa3a7",
      shadow: "#8d4b56",
    });
  });
});
