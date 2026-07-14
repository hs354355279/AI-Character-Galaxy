import { z } from "zod";
import { AssessmentQuestionSchema } from "@/lib/lessons/schema";

const sessionId = z.string().min(8).max(128);
const lessonId = z.string().min(2).max(80);
const entityId = z.string().min(2).max(100);

export const ExplanationRequestSchema = z
  .object({
    lessonId,
    characterId: entityId.optional(),
    relationshipId: entityId.optional(),
    purpose: z.enum(["explanation", "hint"]).default("explanation"),
    sessionId,
  })
  .strict()
  .refine((value) => Boolean(value.characterId) !== Boolean(value.relationshipId), {
    message: "Provide exactly one characterId or relationshipId.",
  });

export const ExplanationOutputSchema = z
  .object({
    explanation: z.string().min(20).max(900),
    sourceRefIds: z.array(entityId).min(1).max(4),
    followUpPrompt: z.string().min(10).max(240),
  })
  .strict();

export const AssessmentRequestSchema = z
  .object({
    lessonId,
    exploredCharacterIds: z.array(entityId).max(12),
    exploredRelationshipIds: z.array(entityId).max(25),
    sessionId,
  })
  .strict();

export const AssessmentOutputSchema = z
  .object({ questions: z.array(AssessmentQuestionSchema).length(5) })
  .strict();

export const SummaryRequestSchema = z
  .object({
    lessonId,
    visitedCharacterIds: z.array(entityId).max(12),
    visitedRelationshipIds: z.array(entityId).max(25),
    completedMissionIds: z.array(entityId).max(6),
    sessionId,
  })
  .strict();

export const SummaryOutputSchema = z
  .object({
    summary: z.string().min(30).max(900),
    keyCharacterIds: z.array(entityId).max(8),
    relationshipPathIds: z.array(entityId).max(8),
    concepts: z.array(z.string().min(2).max(80)).min(1).max(6),
    followUpQuestion: z.string().min(10).max(240),
  })
  .strict();

export type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>;
export type ExplanationOutput = z.infer<typeof ExplanationOutputSchema>;
export type AssessmentRequest = z.infer<typeof AssessmentRequestSchema>;
export type AssessmentOutput = z.infer<typeof AssessmentOutputSchema>;
export type SummaryRequest = z.infer<typeof SummaryRequestSchema>;
export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
