import type {
  NetworkExpansionBatch,
  RelationshipNetworkExpansionState,
} from "@/lib/network-expansion/schemas";

export const maryExpansionBatch: NetworkExpansionBatch = {
  focusCharacterId: "olympe-de-gouges",
  characters: [{
    id: "ai-mary-wollstonecraft",
    name: "Mary Wollstonecraft",
    aliases: [],
    role: "Writer and political philosopher",
    summary: "Mary Wollstonecraft argued that women deserved education and recognition as rational citizens.",
    groupId: "ai-expanded-network",
    importance: 3,
    sourceRefIds: ["source-wollstonecraft"],
    learningTags: ["rights", "writing"],
    provenance: "ai-expanded",
    citationIds: ["source-wollstonecraft"],
  }],
  relationships: [{
    id: "ai-olympe-de-gouges-ai-mary-wollstonecraft-influence",
    fromCharacterId: "olympe-de-gouges",
    toCharacterId: "ai-mary-wollstonecraft",
    type: "influence",
    direction: "undirected",
    strength: 4,
    summary: "Their published arguments joined a wider debate about women's political rights.",
    evidenceSummary: "Published texts and scholarship document their related interventions in revolutionary rights debates.",
    sourceRefIds: ["source-wollstonecraft"],
    confidence: 0.86,
    isDisputed: false,
    learningTags: ["rights"],
    provenance: "ai-expanded",
    citationIds: ["source-wollstonecraft"],
  }],
  citations: [{
    id: "source-wollstonecraft",
    title: "Mary Wollstonecraft biography",
    url: "https://example.org/wollstonecraft",
  }],
  generatedAt: "2026-07-16T00:00:00.000Z",
};

export const maryExpansionState: RelationshipNetworkExpansionState = {
  schemaVersion: "1.0",
  lessonId: "french-revolution",
  characters: maryExpansionBatch.characters,
  relationships: maryExpansionBatch.relationships,
  citations: maryExpansionBatch.citations,
  expansionEvents: [{
    focusCharacterId: "olympe-de-gouges",
    addedCharacterIds: ["ai-mary-wollstonecraft"],
    addedRelationshipIds: ["ai-olympe-de-gouges-ai-mary-wollstonecraft-influence"],
    generatedAt: "2026-07-16T00:00:00.000Z",
  }],
};
