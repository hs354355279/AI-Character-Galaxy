"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import { CharacterFilters } from "@/components/characters/CharacterFilters";
import { CharacterResearchForm } from "@/components/characters/CharacterResearchForm";
import {
  CharacterResearchResult,
  type CharacterResearchResponse,
} from "@/components/characters/CharacterResearchResult";
import {
  filterCharacters,
  type CharacterDirectoryEntry,
  type CharacterFilters as Filters,
} from "@/lib/characters/directory";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

const lessons = getAllLessonPacks().map(createLandingLesson);
const initialFilters: Filters = { query: "", lessonId: "all", groupId: "all" };

export function CharacterAtlas({ entries }: { entries: CharacterDirectoryEntry[] }) {
  const [filters, setFilters] = useState(initialFilters);
  const [researchResult, setResearchResult] = useState<CharacterResearchResponse | null>(null);
  const filtered = useMemo(() => filterCharacters(entries, filters), [entries, filters]);

  return (
    <main className="character-atlas-page">
      <SmoothScrollProvider />
      <ExhibitionHeader lessons={lessons} theme="paper" />
      <header className="character-atlas-hero">
        <p className="editorial-kicker">People register · Reviewed course material</p>
        <h1>Every story<br />starts with a person.</h1>
        <div>
          <p>Browse the people already grounded in course evidence, then enter their constellation at the exact point of interest.</p>
          <span>{entries.length} reviewed profiles · 2 course universes</span>
        </div>
      </header>

      <section className="character-research" aria-labelledby="character-research-title">
        <div className="character-research-intro">
          <p>01 · Open research</p>
          <h2 id="character-research-title">Bring another person<br />into view.</h2>
          <span>GPT‑5.6 searches current web sources, verifies the identity, and returns a structured learning profile. Generated research stays separate from reviewed course content.</span>
        </div>
        <CharacterResearchForm onResult={setResearchResult} />
        {researchResult ? <CharacterResearchResult result={researchResult} /> : null}
      </section>

      <section className="character-atlas-directory" aria-labelledby="character-atlas-title">
        <div className="character-atlas-toolbar">
          <div>
            <p>02 · Reviewed atlas</p>
            <h2 id="character-atlas-title">Character index</h2>
          </div>
          <CharacterFilters entries={entries} value={filters} onChange={setFilters} />
        </div>
        <p className="character-result-count" aria-live="polite">{filtered.length} reviewed people</p>
        <div className="character-atlas-list">
          {filtered.map((entry, index) => (
            <article
              key={entry.id}
              className="character-atlas-row"
              style={{ "--character-accent": entry.group.color } as CSSProperties}
            >
              <span className="character-atlas-number">{String(index + 1).padStart(2, "0")}</span>
              <i aria-hidden="true">{entry.group.symbol}</i>
              <div className="character-atlas-identity">
                <p>{entry.lessonTitle}</p>
                <h3>{entry.name}</h3>
                <span>{entry.role}</span>
              </div>
              <p className="character-atlas-summary">{entry.summary}</p>
              <div className="character-atlas-links">
                <Link href={entry.lessonHref} aria-label={`Open ${entry.name} in course`}>
                  Enter constellation <span aria-hidden="true">↗</span>
                </Link>
                <Link href={entry.sourceHref}>Sources</Link>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <div className="character-atlas-empty" role="status">
              <h3>No reviewed profile matches.</h3>
              <button type="button" onClick={() => setFilters(initialFilters)}>Clear filters</button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
