import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RelationshipListView } from "@/components/accessibility/RelationshipListView";
import { CharacterRail } from "@/components/learning/CharacterRail";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  createEmptyExpansionState,
  createRuntimeRelationshipGraph,
  mergeExpansionBatch,
} from "@/lib/network-expansion/runtime-graph";
import type { NetworkExpansionBatch } from "@/lib/network-expansion/schemas";

const lesson = getLessonPack("french-revolution")!;
const batch: NetworkExpansionBatch = {
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
    learningTags: ["rights"],
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
  citations: [{ id: "source-wollstonecraft", title: "Biography", url: "https://example.org/wollstonecraft" }],
  generatedAt: "2026-07-16T00:00:00.000Z",
};
const graph = createRuntimeRelationshipGraph(
  lesson,
  mergeExpansionBatch(lesson, createEmptyExpansionState(lesson.id), batch),
);

describe("runtime relationship graph surfaces", () => {
  it("renders AI provenance in the 2D list", () => {
    render(
      <RelationshipListView
        graph={graph}
        selectedCharacterIds={[]}
        selectedRelationshipIds={[]}
        onSelectCharacter={vi.fn()}
        onSelectRelationship={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /inspect mary wollstonecraft/i })).toHaveTextContent("AI expanded");
    expect(screen.getByText(/olympe de gouges.*mary wollstonecraft/i)).toBeVisible();
  });

  it("renders AI provenance in the people filmstrip", () => {
    render(
      <CharacterRail
        characters={graph.characters}
        groups={graph.groups}
        selectedCharacterId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Select Mary Wollstonecraft" })).toHaveTextContent("AI expanded");
  });
});
