"use client";

import type { LessonPack } from "@/lib/lessons/schema";

export function RelationshipListView({
  lesson,
  selectedCharacterIds,
  selectedRelationshipIds,
  onSelectCharacter,
  onSelectRelationship,
}: {
  lesson: LessonPack;
  selectedCharacterIds: string[];
  selectedRelationshipIds: string[];
  onSelectCharacter: (id: string) => void;
  onSelectRelationship: (id: string) => void;
}) {
  return (
    <div className="relationship-list-view" aria-label="2D relationship list">
      <div className="relationship-list-heading">
        <div>
          <p className="eyebrow">Accessible map</p>
          <h2>People and relationships</h2>
        </div>
        <span>{lesson.characters.length} people · {lesson.relationships.length} links</span>
      </div>
      <div className="character-groups">
        {lesson.groups.map((group) => {
          const characters = lesson.characters.filter((character) => character.groupId === group.id);
          return (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="group-heading">
                <span className="group-marker" style={{ backgroundColor: group.color }} aria-hidden="true">{group.symbol}</span>
                <div><h3 id={`group-${group.id}`}>{group.name}</h3><p>{group.description}</p></div>
              </div>
              <div className="character-button-grid">
                {characters.map((character) => (
                  <button
                    className="character-list-button pressable"
                    type="button"
                    key={character.id}
                    aria-label={`Inspect ${character.name} in 2D list`}
                    aria-pressed={selectedCharacterIds.includes(character.id)}
                    onClick={() => onSelectCharacter(character.id)}
                  >
                    <span>{character.name}</span>
                    <small>{character.role}</small>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <section className="relationship-index" aria-labelledby="relationship-index-title">
        <h3 id="relationship-index-title">Relationship evidence</h3>
        <div className="relationship-button-list">
          {lesson.relationships.map((relationship) => {
            const from = lesson.characters.find((item) => item.id === relationship.fromCharacterId)!;
            const to = lesson.characters.find((item) => item.id === relationship.toCharacterId)!;
            return (
              <button
                type="button"
                className="relationship-list-button pressable"
                key={relationship.id}
                aria-pressed={selectedRelationshipIds.includes(relationship.id)}
                onClick={() => onSelectRelationship(relationship.id)}
              >
                <span className={`relationship-type ${relationship.isDisputed ? "is-disputed" : ""}`}>
                  {relationship.type.replaceAll("-", " ")}{relationship.isDisputed ? " · disputed" : ""}
                </span>
                <strong>{from.name} {relationship.direction === "directed" ? "→" : "↔"} {to.name}</strong>
                <small>{relationship.summary}</small>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
