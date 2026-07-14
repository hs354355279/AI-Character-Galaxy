import type { LessonPack } from "@/lib/lessons/schema";
import { MaterialPanel } from "@/components/shared/MaterialPanel";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function SourceList({ lesson }: { lesson: LessonPack }) {
  return (
    <div className="source-list">
      {lesson.sources.map((source) => (
        <MaterialPanel className="source-card" key={source.id}>
          <div>
            <p className="eyebrow">{source.publisher}</p>
            <h2><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></h2>
          </div>
          <dl>
            <div><dt>License</dt><dd>{source.license}</dd></div>
            <div><dt>Access</dt><dd>Retrieved {formatDate(source.retrievedAt)}</dd></div>
          </dl>
          <p>{source.attributionText}</p>
        </MaterialPanel>
      ))}
      <p className="content-license-note">
        The application code license does not cover third-party content. Follow the terms for each linked source in your jurisdiction.
      </p>
    </div>
  );
}
