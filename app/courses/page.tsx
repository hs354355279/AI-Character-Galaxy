import type { Metadata } from "next";
import { CourseIndex } from "@/components/courses/CourseIndex";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

export const metadata: Metadata = {
  title: "Courses · AI Character Galaxy",
  description: "Choose an evidence-grounded history or literature relationship journey.",
};

export default function CoursesPage() {
  return <CourseIndex lessons={getAllLessonPacks().map(createLandingLesson)} />;
}
