"use client";

import Lenis from "lenis";
import { useEffect, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/animations/landingMotion";
import { createLenisOptions, getScrollMode } from "@/lib/motion/scroll-options";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

function canUseLenis(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.ResizeObserver !== "undefined" &&
    getScrollMode({
      reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
      coarsePointer: window.matchMedia(COARSE_POINTER_QUERY).matches,
      width: window.innerWidth,
    }) === "lenis"
  );
}

export function SmoothScrollProvider() {
  const [enabled, setEnabled] = useState(canUseLenis);

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const coarsePointer = window.matchMedia(COARSE_POINTER_QUERY);
    const updateMode = () => setEnabled(canUseLenis());

    window.addEventListener("resize", updateMode, { passive: true });
    reducedMotion.addEventListener("change", updateMode);
    coarsePointer.addEventListener("change", updateMode);

    return () => {
      window.removeEventListener("resize", updateMode);
      reducedMotion.removeEventListener("change", updateMode);
      coarsePointer.removeEventListener("change", updateMode);
    };
  }, []);

  useGSAP(
    () => {
      if (!enabled) {
        delete document.documentElement.dataset.lenisActive;
        return;
      }

      const lenis = new Lenis(createLenisOptions());
      const onScroll = () => ScrollTrigger.update();
      const update = (time: number) => lenis.raf(time * 1000);

      document.documentElement.dataset.lenisActive = "true";
      lenis.on("scroll", onScroll);
      gsap.ticker.add(update);

      return () => {
        lenis.off("scroll", onScroll);
        gsap.ticker.remove(update);
        lenis.destroy();
        delete document.documentElement.dataset.lenisActive;
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );

  return null;
}
