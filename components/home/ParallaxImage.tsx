"use client";

import Image, { type ImageProps } from "next/image";
import { useRef } from "react";
import { canAnimateLanding, gsap, useGSAP } from "@/animations/landingMotion";

export function ParallaxImage(props: ImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding() || !image.current) return;
      gsap.fromTo(
        image.current,
        { scale: 1.1, y: 54 },
        {
          scale: 1,
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="parallax-image">
      <Image {...props} ref={image} />
    </div>
  );
}
