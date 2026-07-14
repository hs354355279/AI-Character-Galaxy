import { z } from "zod";

const AssessmentAnswerSchema = z
  .object({
    questionId: z.string().min(1),
    answer: z.string(),
    isCorrect: z.boolean().optional(),
  })
  .strict();

const LearningSessionSchema = z
  .object({
    lessonPackId: z.string().min(1),
    startedAt: z.string().datetime(),
    visitedCharacterIds: z.array(z.string()),
    visitedRelationshipIds: z.array(z.string()),
    completedMissionIds: z.array(z.string()),
    usedHintIds: z.array(z.string()),
    assessmentAnswers: z.array(AssessmentAnswerSchema),
  })
  .strict();

export type AssessmentAnswer = z.infer<typeof AssessmentAnswerSchema>;
export type LearningSession = z.infer<typeof LearningSessionSchema>;

const storageKey = (lessonPackId: string) =>
  `ai-character-galaxy:session:${lessonPackId}`;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function createLearningSession(
  lessonPackId: string,
  startedAt = new Date().toISOString(),
): LearningSession {
  return {
    lessonPackId,
    startedAt,
    visitedCharacterIds: [],
    visitedRelationshipIds: [],
    completedMissionIds: [],
    usedHintIds: [],
    assessmentAnswers: [],
  };
}

export function updateLearningSession(
  session: LearningSession,
  update: Partial<Omit<LearningSession, "lessonPackId" | "startedAt">>,
): LearningSession {
  return LearningSessionSchema.parse({
    ...session,
    ...update,
    visitedCharacterIds: unique(update.visitedCharacterIds ?? session.visitedCharacterIds),
    visitedRelationshipIds: unique(
      update.visitedRelationshipIds ?? session.visitedRelationshipIds,
    ),
    completedMissionIds: unique(update.completedMissionIds ?? session.completedMissionIds),
    usedHintIds: unique(update.usedHintIds ?? session.usedHintIds),
  });
}

export function saveLearningSession(session: LearningSession, storage: Storage): void {
  const validated = LearningSessionSchema.parse(session);
  storage.setItem(storageKey(validated.lessonPackId), JSON.stringify(validated));
}

export function loadLearningSession(lessonPackId: string, storage: Storage): LearningSession {
  const raw = storage.getItem(storageKey(lessonPackId));
  if (!raw) return createLearningSession(lessonPackId);

  try {
    const session = LearningSessionSchema.parse(JSON.parse(raw));
    return session.lessonPackId === lessonPackId
      ? session
      : createLearningSession(lessonPackId);
  } catch {
    return createLearningSession(lessonPackId);
  }
}
