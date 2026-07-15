import type { LenisOptions } from "lenis";

export interface ScrollEnvironment {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
}

export function getScrollMode({
  reducedMotion,
  coarsePointer,
  width,
}: ScrollEnvironment): "native" | "lenis" {
  return reducedMotion || coarsePointer || width < 768 ? "native" : "lenis";
}

export function createLenisOptions(): LenisOptions {
  return {
    lerp: 0.095,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    syncTouch: false,
  };
}
