import Link from "next/link";
import { AiInsight } from "@/components/learning/AiInsight";
import type { CharacterNode, LessonPack, RelationshipEdge } from "@/lib/lessons/schema";

export function EvidencePanel({
  lesson,
  character,
  relationship,
  sessionId,
}: {
  lesson: LessonPack;
  character: CharacterNode | null;
  relationship: RelationshipEdge | null;
  sessionId: string;
}) {
  if (relationship) {
    const from = lesson.characters.find((item) => item.id === relationship.fromCharacterId)!;
    const to = lesson.characters.find((item) => item.id === relationship.toCharacterId)!;
    return (
      <div className="evidence-content">
        <p className="eyebrow">Relationship evidence</p>
        <h2>{from.name} {relationship.direction === "directed" ? "→" : "↔"} {to.name}</h2>
        <span className="evidence-badge">{relationship.type.replaceAll("-", " ")}</span>
        <p>{relationship.summary}</p>
        <div className="evidence-callout"><strong>What the source supports</strong><p>{relationship.evidenceSummary}</p>{relationship.evidenceLocation && <small>{relationship.evidenceLocation}</small>}</div>
        {relationship.isDisputed && <div className="dispute-note"><strong>Interpretation note</strong><p>{relationship.disputeNote}</p></div>}
        <Link href={`/sources/${lesson.slug}`}>Open lesson sources ↗</Link>
        <AiInsight key={relationship.id} lessonId={lesson.id} relationshipId={relationship.id} sessionId={sessionId} />
      </div>
    );
  }

  if (character) {
    const group = lesson.groups.find((item) => item.id === character.groupId)!;
    return (
      <div className="evidence-content">
        <p className="eyebrow">Character</p>
        <h2>{character.name}</h2>
        <span className="evidence-badge">{group.symbol} · {group.name}</span>
        <strong>{character.role}</strong>
        <p>{character.summary}</p>
        <div className="tag-list">{character.learningTags.map((tag) => <span key={tag}>{tag.replaceAll("-", " ")}</span>)}</div>
        <Link href={`/sources/${lesson.slug}`}>Open character sources ↗</Link>
        <AiInsight key={character.id} lessonId={lesson.id} characterId={character.id} sessionId={sessionId} />
      </div>
    );
  }

  return (
    <div className="evidence-empty">
      <span aria-hidden="true">✦</span>
      <h2>Explore the evidence</h2>
      <p>Select a person or relationship. Required facts are always available here and in the 2D list.</p>
    </div>
  );
}
