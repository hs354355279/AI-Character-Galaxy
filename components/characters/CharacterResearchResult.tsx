"use client";

import type {
  CharacterResearchCitation,
  CharacterResearchProfile,
} from "@/lib/openai/character-schemas";

export interface CharacterResearchResponse {
  source: "gpt-5.6";
  data: CharacterResearchProfile;
  citations: CharacterResearchCitation[];
}

export function CharacterResearchResult({ result }: { result: CharacterResearchResponse }) {
  const { data, citations } = result;
  return (
    <section className="character-research-result" aria-labelledby="research-result-name">
      <header>
        <p>Generated with GPT‑5.6 · Web-grounded</p>
        <span>{data.era}</span>
        <h2 id="research-result-name">{data.canonicalName}</h2>
        <strong>{data.descriptor}</strong>
      </header>
      <div className="research-result-summary">
        <p>{data.summary}</p>
      </div>
      <section>
        <p className="research-result-number">01 · Learning value</p>
        <h3>Why this person matters</h3>
        <p>{data.whyItMatters}</p>
      </section>
      <section>
        <p className="research-result-number">02 · Relationship field</p>
        <h3>People around them</h3>
        <div className="research-relationships">
          {data.relationships.map((relationship, index) => (
            <article key={`${relationship.name}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h4>{relationship.name}</h4>
              <p>{relationship.connection}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <p className="research-result-number">03 · Inquiry</p>
        <h3>Questions to carry forward</h3>
        <ol className="research-prompts">
          {data.studyPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
        </ol>
      </section>
      <footer>
        <p>Sources used for this generated profile</p>
        {citations.length > 0 ? (
          <div className="research-citations">
            {citations.map((citation) => (
              <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer">
                {citation.title} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : <span>No public citation links were returned.</span>}
      </footer>
    </section>
  );
}
