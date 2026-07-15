"use client";

import { useEffect, useRef, useState } from "react";
import {
  canAnimateLanding,
  gsap,
  LANDING_INTRO_SESSION_KEY,
  useGSAP,
} from "@/animations/landingMotion";

type CurtainState = "pending" | "playing" | "done";

export function LoadingScreen() {
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CurtainState>("pending");

  useEffect(() => {
    const shouldPlay =
      canAnimateLanding() && !sessionStorage.getItem(LANDING_INTRO_SESSION_KEY);
    if (shouldPlay) sessionStorage.setItem(LANDING_INTRO_SESSION_KEY, "1");

    const frame = window.requestAnimationFrame(() => {
      setState(shouldPlay ? "playing" : "done");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useGSAP(
    () => {
      if (state !== "playing" || !root.current) return;

      gsap
        .timeline({ onComplete: () => setState("done") })
        .fromTo(
          ".loading-wordmark span",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.035, duration: 0.28 },
        )
        .fromTo(
          ".loading-orbit",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.28 },
          "<",
        )
        .to(root.current, { yPercent: -102, duration: 0.58, ease: "power3.inOut" });
    },
    { scope: root, dependencies: [state] },
  );

  if (state === "done") return null;

  return (
    <div ref={root} className="loading-screen" aria-hidden="true" data-state={state}>
      <div className="loading-wordmark">
        {"AI Character Galaxy".split("").map((character, index) => (
          <span key={`${character}-${index}`}>
            {character === " " ? "\u00a0" : character}
          </span>
        ))}
      </div>
      <i className="loading-orbit" />
    </div>
  );
}
