"use client";

import type { CharacterDirectoryEntry, CharacterFilters as Filters } from "@/lib/characters/directory";

export function CharacterFilters({
  entries,
  value,
  onChange,
}: {
  entries: CharacterDirectoryEntry[];
  value: Filters;
  onChange: (filters: Filters) => void;
}) {
  const lessons = [...new Map(entries.map((entry) => [entry.lessonId, entry.lessonTitle]))];
  const groups = [...new Map(entries.map((entry) => [entry.group.id, entry.group.name]))];

  return (
    <form className="character-filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="character-search">
        <span>Search the reviewed index</span>
        <input
          type="search"
          aria-label="Search reviewed people"
          value={value.query}
          placeholder="Name, role, idea, or group"
          onChange={(event) => onChange({ ...value, query: event.target.value })}
        />
      </label>
      <label>
        <span>Course</span>
        <select
          value={value.lessonId}
          onChange={(event) => onChange({ ...value, lessonId: event.target.value })}
        >
          <option value="all">All courses</option>
          {lessons.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
      </label>
      <label>
        <span>Constellation</span>
        <select
          value={value.groupId}
          onChange={(event) => onChange({ ...value, groupId: event.target.value })}
        >
          <option value="all">All groups</option>
          {groups.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
    </form>
  );
}
