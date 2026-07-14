import { describe, expect, it } from "vitest";
import {
  createLearningSession,
  loadLearningSession,
  saveLearningSession,
  updateLearningSession,
} from "@/lib/session/learning-session";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe("learning session", () => {
  it("deduplicates visited and completed IDs", () => {
    const initial = createLearningSession("french-revolution", "2026-07-14T00:00:00.000Z");
    const updated = updateLearningSession(initial, {
      visitedCharacterIds: ["robespierre", "robespierre"],
      completedMissionIds: ["find-jacobin-leader", "find-jacobin-leader"],
    });
    expect(updated.visitedCharacterIds).toEqual(["robespierre"]);
    expect(updated.completedMissionIds).toEqual(["find-jacobin-leader"]);
  });

  it("round-trips through session storage without identity fields", () => {
    const storage = memoryStorage();
    const session = createLearningSession("romeo-and-juliet", "2026-07-14T00:00:00.000Z");
    saveLearningSession(session, storage);
    const loaded = loadLearningSession("romeo-and-juliet", storage);
    expect(loaded).toEqual(session);
    expect(JSON.stringify(loaded)).not.toMatch(/name|school|email|contact/i);
  });

  it("recovers from corrupt session data", () => {
    const storage = memoryStorage();
    storage.setItem("ai-character-galaxy:session:french-revolution", "not-json");
    expect(loadLearningSession("french-revolution", storage).lessonPackId).toBe(
      "french-revolution",
    );
  });
});
