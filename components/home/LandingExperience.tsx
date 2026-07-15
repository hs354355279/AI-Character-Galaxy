"use client";

import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { EvidenceManifesto } from "./EvidenceManifesto";
import { ExhibitionNav } from "./ExhibitionNav";
import { Hero } from "./Hero";
import { HorizontalJourney } from "./HorizontalJourney";
import { LessonShowcase } from "./LessonShowcase";
import { LoadingScreen } from "./LoadingScreen";

export function LandingExperience({ lessons }: { lessons: LandingLesson[] }) {
  return (
    <main id="top" className="home-page">
      <LoadingScreen />
      <ExhibitionNav />
      <Hero />
      <HorizontalJourney />
      <LessonShowcase lessons={lessons} />
      <EvidenceManifesto />
    </main>
  );
}
