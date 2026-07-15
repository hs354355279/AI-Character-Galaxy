import { describe, expect, it } from "vitest";
import { createLenisOptions, getScrollMode } from "@/lib/motion/scroll-options";

describe("editorial scroll options", () => {
  it("keeps reduced-motion and touch-first experiences native", () => {
    expect(
      getScrollMode({ reducedMotion: true, coarsePointer: false, width: 1440 }),
    ).toBe("native");
    expect(
      getScrollMode({ reducedMotion: false, coarsePointer: true, width: 390 }),
    ).toBe("native");
  });

  it("uses bounded interpolation instead of a long duration", () => {
    const options = createLenisOptions();

    expect(options.lerp).toBeGreaterThanOrEqual(0.085);
    expect(options.lerp).toBeLessThanOrEqual(0.11);
    expect(options.duration).toBeUndefined();
    expect(options.smoothWheel).toBe(true);
    expect(options.wheelMultiplier).toBeLessThanOrEqual(1);
  });
});
