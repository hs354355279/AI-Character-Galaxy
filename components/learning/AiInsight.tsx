"use client";

import { useState } from "react";

type InsightResponse = {
  source: "gpt-5.6" | "prepared";
  data: {
    explanation: string;
    sourceRefIds: string[];
    followUpPrompt: string;
  };
};

export function AiInsight({
  lessonId,
  characterId,
  relationshipId,
  sessionId,
}: {
  lessonId: string;
  characterId?: string;
  relationshipId?: string;
  sessionId: string;
}) {
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const explain = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/learning/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          characterId,
          relationshipId,
          purpose: "explanation",
          sessionId,
        }),
      });
      if (!response.ok) throw new Error("Explanation request failed.");
      setInsight((await response.json()) as InsightResponse);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="ai-insight" aria-label="Optional AI explanation">
      <div className="ai-insight-heading">
        <div>
          <p className="eyebrow">Optional learning lens</p>
          <strong>Source-constrained explanation</strong>
        </div>
        {!insight && (
          <button
            className="ai-action pressable"
            type="button"
            disabled={status === "loading"}
            onClick={explain}
          >
            {status === "loading" ? "Building explanation…" : "Explain with GPT-5.6"}
          </button>
        )}
      </div>
      {status === "error" && (
        <p className="ai-status" role="status">
          We could not add an AI explanation. The reviewed lesson evidence above is still complete.
        </p>
      )}
      {insight && (
        <div className="ai-insight-result" aria-live="polite">
          <span className="ai-source-label">
            {insight.source === "gpt-5.6" ? "GPT-5.6 · validated" : "Reviewed fallback"}
          </span>
          <p>{insight.data.explanation}</p>
          <small>Evidence IDs · {insight.data.sourceRefIds.join(", ")}</small>
          <strong>{insight.data.followUpPrompt}</strong>
        </div>
      )}
    </section>
  );
}
