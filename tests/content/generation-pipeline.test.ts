import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SourceManifestSchema } from "@/scripts/content-schema";
import { buildReviewReport, reviewLessonPack } from "@/scripts/generate-content-review";
import { validateLessonPackValue } from "@/scripts/validate-lesson-pack";

const root = process.cwd();
const readJson = (path: string) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as unknown;

describe("lesson generation pipeline", () => {
  it("requires complete provenance and an explicit allowed-use policy", () => {
    const incomplete = {
      schemaVersion: "1.0",
      lessonId: "sample-lesson",
      sources: [
        {
          id: "sample-source",
          title: "Sample source",
          url: "https://example.com/source",
          publisher: "Example Publisher",
          license: "CC0 1.0",
          retrievedAt: "2026-07-14",
          contentHash: "a".repeat(64),
          normalizedExcerpt: "A reviewed factual excerpt for candidate generation.",
        },
      ],
    };
    expect(SourceManifestSchema.safeParse(incomplete).success).toBe(false);
  });

  it("prints schema paths for invalid lesson data", () => {
    const invalid = readJson("content/lesson-packs/french-revolution.json") as Record<string, unknown>;
    invalid.characters = [];
    const result = validateLessonPackValue(invalid, "invalid.json");
    expect(result.valid).toBe(false);
    expect(result.issues.join("\n")).toContain("characters");
  });

  it("reports every evidence-review category deterministically", () => {
    const lesson = readJson("content/lesson-packs/romeo-and-juliet.json");
    const findings = reviewLessonPack(lesson);
    const report = buildReviewReport(findings);
    expect(report).toContain("## Low-confidence relationships");
    expect(report).toContain("## Disputed interpretations");
    expect(report).toContain("## Missing evidence summaries");
    expect(report).toContain("## Objective coverage");
    expect(report).toContain("## Literary locators");
    expect(report).toContain("Blocking evidence errors: **0**");
  });

  it.each(["french-revolution", "romeo-and-juliet"])(
    "accepts the %s source manifest and official pack",
    (lessonId) => {
      expect(
        SourceManifestSchema.safeParse(
          readJson(`content/manifests/${lessonId}.source-manifest.json`),
        ).success,
      ).toBe(true);
      expect(
        validateLessonPackValue(
          readJson(`content/lesson-packs/${lessonId}.json`),
          `${lessonId}.json`,
        ).valid,
      ).toBe(true);
    },
  );
});
