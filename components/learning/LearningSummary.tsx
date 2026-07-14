import Link from "next/link";
import type { LessonPack } from "@/lib/lessons/schema";
import type { LearningSession } from "@/lib/session/learning-session";

export function LearningSummary({ lesson, session }: { lesson: LessonPack; session: LearningSession }) {
  return (
    <section className="learning-summary site-shell">
      <header>
        <p className="eyebrow">Lesson complete</p>
        <h1 className="display-title">My Relationship Discoveries</h1>
        <p className="body-copy">A private, session-only snapshot of the connections you explored.</p>
      </header>
      <div className="summary-metrics">
        <div><strong>{session.visitedCharacterIds.length}</strong><span>characters visited</span></div>
        <div><strong>{session.visitedRelationshipIds.length}</strong><span>relationships opened</span></div>
        <div><strong>{session.completedMissionIds.length}</strong><span>missions completed</span></div>
      </div>
      <div className="summary-grid">
        <div className="glass-material summary-card"><h2>What you discovered</h2><ul>{lesson.preparedSummary.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="glass-material summary-card"><p className="eyebrow">Continue thinking</p><h2>{lesson.discussionQuestions[0]}</h2><p>Try explaining your answer to a classmate using one person and one relationship as evidence.</p></div>
      </div>
      <div className="summary-actions"><Link className="primary-action pressable" href="/">Explore another lesson</Link><Link className="secondary-action pressable" href={`/sources/${lesson.slug}`}>Review sources</Link></div>
    </section>
  );
}
