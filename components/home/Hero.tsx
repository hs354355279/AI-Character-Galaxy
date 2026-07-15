"use client";

import Image from "next/image";
import { useRef } from "react";
import { canAnimateLanding, gsap, useGSAP } from "@/animations/landingMotion";

const titleLines = ["Every person", "has a universe", "of relationships."];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding()) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" }, delay: 0.12 })
        .from(".landing-eyebrow", { opacity: 0, y: 18, duration: 0.45 })
        .from(
          ".hero-title-line",
          { opacity: 0, y: 42, duration: 0.8, stagger: 0.09 },
          "-=0.2",
        )
        .from(
          ".hero-support, .scroll-cue",
          { opacity: 0, y: 20, duration: 0.5, stagger: 0.08 },
          "-=0.35",
        )
        .fromTo(
          ".hero-art",
          { opacity: 0, scale: 1.08 },
          { opacity: 1, scale: 1, duration: 1.8 },
          0,
        );
    },
    { scope: root },
  );

  return (
    <header ref={root} className="editorial-hero" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <Image
          src="/images/landing/hero-orbital-exhibition.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-editorial-copy">
        <p className="landing-eyebrow">Evidence-grounded learning · Ages 12–15</p>
        <h1 id="hero-title" className="editorial-display" aria-label={titleLines.join(" ")}>
          {titleLines.map((line) => (
            <span className="hero-title-line" aria-hidden="true" key={line}>
              {line}
            </span>
          ))}
        </h1>
        <div className="hero-support">
          <p>Explore why relationships mattered.</p>
          <a className="editorial-link" href="#official-lessons">
            Browse lessons <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>
      <a className="scroll-cue" href="#method">
        <span>Scroll to enter</span>
        <i aria-hidden="true" />
      </a>
    </header>
  );
}
