"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { RelationshipListView } from "@/components/accessibility/RelationshipListView";
import { detectWebGL } from "@/components/accessibility/WebGLBoundary";
import { GalaxyScene } from "@/components/galaxy/GalaxyScene";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import { AssessmentPanel } from "@/components/learning/AssessmentPanel";
import { CharacterRail } from "@/components/learning/CharacterRail";
import { EvidencePanel } from "@/components/learning/EvidencePanel";
import { LearningSummary } from "@/components/learning/LearningSummary";
import { LessonIntroduction } from "@/components/learning/LessonIntroduction";
import { MissionPanel } from "@/components/learning/MissionPanel";
import { ObservatoryShell } from "@/components/learning/ObservatoryShell";
import { evaluateMission, type MissionEvaluation } from "@/lib/missions/evaluate";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";
import type { LessonPack } from "@/lib/lessons/schema";
import {
  createEmptyExpansionState,
  createRuntimeRelationshipGraph,
  mergeExpansionBatch,
} from "@/lib/network-expansion/runtime-graph";
import {
  MAX_EXPANDED_CHARACTERS,
  type NetworkExpansionBatch,
} from "@/lib/network-expansion/schemas";
import {
  loadExpansionState,
  saveExpansionState,
} from "@/lib/network-expansion/storage";
import {
  createLearningSession,
  loadLearningSession,
  saveLearningSession,
  updateLearningSession,
  type AssessmentAnswer,
  type LearningSession,
} from "@/lib/session/learning-session";

type ViewMode = "2d" | "3d";
type Phase = "intro" | "explore" | "assessment" | "summary";
const lessons = getAllLessonPacks().map(createLandingLesson);

export function LearningExperience({
  lesson,
  initialView = "3d",
  initialSession,
  webglAvailable,
  initialFocusCharacterId,
}: {
  lesson: LessonPack;
  initialView?: ViewMode;
  initialSession?: LearningSession;
  webglAvailable?: boolean;
  initialFocusCharacterId?: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [expansionState, setExpansionState] = useState(() => createEmptyExpansionState(lesson.id));
  const [expansionReady, setExpansionReady] = useState(false);
  const runtimeGraph = useMemo(
    () => createRuntimeRelationshipGraph(lesson, expansionState),
    [expansionState, lesson],
  );
  const [available, setAvailable] = useState(webglAvailable ?? false);
  const [view, setView] = useState<ViewMode>(
    initialView === "3d" && webglAvailable === true ? "3d" : "2d",
  );
  const validInitialFocus = lesson.characters.some(
    (character) => character.id === initialFocusCharacterId,
  )
    ? initialFocusCharacterId ?? null
    : null;
  const [phase, setPhase] = useState<Phase>(
    initialSession || validInitialFocus ? "explore" : "intro",
  );
  useEffect(() => {
    if (webglAvailable !== undefined) return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const compact = window.matchMedia("(max-width: 800px)").matches;
      const detected = detectWebGL();
      setAvailable(detected);
      if (compact) {
        setView("2d");
      } else if (detected && initialView === "3d") {
        setView("3d");
      }
    });
    return () => {
      active = false;
    };
  }, [initialView, webglAvailable]);
  const [session, setSession] = useState<LearningSession>(() => {
    if (initialSession) return initialSession;
    const created = createLearningSession(lesson.id);
    return validInitialFocus
      ? updateLearningSession(created, { visitedCharacterIds: [validInitialFocus] })
      : created;
  });
  const [sessionReady, setSessionReady] = useState(Boolean(initialSession || validInitialFocus));
  const [explorationFinished, setExplorationFinished] = useState(
    Boolean(
      initialSession &&
        lesson.missions.every((mission) => initialSession.completedMissionIds.includes(mission.id)),
    ),
  );
  const firstIncomplete = Math.max(
    0,
    lesson.missions.findIndex((mission) => !session.completedMissionIds.includes(mission.id)),
  );
  const [missionIndex, setMissionIndex] = useState(firstIncomplete);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    validInitialFocus ? [validInitialFocus] : [],
  );
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState<string[]>([]);
  const [focusedCharacterId, setFocusedCharacterId] = useState<string | null>(validInitialFocus);
  const [focusedRelationshipId, setFocusedRelationshipId] = useState<string | null>(null);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [evaluation, setEvaluation] = useState<MissionEvaluation | null>(null);
  const [visibleHint, setVisibleHint] = useState<string | null>(null);

  const mission = lesson.missions[missionIndex];
  const allMissionsRecorded = lesson.missions.every((item) =>
    session.completedMissionIds.includes(item.id),
  );
  const hintId = `${mission?.id ?? "none"}:0`;

  useEffect(() => {
    if (initialSession || validInitialFocus || typeof window === "undefined") return;
    const restored = loadLearningSession(lesson.id, window.sessionStorage);
    const hasProgress =
      restored.visitedCharacterIds.length > 0 ||
      restored.visitedRelationshipIds.length > 0 ||
      restored.completedMissionIds.length > 0 ||
      restored.assessmentAnswers.length > 0;
    const restoredMissionIndex = lesson.missions.findIndex(
      (mission) => !restored.completedMissionIds.includes(mission.id),
    );
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSession(restored);
      if (hasProgress) setPhase("explore");
      setMissionIndex(restoredMissionIndex >= 0 ? restoredMissionIndex : lesson.missions.length - 1);
      setExplorationFinished(
        lesson.missions.every((mission) => restored.completedMissionIds.includes(mission.id)),
      );
      setSessionReady(true);
    });
    return () => {
      active = false;
    };
  }, [initialSession, lesson.id, lesson.missions, validInitialFocus]);

  useEffect(() => {
    if (sessionReady && typeof window !== "undefined") {
      saveLearningSession(session, window.sessionStorage);
    }
  }, [session, sessionReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const restored = loadExpansionState(lesson.id, window.sessionStorage);
    queueMicrotask(() => {
      if (!active) return;
      setExpansionState(restored);
      setExpansionReady(true);
    });
    return () => {
      active = false;
    };
  }, [lesson.id]);

  useEffect(() => {
    if (expansionReady && typeof window !== "undefined") {
      saveExpansionState(expansionState, window.sessionStorage);
    }
  }, [expansionReady, expansionState]);

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
    else if (allMissionsRecorded) setExplorationFinished(true);
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
    setExplorationFinished(false);
    setMissionIndex(0);
    setPhase("intro");
    setSelectedCharacterIds([]);
    setSelectedRelationshipIds([]);
    setFocusedCharacterId(null);
    setFocusedRelationshipId(null);
    setEvaluation(null);
    setExpansionState(createEmptyExpansionState(lesson.id));
  };

  const addExpansion = (batch: NetworkExpansionBatch) => {
    setExpansionState((current) => mergeExpansionBatch(lesson, current, batch));
  };

  if (phase === "intro") {
    return <main className="lesson-introduction-shell"><LessonIntroduction lesson={lesson} onStart={() => setPhase("explore")} /></main>;
  }
  if (phase === "assessment") return <main><AssessmentPanel lesson={lesson} session={session} onFinish={finishAssessment} /></main>;
  if (phase === "summary") return <main><LearningSummary lesson={lesson} session={session} /></main>;

  const focusedCharacter = runtimeGraph.characters.find((item) => item.id === focusedCharacterId) ?? null;
  const focusedRelationship = runtimeGraph.relationships.find((item) => item.id === focusedRelationshipId) ?? null;

  return (
    <main className="learning-workspace">
      <ExhibitionHeader
        lessons={lessons}
        currentLessonId={lesson.id}
        theme="paper"
        indexLabel="Open observatory navigation"
        actions={(
          <div className="workspace-actions">
          <div className="view-toggle" role="group" aria-label="Galaxy view">
            <button type="button" aria-pressed={view === "3d"} disabled={!available} onClick={() => setView("3d")}>3D galaxy</button>
            <button type="button" aria-pressed={view === "2d"} onClick={() => setView("2d")}>2D list</button>
          </div>
          <button type="button" className="header-action" onClick={reset}>Reset</button>
          <Link className="header-action" href={`/sources/${lesson.slug}`}>Sources</Link>
          </div>
        )}
      />
      {explorationFinished ? (
        <section className="missions-complete glass-material">
          <p className="eyebrow">Exploration complete</p>
          <h1>You mapped the full learning path.</h1>
          <p>Continue with five prepared, evidence-grounded comprehension prompts.</p>
          <button className="primary-action pressable" type="button" onClick={() => setPhase("assessment")}>Begin comprehension check →</button>
        </section>
      ) : (
        <ObservatoryShell
          lesson={lesson}
          status={!available ? (
            <div className="webgl-status" role="status">
              3D is unavailable on this device. The complete lesson is open in the 2D relationship list.
            </div>
          ) : undefined}
          mission={(
            <MissionPanel
              mission={mission}
              position={missionIndex + 1}
              total={lesson.missions.length}
              hint={visibleHint}
              hintUsed={session.usedHintIds.includes(hintId)}
              writtenResponse={writtenResponse}
              evaluation={evaluation}
              onHint={revealHint}
              onResponseChange={setWrittenResponse}
              onCheck={checkMission}
              onContinue={continueMission}
            />
          )}
          galaxy={view === "3d" && available ? (
            <GalaxyScene
              graph={runtimeGraph}
              selectedCharacterId={focusedCharacterId}
              selectedRelationshipIds={selectedRelationshipIds}
              highlightedRelationshipIds={mission.relevantRelationshipIds}
              reduceMotion={reduceMotion}
              onSelectCharacter={selectCharacter}
              onSelectRelationship={selectRelationship}
            />
          ) : (
            <RelationshipListView
              graph={runtimeGraph}
              selectedCharacterIds={selectedCharacterIds}
              selectedRelationshipIds={selectedRelationshipIds}
              onSelectCharacter={selectCharacter}
              onSelectRelationship={selectRelationship}
            />
          )}
          evidence={(
            <EvidencePanel
              lesson={lesson}
              graph={runtimeGraph}
              character={focusedCharacter}
              relationship={focusedRelationship}
              sessionId={`${lesson.id}:${session.startedAt}`}
              expansionDisabledReason={expansionState.characters.length >= MAX_EXPANDED_CHARACTERS
                ? "Expansion limit reached for this session"
                : undefined}
              onExpanded={addExpansion}
            />
          )}
          characterIndex={(
            <CharacterRail
              characters={runtimeGraph.characters}
              groups={runtimeGraph.groups}
              selectedCharacterId={focusedCharacterId}
              onSelect={selectCharacter}
            />
          )}
        />
      )}
    </main>
  );
}
