import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { LessonPack } from "@/lib/lessons/schema";
import {
  AssessmentOutputSchema,
  ExplanationOutputSchema,
  SummaryOutputSchema,
  type AssessmentRequest,
  type ExplanationRequest,
  type SummaryRequest,
} from "@/lib/openai/schemas";
import {
  buildAssessmentPrompt,
  buildExplanationPrompt,
  buildSummaryPrompt,
  EDUCATION_DEVELOPER_PROMPT,
} from "@/lib/openai/prompts";

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function model() {
  return process.env.OPENAI_MODEL || "gpt-5.6";
}

export async function callExplanationModel(
  request: ExplanationRequest,
  lesson: LessonPack,
  safetyIdentifier: string,
) {
  const response = await client().responses.parse(
    {
      model: model(),
      reasoning: { effort: "low" },
      safety_identifier: safetyIdentifier,
      input: [
        { role: "developer", content: EDUCATION_DEVELOPER_PROMPT },
        { role: "user", content: buildExplanationPrompt(request, lesson) },
      ],
      text: { format: zodTextFormat(ExplanationOutputSchema, "lesson_explanation") },
    },
    { timeout: 12_000 },
  );
  if (!response.output_parsed) throw new Error("The model returned no parsed explanation.");
  return response.output_parsed;
}

export async function callAssessmentModel(
  request: AssessmentRequest,
  lesson: LessonPack,
  safetyIdentifier: string,
) {
  const response = await client().responses.parse(
    {
      model: model(),
      reasoning: { effort: "low" },
      safety_identifier: safetyIdentifier,
      input: [
        { role: "developer", content: EDUCATION_DEVELOPER_PROMPT },
        { role: "user", content: buildAssessmentPrompt(request, lesson) },
      ],
      text: { format: zodTextFormat(AssessmentOutputSchema, "lesson_assessment") },
    },
    { timeout: 15_000 },
  );
  if (!response.output_parsed) throw new Error("The model returned no parsed assessment.");
  return response.output_parsed;
}

export async function callSummaryModel(
  request: SummaryRequest,
  lesson: LessonPack,
  safetyIdentifier: string,
) {
  const response = await client().responses.parse(
    {
      model: model(),
      reasoning: { effort: "low" },
      safety_identifier: safetyIdentifier,
      input: [
        { role: "developer", content: EDUCATION_DEVELOPER_PROMPT },
        { role: "user", content: buildSummaryPrompt(request, lesson) },
      ],
      text: { format: zodTextFormat(SummaryOutputSchema, "learning_summary") },
    },
    { timeout: 15_000 },
  );
  if (!response.output_parsed) throw new Error("The model returned no parsed summary.");
  return response.output_parsed;
}
