"use client";

import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { EvidenceManifesto } from "./EvidenceManifesto";
import { Hero } from "./Hero";
import { HorizontalJourney } from "./HorizontalJourney";
import { LessonShowcase } from "./LessonShowcase";

export function LandingExperience({ lessons }: { lessons: LandingLesson[] }) {
  return (
    <main id="top" className="home-page">
      <Hero />
      <HorizontalJourney />
      <LessonShowcase lessons={lessons} />
      <EvidenceManifesto />
    </main>
  );
}
