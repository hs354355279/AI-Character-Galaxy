import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningExperience } from "@/components/learning/LearningExperience";
import { getLessonPack } from "@/lib/lessons/repository";

type PageProps = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLessonPack((await params).lessonId);
  return { title: lesson?.title ?? "Lesson" };
}

export default async function LearnPage({ params }: PageProps) {
  const lesson = getLessonPack((await params).lessonId);
  if (!lesson) notFound();
  return <LearningExperience lesson={lesson} />;
}
