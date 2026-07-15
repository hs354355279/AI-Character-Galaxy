"use client";

import { useRef } from "react";
import {
  canAnimateLanding,
  gsap,
  ScrollTrigger,
  useGSAP,
} from "@/animations/landingMotion";
import { SectionTitle } from "./SectionTitle";

const steps = [
  {
    number: "01",
    title: "Observe the galaxy",
    copy: "See people as a living map of roles, loyalties, and pressure.",
  },
  {
    number: "02",
    title: "Follow the evidence",
    copy: "Open every official relationship and trace it back to a source.",
  },
  {
    number: "03",
    title: "Explain what changed",
    copy: "Turn discoveries into a concise evidence-grounded explanation.",
  },
];

export function HorizontalJourney() {
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding() || !root.current || !viewport.current || !track.current) return;

      const media = gsap.matchMedia();
      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const distance = () =>
            Math.max(0, track.current!.scrollWidth - window.innerWidth);

          gsap.to(track.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: viewport.current,
              start: "top top",
              end: () => `+=${distance() + window.innerHeight}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        },
      );

      const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        window.cancelAnimationFrame(refreshFrame);
        media.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="method"
      className="journey-section"
      aria-labelledby="journey-title"
    >
      <div className="journey-intro">
        <SectionTitle
          id="journey-title"
          label="01 — Learning method"
          title="Read relationships in three movements."
        />
      </div>
      <div ref={viewport} className="journey-viewport">
        <div ref={track} className="journey-track">
          {steps.map((step) => (
            <article className="journey-panel" key={step.number}>
              <span className="journey-number" aria-hidden="true">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <span className="journey-rule" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
