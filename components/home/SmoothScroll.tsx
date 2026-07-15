"use client";

import Lenis from "lenis";
import {
  canAnimateLanding,
  gsap,
  ScrollTrigger,
  useGSAP,
} from "@/animations/landingMotion";

export function SmoothScroll() {
  useGSAP(() => {
    if (!canAnimateLanding()) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.82,
    });
    const onScroll = () => ScrollTrigger.update();
    const update = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", onScroll);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return null;
}
