import type { LessonPack } from "@/lib/lessons/schema";
import type {
  AssessmentOutput,
  AssessmentRequest,
  ExplanationOutput,
  ExplanationRequest,
  SummaryOutput,
  SummaryRequest,
} from "@/lib/openai/schemas";

function validIds(requested: string[], available: Set<string>): string[] {
  return [...new Set(requested.filter((id) => available.has(id)))];
}

export function preparedExplanation(
  request: ExplanationRequest,
  lesson: LessonPack,
): ExplanationOutput {
  if (request.relationshipId) {
    const relationship = lesson.relationships.find((item) => item.id === request.relationshipId);
    if (relationship) {
      return {
        explanation:
          request.purpose === "hint"
            ? `Look closely at how ${relationship.evidenceSummary.toLowerCase()} Use that connection to answer the mission in your own words.`
            : `${relationship.summary} The reviewed evidence adds: ${relationship.evidenceSummary}`,
        sourceRefIds: relationship.sourceRefIds,
        followUpPrompt: "How does this relationship help answer the lesson's essential question?",
      };
    }
  }

  if (request.characterId) {
    const character = lesson.characters.find((item) => item.id === request.characterId);
    if (character) {
      return {
        explanation:
          request.purpose === "hint"
            ? `Start with ${character.name}'s role: ${character.role}. Then connect that role to one reviewed relationship.`
            : `${character.summary} This role matters because the lesson asks learners to connect people, choices, and consequences rather than memorize names alone.`,
        sourceRefIds: character.sourceRefIds,
        followUpPrompt: "Which relationship best shows this character's impact?",
      };
    }
  }

  const firstCharacter = lesson.characters[0];
  return {
    explanation: `${firstCharacter.summary} Select a reviewed person or relationship to see more specific evidence.`,
    sourceRefIds: firstCharacter.sourceRefIds,
    followUpPrompt: "Which reviewed connection would you like to examine next?",
  };
}

export function preparedAssessment(
  _request: AssessmentRequest,
  lesson: LessonPack,
): AssessmentOutput {
  return { questions: lesson.preparedAssessment };
}

export function preparedSummary(request: SummaryRequest, lesson: LessonPack): SummaryOutput {
  const characterIds = new Set(lesson.characters.map((item) => item.id));
  const relationshipIds = new Set(lesson.relationships.map((item) => item.id));
  const keyCharacterIds = validIds(request.visitedCharacterIds, characterIds);
  const relationshipPathIds = validIds(request.visitedRelationshipIds, relationshipIds);

  return {
    summary: lesson.preparedSummary.join(" "),
    keyCharacterIds,
    relationshipPathIds,
    concepts: lesson.objectives.slice(0, 4).map((objective) => objective.title),
    followUpQuestion: lesson.discussionQuestions[0],
  };
}
