"use client";

import type { CharacterGroup } from "@/lib/lessons/schema";
import type { RuntimeCharacter } from "@/lib/network-expansion/schemas";

export function CharacterRail({
  characters,
  groups,
  selectedCharacterId,
  onSelect,
}: {
  characters: RuntimeCharacter[];
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
                {character.provenance === "ai-expanded" ? <em>AI expanded</em> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
