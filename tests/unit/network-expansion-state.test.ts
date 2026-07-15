import { describe, expect, it } from "vitest";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  EXPANDED_GROUP_ID,
  NetworkExpansionBatchSchema,
  RelationshipNetworkExpansionStateSchema,
  type NetworkExpansionBatch,
  type RelationshipNetworkExpansionState,
} from "@/lib/network-expansion/schemas";
import {
  createEmptyExpansionState,
  createExpandedCharacterId,
  createExpandedRelationshipId,
  createRuntimeRelationshipGraph,
  mergeExpansionBatch,
} from "@/lib/network-expansion/runtime-graph";

const lesson = getLessonPack("french-revolution")!;

function candidate(name: string, id = createExpandedCharacterId(name)) {
  return {
    id,
    name,
    aliases: [],
    role: "Political writer",
    summary: `${name} participated in the political debates surrounding rights, authority, and revolutionary change.`,
    groupId: EXPANDED_GROUP_ID,
    importance: 3,
    sourceRefIds: [`source-${id}`],
    learningTags: ["rights"],
    provenance: "ai-expanded" as const,
    citationIds: [`source-${id}`],
  };
}

function relationship(focusId: string, targetId: string) {
  return {
    id: createExpandedRelationshipId(focusId, targetId, "influence"),
    fromCharacterId: focusId,
    toCharacterId: targetId,
    type: "influence" as const,
    direction: "directed" as const,
    strength: 4,
    summary: "Their published ideas formed a documented intellectual connection.",
    evidenceSummary: "Contemporary writing and later scholarship document this influence.",
    sourceRefIds: [`source-${targetId}`],
    confidence: 0.88,
    isDisputed: false,
    learningTags: ["influence"],
    provenance: "ai-expanded" as const,
    citationIds: [`source-${targetId}`],
  };
}

function batch(names = ["Mary Wollstonecraft", "Nicolas de Condorcet", "Thomas Paine"]): NetworkExpansionBatch {
  const characters = names.map((name) => candidate(name));
  return {
    focusCharacterId: "olympe-de-gouges",
    characters,
    relationships: characters.map((item) => relationship("olympe-de-gouges", item.id)),
    citations: characters.map((item) => ({
      id: item.citationIds[0],
      title: `${item.name} biography`,
      url: `https://example.org/${item.id}`,
    })),
    generatedAt: "2026-07-16T00:00:00.000Z",
  };
}

describe("relationship network expansion state", () => {
  it("parses only strict, bounded expansion records", () => {
    expect(NetworkExpansionBatchSchema.parse(batch()).characters).toHaveLength(3);
    expect(() => NetworkExpansionBatchSchema.parse({ ...batch(), extra: true })).toThrow();
    expect(() => NetworkExpansionBatchSchema.parse({
      ...batch(["One", "Two", "Three"]),
      characters: [...batch().characters, candidate("Fourth")],
    })).toThrow();
    expect(RelationshipNetworkExpansionStateSchema.parse(
      createEmptyExpansionState(lesson.id),
    ).schemaVersion).toBe("1.0");
  });

  it("creates deterministic AI identifiers", () => {
    expect(createExpandedCharacterId("  Mary Wollstonecraft ")).toBe("ai-mary-wollstonecraft");
    expect(createExpandedCharacterId("Mary—Wollstonecraft")).toBe("ai-mary-wollstonecraft");
    expect(createExpandedRelationshipId("olympe-de-gouges", "ai-mary-wollstonecraft", "influence"))
      .toBe("ai-olympe-de-gouges-ai-mary-wollstonecraft-influence");
  });

  it("merges additions without mutating the reviewed lesson", () => {
    const original = structuredClone(lesson);
    const next = mergeExpansionBatch(lesson, createEmptyExpansionState(lesson.id), batch());
    const graph = createRuntimeRelationshipGraph(lesson, next);

    expect(graph.characters).toHaveLength(lesson.characters.length + 3);
    expect(graph.relationships).toHaveLength(lesson.relationships.length + 3);
    expect(graph.characters.filter((item) => item.provenance === "ai-expanded")).toHaveLength(3);
    expect(graph.groups.at(-1)).toMatchObject({ id: EXPANDED_GROUP_ID, symbol: "AI" });
    expect(lesson).toEqual(original);
  });

  it("deduplicates existing people by name and remaps their new relationship", () => {
    const existing = candidate("Jean-Jacques Rousseau", "ai-duplicate-rousseau");
    const duplicateBatch: NetworkExpansionBatch = {
      ...batch([]),
      characters: [existing],
      relationships: [relationship("olympe-de-gouges", existing.id)],
      citations: [{ id: existing.citationIds[0], title: "Rousseau", url: "https://example.org/rousseau" }],
    };
    const next = mergeExpansionBatch(lesson, createEmptyExpansionState(lesson.id), duplicateBatch);

    expect(next.characters).toHaveLength(0);
    expect(next.relationships[0].toCharacterId).toBe("rousseau");
  });

  it("enforces the twelve-person session limit without creating dangling edges", () => {
    const fullCharacters = Array.from({ length: 12 }, (_, index) => candidate(`Added Person ${index + 1}`));
    const fullState: RelationshipNetworkExpansionState = {
      ...createEmptyExpansionState(lesson.id),
      characters: fullCharacters,
    };
    const next = mergeExpansionBatch(lesson, fullState, batch(["Thirteenth Person"]));

    expect(next.characters).toHaveLength(12);
    expect(next.relationships).toHaveLength(0);
  });
});
