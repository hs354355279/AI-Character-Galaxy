import Link from "next/link";
import { NetworkExpansionControl } from "@/components/learning/NetworkExpansionControl";
import type { LessonPack } from "@/lib/lessons/schema";
import type {
  NetworkExpansionBatch,
  RelationshipGraph,
  RuntimeCharacter,
  RuntimeRelationship,
} from "@/lib/network-expansion/schemas";
import { createRelationshipKey } from "@/lib/network-expansion/runtime-graph";

function CitationLinks({ ids, graph }: { ids: string[]; graph: RelationshipGraph }) {
  const citations = graph.citations.filter((citation) => ids.includes(citation.id));
  if (citations.length === 0) return null;
  return (
    <div className="expansion-citations">
      <strong>Web citations</strong>
      <ul>
        {citations.map((citation) => (
          <li key={citation.id}>
            <a href={citation.url} target="_blank" rel="noreferrer">{citation.title} ↗</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvidencePanel({
  lesson,
  graph,
  character,
  relationship,
  sessionId,
  expansionDisabledReason,
  onExpanded,
}: {
  lesson: LessonPack;
  graph: RelationshipGraph;
  character: RuntimeCharacter | null;
  relationship: RuntimeRelationship | null;
  sessionId: string;
  expansionDisabledReason?: string;
  onExpanded: (batch: NetworkExpansionBatch) => void;
}) {
  if (relationship) {
    const from = graph.characters.find((item) => item.id === relationship.fromCharacterId)!;
    const to = graph.characters.find((item) => item.id === relationship.toCharacterId)!;
    return (
      <div className="evidence-content" data-evidence-state="relationship">
        <p className="eyebrow">Relationship evidence</p>
        <h2>{from.name} {relationship.direction === "directed" ? "→" : "↔"} {to.name}</h2>
        <span className="evidence-badge">{relationship.type.replaceAll("-", " ")}</span>
        {relationship.provenance === "ai-expanded" ? <span className="provenance-badge">AI expanded</span> : null}
        <p>{relationship.summary}</p>
        <div className="evidence-callout"><strong>What the source supports</strong><p>{relationship.evidenceSummary}</p>{relationship.evidenceLocation && <small>{relationship.evidenceLocation}</small>}</div>
        {relationship.provenance === "ai-expanded" ? <small className="confidence-note">Confidence · {Math.round(relationship.confidence * 100)}%</small> : null}
        {relationship.isDisputed && <div className="dispute-note"><strong>Interpretation note</strong><p>{relationship.disputeNote}</p></div>}
        {relationship.provenance === "ai-expanded"
          ? <CitationLinks ids={relationship.citationIds} graph={graph} />
          : <Link href={`/sources/${lesson.slug}`}>Open lesson sources ↗</Link>}
      </div>
    );
  }

  if (character) {
    const group = graph.groups.find((item) => item.id === character.groupId)!;
    const connections = graph.relationships.filter(
      (edge) => edge.fromCharacterId === character.id || edge.toCharacterId === character.id,
    );
    return (
      <div className="evidence-content" data-evidence-state="character">
        <p className="eyebrow">Character</p>
        <h2>{character.name}</h2>
        <span className="evidence-badge">{group.symbol} · {group.name}</span>
        {character.provenance === "ai-expanded" ? <span className="provenance-badge">AI expanded</span> : null}
        <strong>{character.role}</strong>
        <p>{character.summary}</p>
        <div className="tag-list">{character.learningTags.map((tag) => <span key={tag}>{tag.replaceAll("-", " ")}</span>)}</div>
        {character.provenance === "ai-expanded" ? (
          <>
            <div className="expanded-connections">
              <strong>Connections in this galaxy</strong>
              {connections.map((edge) => {
                const otherId = edge.fromCharacterId === character.id ? edge.toCharacterId : edge.fromCharacterId;
                const other = graph.characters.find((item) => item.id === otherId);
                return <p key={edge.id}>{edge.type.replaceAll("-", " ")} · {other?.name}</p>;
              })}
            </div>
            <CitationLinks ids={character.citationIds} graph={graph} />
          </>
        ) : <Link href={`/sources/${lesson.slug}`}>Open character sources ↗</Link>}
        <NetworkExpansionControl
          key={character.id}
          lessonId={lesson.id}
          focus={character}
          sessionId={sessionId}
          existingCharacterNames={graph.characters.flatMap((item) => [item.name, ...item.aliases])}
          existingRelationshipKeys={graph.relationships.map(createRelationshipKey)}
          disabledReason={expansionDisabledReason}
          onExpanded={onExpanded}
        />
      </div>
    );
  }

  return (
    <div className="evidence-empty" data-evidence-state="empty">
      <span aria-hidden="true">✦</span>
      <h2>Explore the evidence</h2>
      <p>Select a person or relationship. Required facts are always available here and in the 2D list.</p>
    </div>
  );
}
