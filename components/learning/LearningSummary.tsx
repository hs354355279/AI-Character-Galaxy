"use client";

import Link from "next/link";
import { useState } from "react";
import type { LessonPack } from "@/lib/lessons/schema";
import type { LearningSession } from "@/lib/session/learning-session";

export function LearningSummary({ lesson, session }: { lesson: LessonPack; session: LearningSession }) {
  const [generation, setGeneration] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<{
    source: "gpt-5.6" | "prepared";
    data: {
      summary: string;
      keyCharacterIds: string[];
      relationshipPathIds: string[];
      concepts: string[];
      followUpQuestion: string;
    };
  } | null>(null);

  const generateSummary = async () => {
    setGeneration("loading");
    try {
      const response = await fetch("/api/learning/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          visitedCharacterIds: session.visitedCharacterIds,
          visitedRelationshipIds: session.visitedRelationshipIds,
          completedMissionIds: session.completedMissionIds,
          sessionId: `${lesson.id}:${session.startedAt}`,
        }),
      });
      if (!response.ok) throw new Error("Summary request failed.");
      setResult(await response.json());
      setGeneration("idle");
    } catch {
      setGeneration("error");
    }
  };

  return (
    <section className="learning-summary site-shell">
      <header>
        <p className="eyebrow">Lesson complete</p>
        <h1 className="display-title">My Relationship Discoveries</h1>
        <p className="body-copy">A private, session-only snapshot of the connections you explored.</p>
        <div className="enhancement-toolbar">
          <button className="ai-action pressable" type="button" disabled={generation === "loading"} onClick={generateSummary}>
            {generation === "loading" ? "Creating your summary…" : "Create GPT-5.6 summary"}
          </button>
          {result && <span className="ai-source-label">{result.source === "gpt-5.6" ? "GPT-5.6 · validated" : "Reviewed fallback"}</span>}
          {generation === "error" && <span className="generation-status" role="status">Your reviewed summary remains available.</span>}
        </div>
      </header>
      <div className="summary-metrics">
        <div><strong>{session.visitedCharacterIds.length}</strong><span>characters visited</span></div>
        <div><strong>{session.visitedRelationshipIds.length}</strong><span>relationships opened</span></div>
        <div><strong>{session.completedMissionIds.length}</strong><span>missions completed</span></div>
      </div>
      <div className="summary-grid">
        <div className="glass-material summary-card">
          <h2>What you discovered</h2>
          {result ? (
            <div className="generated-summary"><p>{result.data.summary}</p><div className="tag-list summary-concepts">{result.data.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div></div>
          ) : (
            <ul>{lesson.preparedSummary.map((item) => <li key={item}>{item}</li>)}</ul>
          )}
        </div>
        <div className="glass-material summary-card"><p className="eyebrow">Continue thinking</p><h2>{result?.data.followUpQuestion ?? lesson.discussionQuestions[0]}</h2><p>Try explaining your answer to a classmate using one person and one relationship as evidence.</p></div>
      </div>
      <div className="summary-actions"><Link className="primary-action pressable" href="/">Explore another lesson</Link><Link className="secondary-action pressable" href={`/sources/${lesson.slug}`}>Review sources</Link></div>
    </section>
  );
}
