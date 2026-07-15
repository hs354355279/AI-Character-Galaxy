import type { LessonPack } from "@/lib/lessons/schema";

export interface LandingLesson {
  id: string;
  slug: string;
  number: string;
  kind: LessonPack["kind"];
  estimatedMinutes: number;
  title: string;
  subtitle: string;
  objectives: Array<{ id: string; title: string }>;
  accent: "coral" | "violet";
  image: { src: string; width: number; height: number };
}

const artByKind: Record<LessonPack["kind"], Pick<LandingLesson, "accent" | "image">> = {
  history: {
    accent: "coral",
    image: {
      src: "/images/landing/lesson-french-revolution.png",
      width: 1122,
      height: 1402,
    },
  },
  literature: {
    accent: "violet",
    image: {
      src: "/images/landing/lesson-romeo-and-juliet.png",
      width: 1122,
      height: 1402,
    },
  },
};

export function createLandingLesson(lesson: LessonPack, index: number): LandingLesson {
  return {
    id: lesson.id,
    slug: lesson.slug,
    number: String(index + 1).padStart(2, "0"),
    kind: lesson.kind,
    estimatedMinutes: lesson.estimatedMinutes,
    title: lesson.title,
    subtitle: lesson.subtitle,
    objectives: lesson.objectives.slice(0, 3).map(({ id, title }) => ({ id, title })),
    ...artByKind[lesson.kind],
  };
}
