import Image from "next/image";
import Link from "next/link";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";

export function CourseIndex({ lessons }: { lessons: LandingLesson[] }) {
  return (
    <main className="course-index-page">
      <SmoothScrollProvider />
      <ExhibitionHeader lessons={lessons} theme="paper" />
      <header className="course-index-hero">
        <p className="editorial-kicker">Course register · Evidence-grounded learning</p>
        <h1>Choose a universe<br />to enter.</h1>
        <p>Two complete journeys connect people, choices, conflict, and change to reviewed evidence.</p>
      </header>
      <section className="course-index-list" aria-label="Available courses">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className={`course-index-entry course-index-entry--${lesson.accent}`}
          >
            <div className="course-index-copy">
              <p className="course-index-meta">
                <span>{lesson.number}</span> {lesson.kind} · {lesson.estimatedMinutes} min
              </p>
              <h2>{lesson.title}</h2>
              <p>{lesson.subtitle}</p>
              <ol>
                {lesson.objectives.map((objective, index) => (
                  <li key={objective.id}><span>{index + 1}</span>{objective.title}</li>
                ))}
              </ol>
              <div className="course-index-actions">
                <Link
                  className="course-index-primary"
                  href={`/learn/${lesson.slug}`}
                  aria-label={`Enter ${lesson.title}`}
                >
                  Enter course <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  href={`/sources/${lesson.slug}`}
                  aria-label={`View sources for ${lesson.title}`}
                >
                  View sources
                </Link>
              </div>
            </div>
            <div className="course-index-art" aria-hidden="true">
              <Image
                src={lesson.image.src}
                width={lesson.image.width}
                height={lesson.image.height}
                sizes="(max-width: 900px) 92vw, 42vw"
                alt=""
              />
              <i />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
