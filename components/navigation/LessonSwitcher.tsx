import Link from "next/link";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";

export function LessonSwitcher({
  lessons,
  currentLessonId,
}: {
  lessons: LandingLesson[];
  currentLessonId?: string;
}) {
  return (
    <details className="lesson-switcher">
      <summary>Enter a course</summary>
      <div className="lesson-switcher-panel">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/learn/${lesson.slug}`}
            aria-current={currentLessonId === lesson.id ? "page" : undefined}
          >
            <span>{lesson.number}</span>
            <strong>{lesson.title}</strong>
            <small>{lesson.kind} · {lesson.estimatedMinutes} min</small>
          </Link>
        ))}
      </div>
    </details>
  );
}
