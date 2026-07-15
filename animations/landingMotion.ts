"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const LANDING_INTRO_SESSION_KEY = "acg-landing-intro-seen";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function canAnimateLanding(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.ResizeObserver !== "undefined" &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

export { gsap, ScrollTrigger, useGSAP };
