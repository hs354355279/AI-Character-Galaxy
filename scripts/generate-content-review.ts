import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LessonPackSchema, type LessonPack } from "../lib/lessons/schema";

export type ReviewFindings = {
  lessonId: string;
  title: string;
  reviewedAt: string;
  lowConfidence: string[];
  disputed: string[];
  missingEvidence: string[];
  uncoveredObjectives: string[];
  missingLiteraryLocators: string[];
  blockingErrors: number;
};

export function reviewLessonPack(value: unknown): ReviewFindings {
  const lesson: LessonPack = LessonPackSchema.parse(value);
  const coveredObjectives = new Set(
    lesson.missions.flatMap((mission) => mission.relevantObjectiveIds),
  );
  const lowConfidence = lesson.relationships
    .filter((edge) => edge.confidence < 0.7)
    .map((edge) => `${edge.id} (${edge.confidence.toFixed(2)})`);
  const disputed = lesson.relationships
    .filter((edge) => edge.isDisputed)
    .map((edge) => `${edge.id}: ${edge.disputeNote}`);
  const missingEvidence = lesson.relationships
    .filter((edge) => edge.evidenceSummary.trim().length < 20 || edge.sourceRefIds.length === 0)
    .map((edge) => edge.id);
  const uncoveredObjectives = lesson.objectives
    .filter((objective) => !coveredObjectives.has(objective.id))
    .map((objective) => objective.id);
  const missingLiteraryLocators =
    lesson.kind === "literature"
      ? lesson.relationships
          .filter((edge) => !edge.evidenceLocation)
          .map((edge) => edge.id)
      : [];
  return {
    lessonId: lesson.id,
    title: lesson.title,
    reviewedAt: new Date().toISOString().slice(0, 10),
    lowConfidence,
    disputed,
    missingEvidence,
    uncoveredObjectives,
    missingLiteraryLocators,
    blockingErrors:
      missingEvidence.length + uncoveredObjectives.length + missingLiteraryLocators.length,
  };
}

function section(title: string, items: string[], emptyMessage: string): string {
  const lines = items.length ? items.map((item) => `- ${item}`) : [`- ${emptyMessage}`];
  return `## ${title}\n\n${lines.join("\n")}`;
}

export function buildReviewReport(findings: ReviewFindings): string {
  return [
    `# ${findings.title} Content Review`,
    "",
    `- Lesson ID: \`${findings.lessonId}\``,
    `- Review date: ${findings.reviewedAt}`,
    `- Blocking evidence errors: **${findings.blockingErrors}**`,
    "",
    section("Low-confidence relationships", findings.lowConfidence, "None."),
    "",
    section("Disputed interpretations", findings.disputed, "None."),
    "",
    section("Missing evidence summaries", findings.missingEvidence, "None."),
    "",
    section("Objective coverage", findings.uncoveredObjectives, "Every objective has mission coverage."),
    "",
    section("Literary locators", findings.missingLiteraryLocators, "Every required relationship has a locator."),
    "",
    "## Review decision",
    "",
    findings.blockingErrors === 0
      ? "The lesson pack passes automated evidence gates and is ready for a human editorial review."
      : "The lesson pack is blocked until every evidence error above is resolved.",
    "",
  ].join("\n");
}

function defaultPackPaths(): string[] {
  const directory = resolve(process.cwd(), "content", "lesson-packs");
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => resolve(directory, file));
}

export function runReview(files = process.argv.slice(2)): number {
  const paths = files.length ? files.map((file) => resolve(file)) : defaultPackPaths();
  const reportDirectory = resolve(process.cwd(), "content", "reports");
  mkdirSync(reportDirectory, { recursive: true });
  let blocked = false;
  for (const file of paths) {
    try {
      const findings = reviewLessonPack(JSON.parse(readFileSync(file, "utf8")));
      const output = resolve(reportDirectory, `${findings.lessonId}.review.md`);
      writeFileSync(output, buildReviewReport(findings), "utf8");
      console.log(`WROTE ${output}`);
      blocked ||= findings.blockingErrors > 0;
    } catch (error) {
      blocked = true;
      console.error(`FAILED ${basename(file)}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return blocked ? 1 : 0;
}

const directUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === directUrl) process.exitCode = runReview();
