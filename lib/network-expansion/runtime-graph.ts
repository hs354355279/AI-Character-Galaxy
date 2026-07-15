import type { LessonPack, RelationshipEdge } from "@/lib/lessons/schema";
import {
  EXPANDED_GROUP,
  EXPANDED_GROUP_ID,
  MAX_EXPANDED_CHARACTERS,
  NetworkExpansionBatchSchema,
  RelationshipNetworkExpansionStateSchema,
  type ExpandedCharacter,
  type ExpandedRelationship,
  type NetworkExpansionBatch,
  type RelationshipGraph,
  type RelationshipNetworkExpansionState,
} from "@/lib/network-expansion/schemas";

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "person";
}

function identityNames(character: { name: string; aliases: string[] }): string[] {
  return [character.name, ...character.aliases].map((name) => (
    name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en")
  ));
}

export function createRelationshipKey(edge: Pick<RelationshipEdge, "fromCharacterId" | "toCharacterId" | "type" | "direction">): string {
  const endpoints = edge.direction === "undirected"
    ? [edge.fromCharacterId, edge.toCharacterId].sort()
    : [edge.fromCharacterId, edge.toCharacterId];
  return `${edge.direction}:${endpoints[0]}:${endpoints[1]}:${edge.type}`;
}

export function createExpandedCharacterId(name: string): string {
  return `ai-${slug(name)}`;
}

export function createExpandedRelationshipId(
  fromCharacterId: string,
  toCharacterId: string,
  type: RelationshipEdge["type"],
): string {
  return `ai-${slug(fromCharacterId)}-${slug(toCharacterId)}-${type}`;
}

export function createEmptyExpansionState(lessonId: string): RelationshipNetworkExpansionState {
  return {
    schemaVersion: "1.0",
    lessonId,
    characters: [],
    relationships: [],
    citations: [],
    expansionEvents: [],
  };
}

export function mergeExpansionBatch(
  lesson: LessonPack,
  current: RelationshipNetworkExpansionState,
  input: NetworkExpansionBatch,
): RelationshipNetworkExpansionState {
  const state = RelationshipNetworkExpansionStateSchema.parse(current);
  const batch = NetworkExpansionBatchSchema.parse(input);
  if (state.lessonId !== lesson.id) return createEmptyExpansionState(lesson.id);

  const known = [...lesson.characters, ...state.characters];
  const nameToId = new Map<string, string>();
  for (const character of known) {
    for (const name of identityNames(character)) nameToId.set(name, character.id);
  }

  const usedIds = new Set(known.map((character) => character.id));
  const idMap = new Map<string, string>();
  const additions: ExpandedCharacter[] = [];
  for (const candidate of batch.characters) {
    const existingId = identityNames(candidate).map((name) => nameToId.get(name)).find(Boolean);
    if (existingId) {
      idMap.set(candidate.id, existingId);
      continue;
    }
    if (state.characters.length + additions.length >= MAX_EXPANDED_CHARACTERS) continue;

    let id = candidate.id;
    let suffix = 2;
    while (usedIds.has(id)) id = `${candidate.id}-${suffix++}`;
    const added: ExpandedCharacter = { ...candidate, id, groupId: EXPANDED_GROUP_ID };
    additions.push(added);
    usedIds.add(id);
    idMap.set(candidate.id, id);
    for (const name of identityNames(added)) nameToId.set(name, id);
  }

  const availableIds = new Set([...usedIds]);
  const existingRelationshipKeys = new Set([
    ...lesson.relationships.map(createRelationshipKey),
    ...state.relationships.map(createRelationshipKey),
  ]);
  const relationshipAdditions: ExpandedRelationship[] = [];
  for (const edge of batch.relationships) {
    const fromCharacterId = idMap.get(edge.fromCharacterId) ?? edge.fromCharacterId;
    const toCharacterId = idMap.get(edge.toCharacterId) ?? edge.toCharacterId;
    if (!availableIds.has(fromCharacterId) || !availableIds.has(toCharacterId) || fromCharacterId === toCharacterId) continue;
    const remapped = {
      ...edge,
      id: createExpandedRelationshipId(fromCharacterId, toCharacterId, edge.type),
      fromCharacterId,
      toCharacterId,
    };
    const key = createRelationshipKey(remapped);
    if (existingRelationshipKeys.has(key)) continue;
    existingRelationshipKeys.add(key);
    relationshipAdditions.push(remapped);
  }

  const citationByUrl = new Map(state.citations.map((citation) => [citation.url, citation]));
  for (const citation of batch.citations) {
    if (!citationByUrl.has(citation.url)) citationByUrl.set(citation.url, citation);
  }

  const changed = additions.length > 0 || relationshipAdditions.length > 0;
  return RelationshipNetworkExpansionStateSchema.parse({
    ...state,
    characters: [...state.characters, ...additions],
    relationships: [...state.relationships, ...relationshipAdditions],
    citations: [...citationByUrl.values()],
    expansionEvents: changed ? [...state.expansionEvents, {
      focusCharacterId: batch.focusCharacterId,
      addedCharacterIds: additions.map((character) => character.id),
      addedRelationshipIds: relationshipAdditions.map((relationship) => relationship.id),
      generatedAt: batch.generatedAt,
    }] : state.expansionEvents,
  });
}

export function createRuntimeRelationshipGraph(
  lesson: LessonPack,
  state: RelationshipNetworkExpansionState,
): RelationshipGraph {
  const parsed = RelationshipNetworkExpansionStateSchema.parse(state);
  return {
    id: lesson.id,
    layoutSeed: lesson.layoutSeed,
    groups: parsed.characters.length > 0 ? [...lesson.groups, EXPANDED_GROUP] : [...lesson.groups],
    characters: [
      ...lesson.characters.map((character) => ({
        ...character,
        provenance: "reviewed" as const,
        citationIds: [...character.sourceRefIds],
      })),
      ...parsed.characters,
    ],
    relationships: [
      ...lesson.relationships.map((relationship) => ({
        ...relationship,
        provenance: "reviewed" as const,
        citationIds: [...relationship.sourceRefIds],
      })),
      ...parsed.relationships,
    ],
    citations: [...parsed.citations],
  };
}
