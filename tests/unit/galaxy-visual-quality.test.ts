import { describe, expect, it } from "vitest";
import {
  createParticlePositions,
  getGalaxyQuality,
} from "@/lib/galaxy/visual-quality";

describe("galaxy visual quality", () => {
  it("caps mobile and desktop pixel density with fixed particle budgets", () => {
    expect(getGalaxyQuality({ width: 390, devicePixelRatio: 3, reducedMotion: false }))
      .toMatchObject({ dpr: 1.15, animate: true });
    expect(getGalaxyQuality({ width: 1440, devicePixelRatio: 2, reducedMotion: false }))
      .toMatchObject({ dpr: 1.35, starCount: 520 });
    expect(getGalaxyQuality({ width: 1440, devicePixelRatio: 2, reducedMotion: true }))
      .toMatchObject({ animate: false, dustCount: 90 });
  });

  it("creates deterministic seeded particle positions", () => {
    expect([...createParticlePositions(6, 1789, 8, 2)])
      .toEqual([...createParticlePositions(6, 1789, 8, 2)]);
    expect(createParticlePositions(6, 1789, 8, 2)).toHaveLength(18);
  });
});
