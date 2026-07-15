import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningExperience } from "@/components/learning/LearningExperience";
import { getLessonPack } from "@/lib/lessons/repository";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ focus?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLessonPack((await params).lessonId);
  return { title: lesson?.title ?? "Lesson" };
}

export default async function LearnPage({ params, searchParams }: PageProps) {
  const lesson = getLessonPack((await params).lessonId);
  if (!lesson) notFound();
  const focus = (await searchParams).focus;
  const initialFocusCharacterId = lesson.characters.some((character) => character.id === focus)
    ? focus
    : undefined;
  return <LearningExperience lesson={lesson} initialFocusCharacterId={initialFocusCharacterId} />;
}
