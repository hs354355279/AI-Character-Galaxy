"use client";

import { useState } from "react";
import type { AssessmentAnswer } from "@/lib/session/learning-session";
import type { LearningSession } from "@/lib/session/learning-session";
import type { AssessmentQuestion, LessonPack } from "@/lib/lessons/schema";

export function AssessmentPanel({
  lesson,
  session,
  onFinish,
}: {
  lesson: LessonPack;
  session?: LearningSession;
  onFinish: (answers: AssessmentAnswer[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(lesson.preparedAssessment);
  const [generation, setGeneration] = useState<"idle" | "loading" | "error">("idle");
  const [generationSource, setGenerationSource] = useState<"gpt-5.6" | "prepared" | null>(null);

  const generateCheck = async () => {
    if (!session) return;
    setGeneration("loading");
    try {
      const response = await fetch("/api/learning/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          exploredCharacterIds: session.visitedCharacterIds,
          exploredRelationshipIds: session.visitedRelationshipIds,
          sessionId: `${lesson.id}:${session.startedAt}`,
        }),
      });
      if (!response.ok) throw new Error("Assessment request failed.");
      const result = (await response.json()) as {
        source: "gpt-5.6" | "prepared";
        data: { questions: AssessmentQuestion[] };
      };
      setQuestions(result.data.questions);
      setAnswers({});
      setGenerationSource(result.source);
      setGeneration("idle");
    } catch {
      setGeneration("error");
    }
  };

  const finish = () =>
    onFinish(
      questions.map((question) => ({
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
        {session && (
          <div className="enhancement-toolbar">
            <button className="ai-action pressable" type="button" disabled={generation === "loading"} onClick={generateCheck}>
              {generation === "loading" ? "Building your check…" : "Build a GPT-5.6 check"}
            </button>
            {generationSource && <span className="ai-source-label">{generationSource === "gpt-5.6" ? "GPT-5.6 · validated" : "Reviewed fallback"}</span>}
            {generation === "error" && <span className="generation-status" role="status">Prepared questions remain available.</span>}
          </div>
        )}
      </header>
      <div className="assessment-list">
        {questions.map((question, index) => (
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
