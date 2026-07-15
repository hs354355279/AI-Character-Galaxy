"use client";

import type { MissionEvaluation } from "@/lib/missions/evaluate";
import type { ExplorationMission } from "@/lib/lessons/schema";

export function MissionPanel({
  mission,
  position,
  total,
  hint,
  hintUsed,
  writtenResponse,
  evaluation,
  onHint,
  onResponseChange,
  onCheck,
  onContinue,
}: {
  mission: ExplorationMission;
  position: number;
  total: number;
  hint: string | null;
  hintUsed: boolean;
  writtenResponse: string;
  evaluation: MissionEvaluation | null;
  onHint: () => void;
  onResponseChange: (value: string) => void;
  onCheck: () => void;
  onContinue: () => void;
}) {
  const needsResponse = ["compare-characters", "explain-relationship", "cause-and-effect"].includes(
    mission.completionRule.kind,
  );
  return (
    <div className="mission-content">
      <div className="mission-progress-row">
        <p className="eyebrow">Mission {position} of {total}</p>
        <span>{mission.type.replaceAll("_", " ")}</span>
      </div>
      <ol className="mission-progress-track" aria-label={`${position} of ${total} missions`}>
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const state = step < position ? "complete" : step === position ? "current" : "upcoming";
          return <li key={step} data-state={state}><span>{String(step).padStart(2, "0")}</span></li>;
        })}
      </ol>
      <h2>{mission.title}</h2>
      <p>{mission.prompt}</p>
      {needsResponse && (
        <label className="mission-response">
          <span>Your evidence-based explanation</span>
          <textarea value={writtenResponse} onChange={(event) => onResponseChange(event.target.value)} placeholder="Use a character, relationship, and consequence…" />
        </label>
      )}
      {hint && <div className="mission-hint" role="note"><strong>Hint</strong><p>{hint}</p></div>}
      {evaluation && (
        <div className={`mission-feedback ${evaluation.complete ? "is-complete" : ""}`} role="status">
          <strong>{evaluation.complete ? "Mission complete" : "Not yet"}</strong>
          <span>{evaluation.feedback}</span>
        </div>
      )}
      <div className="mission-actions">
        <button className="secondary-action pressable" type="button" onClick={onHint} disabled={hintUsed}>
          {hintUsed ? "Hint revealed" : "Reveal hint"}
        </button>
        {evaluation?.complete ? (
          <button className="primary-action pressable" type="button" onClick={onContinue}>Continue →</button>
        ) : (
          <button className="primary-action pressable" type="button" onClick={onCheck}>Check mission</button>
        )}
      </div>
    </div>
  );
}
