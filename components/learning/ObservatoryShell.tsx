import type { ReactNode } from "react";
import type { LessonPack } from "@/lib/lessons/schema";

export function ObservatoryShell({
  lesson,
  mission,
  galaxy,
  evidence,
  characterIndex,
  status,
}: {
  lesson: LessonPack;
  mission: ReactNode;
  galaxy: ReactNode;
  evidence: ReactNode;
  characterIndex: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div className="observatory-shell">
      <aside className="mission-panel" aria-label="Current mission">
        {mission}
      </aside>
      <section className="observatory-stage" aria-label="Relationship observatory">
        <header className="observatory-caption">
          <span>{lesson.kind}</span>
          <strong>{lesson.title}</strong>
          <i>{lesson.characters.length} people · {lesson.relationships.length} relationships</i>
        </header>
        {status}
        <div className="galaxy-viewport">{galaxy}</div>
        <aside className="evidence-panel" aria-label="Evidence sheet">
          {evidence}
        </aside>
        <nav className="observatory-filmstrip" aria-label="People filmstrip">
          {characterIndex}
        </nav>
      </section>
    </div>
  );
}
