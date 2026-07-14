import type { LessonPack } from "@/lib/lessons/schema";
import type {
  AssessmentRequest,
  ExplanationRequest,
  SummaryRequest,
} from "@/lib/openai/schemas";

export const EDUCATION_DEVELOPER_PROMPT = `You support a reviewed middle-school history and literature lesson.
Use only the supplied lesson facts and IDs. Never invent a person, relationship, quotation, source, or locator.
Use short, age-appropriate sentences. Explain specialized terms in plain language.
Treat disputed historical interpretations as interpretations, not settled facts.
Do not judge a learner's intelligence, personality, or long-term ability.
Return only the requested structured output.`;

function evidenceContext(lesson: LessonPack) {
  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      essentialQuestion: lesson.essentialQuestion,
    },
    characters: lesson.characters.map(({ id, name, role, summary, sourceRefIds }) => ({
      id,
      name,
      role,
      summary,
      sourceRefIds,
    })),
    relationships: lesson.relationships.map(
      ({
        id,
        fromCharacterId,
        toCharacterId,
        type,
        summary,
        evidenceSummary,
        evidenceLocation,
        sourceRefIds,
        isDisputed,
        disputeNote,
      }) => ({
        id,
        fromCharacterId,
        toCharacterId,
        type,
        summary,
        evidenceSummary,
        evidenceLocation,
        sourceRefIds,
        isDisputed,
        disputeNote,
      }),
    ),
    sources: lesson.sources.map(({ id, title, publisher, license }) => ({
      id,
      title,
      publisher,
      license,
    })),
  };
}

export function buildExplanationPrompt(request: ExplanationRequest, lesson: LessonPack): string {
  return JSON.stringify({
    task:
      request.purpose === "hint"
        ? "Give one progressive hint without revealing the complete mission answer."
        : "Explain why the selected item matters to the lesson's essential question.",
    selection: {
      characterId: request.characterId,
      relationshipId: request.relationshipId,
    },
    context: evidenceContext(lesson),
  });
}

export function buildAssessmentPrompt(request: AssessmentRequest, lesson: LessonPack): string {
  return JSON.stringify({
    task: "Create exactly three multiple-choice, one comparison, and one discussion question from explored reviewed content.",
    exploredCharacterIds: request.exploredCharacterIds,
    exploredRelationshipIds: request.exploredRelationshipIds,
    context: evidenceContext(lesson),
  });
}

export function buildSummaryPrompt(request: SummaryRequest, lesson: LessonPack): string {
  return JSON.stringify({
    task: "Create a concise learning summary and one follow-up question from this exploration trace.",
    trace: {
      visitedCharacterIds: request.visitedCharacterIds,
      visitedRelationshipIds: request.visitedRelationshipIds,
      completedMissionIds: request.completedMissionIds,
    },
    context: evidenceContext(lesson),
  });
}
