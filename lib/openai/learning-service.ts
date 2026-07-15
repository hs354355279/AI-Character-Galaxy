import type { LessonPack } from "@/lib/lessons/schema";
export { createSafetyIdentifier } from "@/lib/openai/safety";
import { createSafetyIdentifier } from "@/lib/openai/safety";
import {
  callAssessmentModel,
  callExplanationModel,
  callSummaryModel,
} from "@/lib/openai/client";
import {
  preparedAssessment,
  preparedExplanation,
  preparedSummary,
} from "@/lib/openai/fallbacks";
import {
  AssessmentOutputSchema,
  ExplanationOutputSchema,
  SummaryOutputSchema,
  type AssessmentOutput,
  type AssessmentRequest,
  type ExplanationOutput,
  type ExplanationRequest,
  type SummaryOutput,
  type SummaryRequest,
} from "@/lib/openai/schemas";

export type LearningGeneration<T> = {
  source: "gpt-5.6" | "prepared";
  data: T;
};

type ModelCaller<Request, Output> = (
  request: Request,
  lesson: LessonPack,
  safetyIdentifier: string,
) => Promise<unknown | Output>;

function isSubset(values: string[], allowed: Set<string>): boolean {
  return values.every((value) => allowed.has(value));
}

function hasValidExplanationReferences(output: ExplanationOutput, lesson: LessonPack): boolean {
  const sources = new Set(lesson.sources.map((source) => source.id));
  return isSubset(output.sourceRefIds, sources);
}

function hasValidAssessmentReferences(output: AssessmentOutput, lesson: LessonPack): boolean {
  const sources = new Set(lesson.sources.map((source) => source.id));
  return output.questions.every((question) => {
    const correctIndexIsValid =
      question.correctOptionIndex === undefined ||
      (question.options !== undefined && question.correctOptionIndex < question.options.length);
    const multipleChoiceIsComplete =
      question.type !== "multiple-choice" ||
      (question.options !== undefined &&
        question.options.length >= 2 &&
        question.correctOptionIndex !== undefined);
    return (
      isSubset(question.sourceRefIds, sources) &&
      correctIndexIsValid &&
      multipleChoiceIsComplete
    );
  });
}

function hasValidSummaryReferences(output: SummaryOutput, lesson: LessonPack): boolean {
  const characters = new Set(lesson.characters.map((item) => item.id));
  const relationships = new Set(lesson.relationships.map((item) => item.id));
  return (
    isSubset(output.keyCharacterIds, characters) &&
    isSubset(output.relationshipPathIds, relationships)
  );
}

async function tryModel<Request, Output>(
  request: Request,
  lesson: LessonPack,
  caller: ModelCaller<Request, Output>,
  parse: (value: unknown) => Output,
  validateReferences: (output: Output, lesson: LessonPack) => boolean,
): Promise<Output | null> {
  const safetyIdentifier = createSafetyIdentifier(
    (request as { sessionId: string }).sessionId,
  );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = parse(await caller(request, lesson, safetyIdentifier));
      if (validateReferences(output, lesson)) return output;
    } catch {
      // A single bounded retry handles transient errors and malformed model output.
    }
  }
  return null;
}

export async function generateExplanation(
  request: ExplanationRequest,
  lesson: LessonPack,
  injectedCaller?: ModelCaller<ExplanationRequest, ExplanationOutput>,
): Promise<LearningGeneration<ExplanationOutput>> {
  const characterIds = new Set(lesson.characters.map((item) => item.id));
  const relationshipIds = new Set(lesson.relationships.map((item) => item.id));
  const inputIsValid =
    request.lessonId === lesson.id &&
    (!request.characterId || characterIds.has(request.characterId)) &&
    (!request.relationshipId || relationshipIds.has(request.relationshipId));
  if (!inputIsValid || (!injectedCaller && !process.env.OPENAI_API_KEY)) {
    return { source: "prepared", data: preparedExplanation(request, lesson) };
  }

  const output = await tryModel(
    request,
    lesson,
    injectedCaller ?? callExplanationModel,
    (value) => ExplanationOutputSchema.parse(value),
    hasValidExplanationReferences,
  );
  return output
    ? { source: "gpt-5.6", data: output }
    : { source: "prepared", data: preparedExplanation(request, lesson) };
}

export async function generateAssessment(
  request: AssessmentRequest,
  lesson: LessonPack,
  injectedCaller?: ModelCaller<AssessmentRequest, AssessmentOutput>,
): Promise<LearningGeneration<AssessmentOutput>> {
  const characterIds = new Set(lesson.characters.map((item) => item.id));
  const relationshipIds = new Set(lesson.relationships.map((item) => item.id));
  const inputIsValid =
    request.lessonId === lesson.id &&
    isSubset(request.exploredCharacterIds, characterIds) &&
    isSubset(request.exploredRelationshipIds, relationshipIds);
  if (!inputIsValid || (!injectedCaller && !process.env.OPENAI_API_KEY)) {
    return { source: "prepared", data: preparedAssessment(request, lesson) };
  }

  const output = await tryModel(
    request,
    lesson,
    injectedCaller ?? callAssessmentModel,
    (value) => AssessmentOutputSchema.parse(value),
    hasValidAssessmentReferences,
  );
  return output
    ? { source: "gpt-5.6", data: output }
    : { source: "prepared", data: preparedAssessment(request, lesson) };
}

export async function generateSummary(
  request: SummaryRequest,
  lesson: LessonPack,
  injectedCaller?: ModelCaller<SummaryRequest, SummaryOutput>,
): Promise<LearningGeneration<SummaryOutput>> {
  const characterIds = new Set(lesson.characters.map((item) => item.id));
  const relationshipIds = new Set(lesson.relationships.map((item) => item.id));
  const missionIds = new Set(lesson.missions.map((item) => item.id));
  const inputIsValid =
    request.lessonId === lesson.id &&
    isSubset(request.visitedCharacterIds, characterIds) &&
    isSubset(request.visitedRelationshipIds, relationshipIds) &&
    isSubset(request.completedMissionIds, missionIds);
  if (!inputIsValid || (!injectedCaller && !process.env.OPENAI_API_KEY)) {
    return { source: "prepared", data: preparedSummary(request, lesson) };
  }

  const output = await tryModel(
    request,
    lesson,
    injectedCaller ?? callSummaryModel,
    (value) => SummaryOutputSchema.parse(value),
    hasValidSummaryReferences,
  );
  return output
    ? { source: "gpt-5.6", data: output }
    : { source: "prepared", data: preparedSummary(request, lesson) };
}
