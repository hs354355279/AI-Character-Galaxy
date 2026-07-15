"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import type { LessonPack } from "@/lib/lessons/schema";
import { getAllLessonPacks } from "@/lib/lessons/repository";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";

const lessons = getAllLessonPacks().map(createLandingLesson);

export function LessonIntroduction({ lesson, onStart }: { lesson: LessonPack; onStart: () => void }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [titleLead, titleTail] = lesson.title.split(": ");

  return (
    <div className={`lesson-introduction lesson-introduction--${lesson.kind}`}>
      <SmoothScrollProvider />
      <ExhibitionHeader lessons={lessons} currentLessonId={lesson.id} theme="space" />
      <section className="lesson-intro-hero">
        <div className="lesson-intro-art" aria-hidden="true">
          <Image
            src="/images/learning/course-observatory-hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <span className="lesson-intro-orbit lesson-intro-orbit--one" />
          <span className="lesson-intro-orbit lesson-intro-orbit--two" />
        </div>
        <motion.div
          className="intro-lead"
          initial={reduceMotion ? false : { opacity: 0, y: 38 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">{lesson.kind} · Ages {lesson.targetAge.min}–{lesson.targetAge.max} · {lesson.estimatedMinutes} min</p>
          <h1 className="display-title">
            <span>{titleLead}</span>
            {titleTail ? <span>{titleTail}</span> : null}
          </h1>
          <p className="body-copy">{lesson.overview}</p>
          <button className="intro-enter" type="button" onClick={onStart}>
            Enter the observatory <span aria-hidden="true">↘</span>
          </button>
        </motion.div>
        <div className="intro-scroll-cue" aria-hidden="true"><span>Scroll to orient</span><i /></div>
      </section>

      <section className="essential-question" aria-labelledby="essential-question-title">
        <p>01 · Essential question</p>
        <h2 id="essential-question-title">{lesson.essentialQuestion}</h2>
        <span>Hold this question while you move through the network.</span>
      </section>

      <section className="intro-grid">
        <div aria-labelledby="learning-objectives-title">
          <p className="intro-chapter">02 · Learning path</p>
          <h2 id="learning-objectives-title">Learning objectives</h2>
          <ol className="objective-list">
            {lesson.objectives.map((objective, index) => (
              <li key={objective.id}>
                <span>{index + 1}</span>
                <div><strong>{objective.title}</strong><p>{objective.description}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <aside className="legend-card">
          <p className="intro-chapter">03 · Reading system</p>
          <h2>How to read the galaxy</h2>
          <ul>
            <li><span className="legend-swatch legend-node" aria-hidden="true" /> Color and letter markers identify groups.</li>
            <li><span className="legend-swatch legend-solid" aria-hidden="true" /> Solid lines show established relationships.</li>
            <li><span className="legend-swatch legend-dashed" aria-hidden="true" /> Dashed lines show indirect or disputed links.</li>
            <li><span className="legend-swatch legend-arrow" aria-hidden="true">→</span> Arrows show the direction of influence.</li>
          </ul>
        </aside>
      </section>

      <section className="intro-threshold">
        <p>Ready to map people, choices, and consequences?</p>
        <button type="button" onClick={onStart}>Begin the first mission <span aria-hidden="true">↗</span></button>
      </section>
    </div>
  );
}
