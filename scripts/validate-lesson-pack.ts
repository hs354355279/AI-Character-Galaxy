import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LessonPackSchema } from "../lib/lessons/schema";

export type ValidationResult = {
  file: string;
  valid: boolean;
  issues: string[];
};

export function validateLessonPackValue(value: unknown, file: string): ValidationResult {
  const parsed = LessonPackSchema.safeParse(value);
  if (parsed.success) return { file, valid: true, issues: [] };
  return {
    file,
    valid: false,
    issues: parsed.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "<root>";
      return `${path}: ${issue.message}`;
    }),
  };
}

function defaultPackPaths(): string[] {
  const directory = resolve(process.cwd(), "content", "lesson-packs");
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => resolve(directory, file));
}

export function validateLessonPackFile(file: string): ValidationResult {
  try {
    return validateLessonPackValue(JSON.parse(readFileSync(file, "utf8")), file);
  } catch (error) {
    return {
      file,
      valid: false,
      issues: [`<root>: ${error instanceof Error ? error.message : "Unreadable JSON."}`],
    };
  }
}

export function runValidation(files = process.argv.slice(2)): number {
  const paths = files.length ? files.map((file) => resolve(file)) : defaultPackPaths();
  const results = paths.map(validateLessonPackFile);
  for (const result of results) {
    if (result.valid) {
      console.log(`PASS ${result.file}`);
    } else {
      console.error(`FAIL ${result.file}`);
      for (const issue of result.issues) console.error(`  - ${issue}`);
    }
  }
  console.log(`${results.filter((result) => result.valid).length}/${results.length} lesson packs valid.`);
  return results.every((result) => result.valid) ? 0 : 1;
}

const directUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === directUrl) process.exitCode = runValidation();
