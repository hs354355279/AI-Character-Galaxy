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
import {
  CharacterResearchProfileSchema,
  type CharacterModelResult,
  type CharacterResearchCitation,
  type CharacterResearchRequest,
} from "@/lib/openai/character-schemas";
import {
  buildCharacterResearchPrompt,
  CHARACTER_RESEARCH_DEVELOPER_PROMPT,
} from "@/lib/openai/character-prompts";

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function model() {
  return process.env.OPENAI_MODEL || "gpt-5.6";
}

function extractCharacterCitations(response: unknown): CharacterResearchCitation[] {
  const output = (response as {
    output?: Array<{
      action?: { sources?: Array<{ title?: string; url?: string }> };
      content?: Array<{
        annotations?: Array<{ type?: string; title?: string; url?: string }>;
      }>;
    }>;
  }).output ?? [];
  const citations: CharacterResearchCitation[] = [];
  for (const item of output) {
    for (const source of item.action?.sources ?? []) {
      if (source.url) citations.push({ title: source.title ?? "Web source", url: source.url });
    }
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type === "url_citation" && annotation.url) {
          citations.push({ title: annotation.title ?? "Web source", url: annotation.url });
        }
      }
    }
  }
  return citations;
}

function hasRefusal(response: unknown): boolean {
  const output = (response as { output?: Array<{ content?: Array<{ type?: string }> }> }).output ?? [];
  return output.some((item) => item.content?.some((content) => content.type === "refusal"));
}

export async function callCharacterResearchModel(
  request: CharacterResearchRequest,
  safetyIdentifier: string,
): Promise<CharacterModelResult> {
  const response = await client().responses.parse(
    {
      model: model(),
      reasoning: { effort: "low" },
      tools: [{ type: "web_search", search_context_size: "low" }],
      tool_choice: "required",
      include: ["web_search_call.action.sources"],
      safety_identifier: safetyIdentifier,
      input: [
        { role: "developer", content: CHARACTER_RESEARCH_DEVELOPER_PROMPT },
        { role: "user", content: buildCharacterResearchPrompt(request) },
      ],
      text: { format: zodTextFormat(CharacterResearchProfileSchema, "character_research") },
    },
    { timeout: 20_000 },
  );
  if (!response.output_parsed) {
    const error = new Error("The model returned no parsed character profile.");
    if (hasRefusal(response)) error.name = "CharacterResearchRefusalError";
    throw error;
  }
  return { profile: response.output_parsed, citations: extractCharacterCitations(response) };
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
