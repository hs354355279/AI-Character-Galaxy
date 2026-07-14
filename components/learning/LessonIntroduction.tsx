"use client";

import type { LessonPack } from "@/lib/lessons/schema";
import { MaterialPanel } from "@/components/shared/MaterialPanel";

export function LessonIntroduction({ lesson, onStart }: { lesson: LessonPack; onStart: () => void }) {
  return (
    <div className="lesson-introduction">
      <div className="intro-lead">
        <p className="eyebrow">{lesson.kind} · Ages {lesson.targetAge.min}–{lesson.targetAge.max} · {lesson.estimatedMinutes} min</p>
        <h1 className="display-title">{lesson.title}</h1>
        <p className="body-copy">{lesson.overview}</p>
        <MaterialPanel className="essential-question">
          <span>Essential question</span>
          <strong>{lesson.essentialQuestion}</strong>
        </MaterialPanel>
      </div>
      <div className="intro-grid">
        <section aria-labelledby="learning-objectives-title">
          <h2 id="learning-objectives-title">Learning objectives</h2>
          <ol className="objective-list">
            {lesson.objectives.map((objective, index) => (
              <li key={objective.id}>
                <span>{index + 1}</span>
                <div><strong>{objective.title}</strong><p>{objective.description}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <MaterialPanel className="legend-card">
          <h2>How to read the galaxy</h2>
          <ul>
            <li><span className="legend-swatch legend-node" aria-hidden="true" /> Color and letter markers identify groups.</li>
            <li><span className="legend-swatch legend-solid" aria-hidden="true" /> Solid lines show established relationships.</li>
            <li><span className="legend-swatch legend-dashed" aria-hidden="true" /> Dashed lines show indirect or disputed links.</li>
            <li><span className="legend-swatch legend-arrow" aria-hidden="true">→</span> Arrows show the direction of influence.</li>
          </ul>
        </MaterialPanel>
      </div>
      <button className="primary-action pressable intro-start" type="button" onClick={onStart}>
        Start missions <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
