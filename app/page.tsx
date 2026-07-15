import { LandingExperience } from "@/components/home/LandingExperience";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

export default function HomePage() {
  return <LandingExperience lessons={getAllLessonPacks().map(createLandingLesson)} />;
}
