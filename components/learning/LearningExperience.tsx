"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { RelationshipListView } from "@/components/accessibility/RelationshipListView";
import { detectWebGL } from "@/components/accessibility/WebGLBoundary";
import { GalaxyScene } from "@/components/galaxy/GalaxyScene";
import { BrandMark } from "@/components/shared/BrandMark";
import { AssessmentPanel } from "@/components/learning/AssessmentPanel";
import { EvidencePanel } from "@/components/learning/EvidencePanel";
import { LearningSummary } from "@/components/learning/LearningSummary";
import { LessonIntroduction } from "@/components/learning/LessonIntroduction";
import { MissionPanel } from "@/components/learning/MissionPanel";
import { evaluateMission, type MissionEvaluation } from "@/lib/missions/evaluate";
import type { LessonPack } from "@/lib/lessons/schema";
import {
  createLearningSession,
  saveLearningSession,
  updateLearningSession,
  type AssessmentAnswer,
  type LearningSession,
} from "@/lib/session/learning-session";

type ViewMode = "2d" | "3d";
type Phase = "intro" | "explore" | "assessment" | "summary";

export function LearningExperience({
  lesson,
  initialView = "3d",
  initialSession,
  webglAvailable,
}: {
  lesson: LessonPack;
  initialView?: ViewMode;
  initialSession?: LearningSession;
  webglAvailable?: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const available = useMemo(
    () => webglAvailable ?? detectWebGL(),
    [webglAvailable],
  );
  const [phase, setPhase] = useState<Phase>(initialSession ? "explore" : "intro");
  const [view, setView] = useState<ViewMode>(initialView === "3d" && !available ? "2d" : initialView);
  const [session, setSession] = useState<LearningSession>(
    initialSession ?? createLearningSession(lesson.id),
  );
  const firstIncomplete = Math.max(
    0,
    lesson.missions.findIndex((mission) => !session.completedMissionIds.includes(mission.id)),
  );
  const [missionIndex, setMissionIndex] = useState(firstIncomplete);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState<string[]>([]);
  const [focusedCharacterId, setFocusedCharacterId] = useState<string | null>(null);
  const [focusedRelationshipId, setFocusedRelationshipId] = useState<string | null>(null);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [evaluation, setEvaluation] = useState<MissionEvaluation | null>(null);
  const [visibleHint, setVisibleHint] = useState<string | null>(null);

  const mission = lesson.missions[missionIndex];
  const allComplete = lesson.missions.every((item) => session.completedMissionIds.includes(item.id));
  const hintId = `${mission?.id ?? "none"}:0`;

  useEffect(() => {
    if (typeof window !== "undefined") saveLearningSession(session, window.sessionStorage);
  }, [session]);

  const selectCharacter = (id: string) => {
    setFocusedCharacterId(id);
    setFocusedRelationshipId(null);
    setSelectedCharacterIds((current) => [...new Set([...current, id])]);
    setSession((current) => updateLearningSession(current, { visitedCharacterIds: [...current.visitedCharacterIds, id] }));
    setEvaluation(null);
  };

  const selectRelationship = (id: string) => {
    setFocusedRelationshipId(id);
    setFocusedCharacterId(null);
    setSelectedRelationshipIds((current) => [...new Set([...current, id])]);
    setSession((current) => updateLearningSession(current, { visitedRelationshipIds: [...current.visitedRelationshipIds, id] }));
    setEvaluation(null);
  };

  const checkMission = () => {
    const result = evaluateMission(mission, { selectedCharacterIds, selectedRelationshipIds, writtenResponse });
    setEvaluation(result);
    if (result.complete) {
      setSession((current) => updateLearningSession(current, { completedMissionIds: [...current.completedMissionIds, mission.id] }));
    }
  };

  const continueMission = () => {
    const nextIndex = lesson.missions.findIndex((item, index) => index > missionIndex && !session.completedMissionIds.includes(item.id));
    if (nextIndex >= 0) setMissionIndex(nextIndex);
    setSelectedCharacterIds([]);
    setSelectedRelationshipIds([]);
    setFocusedCharacterId(null);
    setFocusedRelationshipId(null);
    setWrittenResponse("");
    setVisibleHint(null);
    setEvaluation(null);
  };

  const revealHint = () => {
    setVisibleHint(mission.hints[0]);
    setSession((current) => updateLearningSession(current, { usedHintIds: [...current.usedHintIds, hintId] }));
  };

  const finishAssessment = (answers: AssessmentAnswer[]) => {
    setSession((current) => updateLearningSession(current, { assessmentAnswers: answers }));
    setPhase("summary");
  };

  const reset = () => {
    setSession(createLearningSession(lesson.id));
    setMissionIndex(0);
    setPhase("intro");
    setSelectedCharacterIds([]);
    setSelectedRelationshipIds([]);
    setFocusedCharacterId(null);
    setFocusedRelationshipId(null);
    setEvaluation(null);
  };

  if (phase === "intro") {
    return <main className="site-shell"><LessonIntroduction lesson={lesson} onStart={() => setPhase("explore")} /></main>;
  }
  if (phase === "assessment") return <main><AssessmentPanel lesson={lesson} onFinish={finishAssessment} /></main>;
  if (phase === "summary") return <main><LearningSummary lesson={lesson} session={session} /></main>;

  const focusedCharacter = lesson.characters.find((item) => item.id === focusedCharacterId) ?? null;
  const focusedRelationship = lesson.relationships.find((item) => item.id === focusedRelationshipId) ?? null;

  return (
    <main className="learning-workspace">
      <header className="learning-header glass-material">
        <BrandMark />
        <div className="lesson-breadcrumb"><span>{lesson.kind}</span><strong>{lesson.title}</strong></div>
        <div className="workspace-actions">
          <div className="view-toggle" role="group" aria-label="Galaxy view">
            <button type="button" aria-pressed={view === "3d"} disabled={!available} onClick={() => setView("3d")}>3D galaxy</button>
            <button type="button" aria-pressed={view === "2d"} onClick={() => setView("2d")}>2D list</button>
          </div>
          <button type="button" className="header-action" onClick={reset}>Reset</button>
          <Link className="header-action" href={`/sources/${lesson.slug}`}>Sources</Link>
        </div>
      </header>
      {!available && <div className="webgl-status" role="status">3D is unavailable on this device. The complete lesson is open in the 2D relationship list.</div>}
      {allComplete ? (
        <section className="missions-complete glass-material">
          <p className="eyebrow">Exploration complete</p>
          <h1>You mapped the full learning path.</h1>
          <p>Continue with five prepared, evidence-grounded comprehension prompts.</p>
          <button className="primary-action pressable" type="button" onClick={() => setPhase("assessment")}>Begin comprehension check →</button>
        </section>
      ) : (
        <div className="workspace-grid">
          <motion.aside className="workspace-panel mission-panel glass-material" initial={reduceMotion ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.38 }}>
            <MissionPanel mission={mission} position={missionIndex + 1} total={lesson.missions.length} hint={visibleHint} hintUsed={session.usedHintIds.includes(hintId)} writtenResponse={writtenResponse} evaluation={evaluation} onHint={revealHint} onResponseChange={setWrittenResponse} onCheck={checkMission} onContinue={continueMission} />
          </motion.aside>
          <section className="galaxy-viewport">
            {view === "3d" && available ? (
              <GalaxyScene lesson={lesson} selectedCharacterId={focusedCharacterId} selectedRelationshipIds={selectedRelationshipIds} highlightedRelationshipIds={mission.relevantRelationshipIds} reduceMotion={reduceMotion} onSelectCharacter={selectCharacter} onSelectRelationship={selectRelationship} />
            ) : (
              <RelationshipListView lesson={lesson} selectedCharacterIds={selectedCharacterIds} selectedRelationshipIds={selectedRelationshipIds} onSelectCharacter={selectCharacter} onSelectRelationship={selectRelationship} />
            )}
          </section>
          <motion.aside className="workspace-panel evidence-panel glass-material" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.38 }}>
            <EvidencePanel lesson={lesson} character={focusedCharacter} relationship={focusedRelationship} />
          </motion.aside>
        </div>
      )}
    </main>
  );
}
