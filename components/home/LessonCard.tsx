import Link from "next/link";
import type { LessonPack } from "@/lib/lessons/schema";

export function LessonCard({ lesson, number }: { lesson: LessonPack; number: number }) {
  const accent = lesson.kind === "history" ? "var(--history)" : "var(--literature)";
  return (
    <article className="lesson-card glass-material pressable" style={{ "--lesson-accent": accent } as React.CSSProperties}>
      <div className="lesson-card-topline">
        <span className="lesson-number" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        <span className="lesson-subject">{lesson.kind}</span>
        <span>{lesson.estimatedMinutes} min</span>
      </div>
      <div>
        <h3>{lesson.title}</h3>
        <p>{lesson.subtitle}</p>
      </div>
      <ul aria-label={`${lesson.title} learning objectives`}>
        {lesson.objectives.slice(0, 3).map((objective) => (
          <li key={objective.id}>{objective.title}</li>
        ))}
      </ul>
      <div className="lesson-card-actions">
        <Link className="primary-action pressable" href={`/learn/${lesson.slug}`}>
          Start exploration <span aria-hidden="true">↗</span>
        </Link>
        <Link className="source-link" href={`/sources/${lesson.slug}`}>
          View sources
        </Link>
      </div>
    </article>
  );
}
