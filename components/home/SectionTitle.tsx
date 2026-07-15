"use client";

import { useRef } from "react";
import { canAnimateLanding, gsap, useGSAP } from "@/animations/landingMotion";

export function SectionTitle({
  id,
  label,
  title,
}: {
  id: string;
  label: string;
  title: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding()) return;
      gsap.from(".section-title-word", {
        opacity: 0,
        y: 46,
        duration: 0.75,
        stagger: 0.045,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="editorial-section-title">
      <p className="landing-eyebrow">{label}</p>
      <h2 id={id} aria-label={title}>
        {title.split(" ").map((word, index) => (
          <span className="section-title-word" aria-hidden="true" key={`${word}-${index}`}>
            {word}&nbsp;
          </span>
        ))}
      </h2>
    </div>
  );
}
