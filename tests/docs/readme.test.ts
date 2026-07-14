import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("OpenAI Build Week handoff", () => {
  it("documents every required setup, safety, architecture, and judging topic", () => {
    const readme = read("README.md");
    for (const heading of [
      "Problem",
      "What AI Character Galaxy does",
      "Demo paths",
      "Quick start",
      "Environment",
      "Offline behavior",
      "GPT-5.6 usage",
      "Content pipeline",
      "Architecture",
      "Accessibility",
      "Safety and privacy",
      "Testing",
      "Codex-assisted development",
      "License",
      "Third-party content",
      "Devpost",
      "Session ID",
    ]) {
      expect(readme).toContain(`## ${heading}`);
    }
    expect(readme).toContain("npm run verify");
    expect(readme).toContain("npm run test:e2e");
    expect(readme).toContain("OPENAI_API_KEY");
    expect(readme).toContain("019f60d5-b064-7520-aed3-b2c0f6c9dc42");
  });

  it("includes the open-source and submission handoff files", () => {
    for (const path of [
      "LICENSE",
      "THIRD_PARTY_CONTENT.md",
      "docs/ARCHITECTURE.md",
      "docs/DEMO_SCRIPT.md",
      "docs/DEVPOST_SUBMISSION.md",
      "public/og-image.svg",
    ]) {
      expect(existsSync(resolve(root, path)), `${path} should exist`).toBe(true);
    }
    expect(read("LICENSE")).toContain("MIT License");
    expect(read("THIRD_PARTY_CONTENT.md")).toContain("CC BY-SA 4.0");
    expect(read("docs/DEMO_SCRIPT.md")).toContain("02:45");
  });

  it("preserves the live Devpost custom-field mapping", () => {
    const submission = read("docs/DEVPOST_SUBMISSION.md");
    for (const fieldId of ["27945", "27946", "27947", "27948", "27949", "27950", "27951"]) {
      expect(submission).toContain(fieldId);
    }
    expect(submission).toContain("Education");
    expect(submission).toContain("USER-OWNED PUBLICATION INPUT");
  });
});
