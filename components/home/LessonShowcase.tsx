import Image from "next/image";
import Link from "next/link";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { OrbitArtwork } from "./OrbitArtwork";

export function LessonShowcase({ lessons }: { lessons: LandingLesson[] }) {
  return (
    <section
      id="official-lessons"
      className="lesson-exhibitions"
      aria-labelledby="lessons-title"
    >
      <header className="lesson-exhibitions-intro">
        <p className="landing-eyebrow">02 — Official lessons</p>
        <h2 id="lessons-title">Choose your first constellation.</h2>
        <p>No account. No open-ended chat. Every relationship connects to evidence.</p>
      </header>
      {lessons.map((lesson) => (
        <article
          className={`lesson-exhibition lesson-exhibition--${lesson.accent}`}
          key={lesson.id}
        >
          <div className="lesson-exhibition-copy">
            <div className="lesson-meta">
              <span>{lesson.number}</span>
              <span>{lesson.kind}</span>
              <span>{lesson.estimatedMinutes} min</span>
            </div>
            <h3>{lesson.title}</h3>
            <p>{lesson.subtitle}</p>
            <ul aria-label={`${lesson.title} learning objectives`}>
              {lesson.objectives.map((objective) => (
                <li key={objective.id}>{objective.title}</li>
              ))}
            </ul>
            <div className="lesson-actions">
              <Link className="lesson-primary-link" href={`/learn/${lesson.slug}`}>
                Start exploration <span aria-hidden="true">↗</span>
              </Link>
              <Link className="lesson-source-link" href={`/sources/${lesson.slug}`}>
                View sources
              </Link>
            </div>
          </div>
          <div className="lesson-exhibition-art" aria-hidden="true">
            <Image
              src={lesson.image.src}
              alt=""
              width={lesson.image.width}
              height={lesson.image.height}
              sizes="(max-width: 767px) 100vw, (max-width: 1199px) 55vw, 48vw"
            />
            <OrbitArtwork accent={lesson.accent} />
          </div>
        </article>
      ))}
    </section>
  );
}
