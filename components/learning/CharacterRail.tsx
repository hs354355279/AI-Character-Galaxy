"use client";

import type { CharacterGroup, CharacterNode } from "@/lib/lessons/schema";

export function CharacterRail({
  characters,
  groups,
  selectedCharacterId,
  onSelect,
}: {
  characters: CharacterNode[];
  groups?: CharacterGroup[];
  selectedCharacterId: string | null;
  onSelect: (id: string) => void;
}) {
  const groupById = new Map(groups?.map((group) => [group.id, group]));

  return (
    <div className="character-rail" role="group" aria-label="Character selection">
      <div className="character-rail-heading">
        <span>People in this constellation</span>
        <small>{characters.length} subjects</small>
      </div>
      <div className="character-rail-track">
        {characters.map((character, index) => {
          const group = groupById.get(character.groupId);
          return (
            <button
              key={character.id}
              type="button"
              aria-label={`Select ${character.name}`}
              aria-pressed={selectedCharacterId === character.id}
              onClick={() => onSelect(character.id)}
              style={{ "--character-color": group?.color ?? "#9a86d8" } as React.CSSProperties}
            >
              <i aria-hidden="true">{group?.symbol ?? String(index + 1).padStart(2, "0")}</i>
              <span>
                <strong>{character.name}</strong>
                <small>{character.role}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
