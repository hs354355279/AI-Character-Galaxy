import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyExpansionState } from "@/lib/network-expansion/runtime-graph";
import {
  expansionStorageKey,
  loadExpansionState,
  saveExpansionState,
} from "@/lib/network-expansion/storage";

describe("relationship expansion session storage", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("round-trips a valid state in the lesson-specific key", () => {
    const state = createEmptyExpansionState("french-revolution");
    saveExpansionState(state, window.sessionStorage);

    expect(window.sessionStorage.getItem(expansionStorageKey("french-revolution"))).toContain("french-revolution");
    expect(loadExpansionState("french-revolution", window.sessionStorage)).toEqual(state);
  });

  it("discards malformed, mismatched, and unsupported state", () => {
    window.sessionStorage.setItem(expansionStorageKey("french-revolution"), "not-json");
    expect(loadExpansionState("french-revolution", window.sessionStorage).characters).toEqual([]);

    window.sessionStorage.setItem(expansionStorageKey("french-revolution"), JSON.stringify({
      ...createEmptyExpansionState("romeo-and-juliet"),
      schemaVersion: "2.0",
    }));
    expect(loadExpansionState("french-revolution", window.sessionStorage))
      .toEqual(createEmptyExpansionState("french-revolution"));
  });
});
