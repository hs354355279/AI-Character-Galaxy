import type { ExplorationMission } from "@/lib/lessons/schema";

export interface MissionEvidence {
  selectedCharacterIds: string[];
  selectedRelationshipIds: string[];
  writtenResponse: string;
}

export interface MissionEvaluation {
  complete: boolean;
  feedback: string;
}

function containsOrderedSequence(values: string[], sequence: string[]): boolean {
  if (sequence.length === 0) return true;
  let sequenceIndex = 0;
  for (const value of values) {
    if (value === sequence[sequenceIndex]) sequenceIndex += 1;
    if (sequenceIndex === sequence.length) return true;
  }
  return false;
}

export function evaluateMission(
  mission: ExplorationMission,
  evidence: MissionEvidence,
): MissionEvaluation {
  const selectedCharacters = new Set(evidence.selectedCharacterIds);
  const selectedRelationships = new Set(evidence.selectedRelationshipIds);
  const responseLength = evidence.writtenResponse.trim().length;
  const rule = mission.completionRule;

  switch (rule.kind) {
    case "select-character": {
      const matches = rule.characterIds.filter((id) => selectedCharacters.has(id)).length;
      return matches >= rule.minimumSelections
        ? { complete: true, feedback: "Character discovered." }
        : { complete: false, feedback: "Keep exploring the character groups." };
    }
    case "select-group-members": {
      const matches = rule.characterIds.filter((id) => selectedCharacters.has(id)).length;
      return matches >= rule.minimumSelections
        ? { complete: true, feedback: "Group mapped." }
        : { complete: false, feedback: `Find ${rule.minimumSelections - matches} more group member${rule.minimumSelections - matches === 1 ? "" : "s"}.` };
    }
    case "trace-relationships": {
      const endpointsSelected =
        selectedCharacters.has(rule.startCharacterId) &&
        selectedCharacters.has(rule.endCharacterId);
      const ordered = containsOrderedSequence(
        evidence.selectedRelationshipIds,
        rule.orderedRelationshipIds,
      );
      return endpointsSelected && ordered
        ? { complete: true, feedback: "Path discovered." }
        : { complete: false, feedback: "Follow the relationships from the starting character to the destination." };
    }
    case "compare-characters": {
      const bothSelected = rule.characterIds.every((id) => selectedCharacters.has(id));
      return bothSelected && responseLength >= rule.minimumResponseLength
        ? { complete: true, feedback: "Comparison supported." }
        : { complete: false, feedback: "Select both characters and compare them with specific evidence." };
    }
    case "explain-relationship":
    case "cause-and-effect": {
      const hasEvidence = rule.relationshipIds.some((id) => selectedRelationships.has(id));
      return hasEvidence && responseLength >= rule.minimumResponseLength
        ? { complete: true, feedback: rule.kind === "cause-and-effect" ? "Cause and effect explained." : "Relationship explained." }
        : { complete: false, feedback: "Open a relevant relationship and explain what its evidence shows." };
    }
  }
}
