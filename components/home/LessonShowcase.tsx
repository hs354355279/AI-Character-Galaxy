"use client";

import Link from "next/link";
import { useRef } from "react";
import { canAnimateLanding, gsap, useGSAP } from "@/animations/landingMotion";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { OrbitArtwork } from "./OrbitArtwork";
import { ParallaxImage } from "./ParallaxImage";
import { SectionTitle } from "./SectionTitle";

export function LessonShowcase({ lessons }: { lessons: LandingLesson[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding()) return;

      const articles = gsap.utils.toArray<HTMLElement>(".lesson-exhibition");
      articles.forEach((article) => {
        const copy = article.querySelectorAll(
          ".lesson-meta, h3, .lesson-exhibition-copy > p, li, .lesson-actions",
        );
        gsap
          .timeline({
            scrollTrigger: { trigger: article, start: "top 78%", once: true },
          })
          .from(article, {
            clipPath: "inset(100% 0 0 0)",
            duration: 0.9,
            ease: "power3.inOut",
          })
          .from(
            copy,
            {
              opacity: 0,
              y: 28,
              duration: 0.55,
              stagger: 0.045,
              ease: "power3.out",
            },
            "-=0.4",
          );

        gsap.to(article.querySelectorAll(".orbit-overlay circle"), {
          y: (index) => (index === 0 ? -8 : 8),
          duration: 6,
          repeat: -1,
          yoyo: true,
          stagger: 0.4,
          ease: "sine.inOut",
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="official-lessons"
      className="lesson-exhibitions"
      aria-labelledby="lessons-title"
    >
      <header className="lesson-exhibitions-intro">
        <SectionTitle
          id="lessons-title"
          label="02 — Official lessons"
          title="Choose your first constellation."
        />
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
            <ParallaxImage
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
