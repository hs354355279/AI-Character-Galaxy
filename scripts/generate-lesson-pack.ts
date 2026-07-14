import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { LessonPackSchema, type LessonPack } from "../lib/lessons/schema";
import { SourceManifestSchema, type SourceManifest } from "./content-schema";

const GENERATOR_PROMPT = `Create a candidate middle-school lesson pack from only the supplied reviewed source manifest.
Return English content for ages 12-16. Use 8-12 characters, 10-25 relationships, 4-6 missions, and exactly 5 assessment questions.
Never invent a quotation or source. Use only source IDs from the manifest. Every relationship needs a reviewed evidence summary and a source ID. Literary relationships require an act and scene locator.
Treat disputed interpretations neutrally. This output is a candidate for human review and must never claim to be an approved lesson.`;

type GeneratorArguments = { manifestPath: string; outputPath: string };

export function parseGeneratorArguments(args: string[]): GeneratorArguments {
  const valueAfter = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const manifestPath = valueAfter("--manifest");
  const outputPath = valueAfter("--output");
  if (!manifestPath || !outputPath) {
    throw new Error("Usage: npm run content:generate -- --manifest <path> --output <name>.candidate.json");
  }
  return { manifestPath: resolve(manifestPath), outputPath: resolve(outputPath) };
}

export function validateCandidateAgainstManifest(
  candidateValue: unknown,
  manifest: SourceManifest,
): LessonPack {
  const candidate = LessonPackSchema.parse(candidateValue);
  if (candidate.id !== manifest.lessonId || candidate.slug !== manifest.lessonId) {
    throw new Error("Candidate lesson ID and slug must match the source manifest lessonId.");
  }
  const expectedSources = new Map(manifest.sources.map((source) => [source.id, source]));
  if (candidate.sources.length !== expectedSources.size) {
    throw new Error("Candidate must preserve every manifest source and add no sources.");
  }
  for (const source of candidate.sources) {
    const approved = expectedSources.get(source.id);
    if (
      !approved ||
      source.url !== approved.url ||
      source.contentHash !== approved.contentHash ||
      source.license !== approved.license
    ) {
      throw new Error(`Candidate source ${source.id} does not match approved provenance.`);
    }
  }
  return candidate;
}

function assertCandidatePath(outputPath: string): void {
  if (!outputPath.endsWith(".candidate.json")) {
    throw new Error("Generated files must use the .candidate.json suffix.");
  }
  const officialDirectory = resolve(process.cwd(), "content", "lesson-packs");
  const pathFromOfficial = relative(officialDirectory, outputPath);
  if (!pathFromOfficial.startsWith("..") && !pathFromOfficial.includes(":")) {
    throw new Error("Candidate generation cannot write into the official lesson-packs directory.");
  }
  if (existsSync(outputPath)) {
    throw new Error("Refusing to overwrite an existing candidate file.");
  }
}

export async function generateCandidate(
  manifest: SourceManifest,
  apiKey = process.env.OPENAI_API_KEY,
): Promise<LessonPack> {
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for candidate generation.");
  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-5.6",
    reasoning: { effort: "low" },
    input: [
      { role: "developer", content: GENERATOR_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          lessonId: manifest.lessonId,
          locale: manifest.locale,
          sources: manifest.sources,
        }),
      },
    ],
    text: { format: zodTextFormat(LessonPackSchema, "candidate_lesson_pack") },
  });
  if (!response.output_parsed) throw new Error("GPT-5.6 returned no parsed candidate lesson.");
  return validateCandidateAgainstManifest(response.output_parsed, manifest);
}

export async function runGenerator(args = process.argv.slice(2)): Promise<number> {
  try {
    const { manifestPath, outputPath } = parseGeneratorArguments(args);
    assertCandidatePath(outputPath);
    const manifest = SourceManifestSchema.parse(
      JSON.parse(readFileSync(manifestPath, "utf8")),
    );
    const candidate = await generateCandidate(manifest);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    console.log(`WROTE candidate ${outputPath}`);
    console.log("NEXT Human review is required before moving this file into content/lesson-packs.");
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

const directUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === directUrl) process.exitCode = await runGenerator();
