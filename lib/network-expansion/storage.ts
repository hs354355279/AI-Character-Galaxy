import { RelationshipNetworkExpansionStateSchema } from "@/lib/network-expansion/schemas";
import { createEmptyExpansionState } from "@/lib/network-expansion/runtime-graph";
import type { RelationshipNetworkExpansionState } from "@/lib/network-expansion/schemas";

export function expansionStorageKey(lessonId: string): string {
  return `ai-character-galaxy:network-expansion:${lessonId}`;
}

export function loadExpansionState(
  lessonId: string,
  storage: Pick<Storage, "getItem">,
): RelationshipNetworkExpansionState {
  try {
    const raw = storage.getItem(expansionStorageKey(lessonId));
    if (!raw) return createEmptyExpansionState(lessonId);
    const parsed = RelationshipNetworkExpansionStateSchema.parse(JSON.parse(raw));
    return parsed.lessonId === lessonId ? parsed : createEmptyExpansionState(lessonId);
  } catch {
    return createEmptyExpansionState(lessonId);
  }
}

export function saveExpansionState(
  state: RelationshipNetworkExpansionState,
  storage: Pick<Storage, "setItem">,
): void {
  const parsed = RelationshipNetworkExpansionStateSchema.parse(state);
  storage.setItem(expansionStorageKey(parsed.lessonId), JSON.stringify(parsed));
}
