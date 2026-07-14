"use client";

import { useState } from "react";
import type { AssessmentAnswer } from "@/lib/session/learning-session";
import type { LessonPack } from "@/lib/lessons/schema";

export function AssessmentPanel({
  lesson,
  onFinish,
}: {
  lesson: LessonPack;
  onFinish: (answers: AssessmentAnswer[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const finish = () =>
    onFinish(
      lesson.preparedAssessment.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] ?? "",
        isCorrect:
          question.correctOptionIndex === undefined
            ? undefined
            : question.options?.[question.correctOptionIndex] === answers[question.id],
      })),
    );
  return (
    <section className="assessment-panel site-shell" aria-labelledby="assessment-title">
      <header>
        <p className="eyebrow">Prepared offline check · 5 prompts</p>
        <h1 id="assessment-title" className="display-title">Check your relationship model.</h1>
        <p className="body-copy">These questions use only reviewed lesson evidence. Your answers stay in this browser session.</p>
      </header>
      <div className="assessment-list">
        {lesson.preparedAssessment.map((question, index) => (
          <fieldset className="assessment-question glass-material" key={question.id}>
            <legend><span>{index + 1}</span>{question.prompt}</legend>
            {question.options ? (
              <div className="assessment-options">
                {question.options.map((option) => (
                  <label key={option}>
                    <input type="radio" name={question.id} value={option} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea aria-label={`Answer question ${index + 1}`} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Explain with one relationship from the lesson…" />
            )}
          </fieldset>
        ))}
      </div>
      <button className="primary-action pressable" type="button" onClick={finish}>
        Finish and see discoveries <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
