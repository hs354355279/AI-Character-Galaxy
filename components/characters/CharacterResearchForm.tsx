"use client";

import { useState } from "react";
import type { CharacterResearchResponse } from "@/components/characters/CharacterResearchResult";

const SESSION_KEY = "acg.character-research-session";

function getResearchSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sessionId = `research-${random}`;
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function messageForStatus(status: number): string {
  if (status === 400) return "Check the name and optional context, then try again.";
  if (status === 422) return "We could not verify that person. Add a full name or more context.";
  if (status === 503) return "Character research is not configured on this server.";
  return "Research sources are temporarily unavailable. Please try again.";
}

export function CharacterResearchForm({
  onResult,
}: {
  onResult: (result: CharacterResearchResponse) => void;
}) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || name.trim().length < 2) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/characters/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          context: context.trim() || undefined,
          sessionId: getResearchSessionId(),
        }),
      });
      if (!response.ok) {
        setError(messageForStatus(response.status));
        return;
      }
      onResult(await response.json() as CharacterResearchResponse);
    } catch {
      setError("Research sources are temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="character-research-form" onSubmit={submit}>
      <label>
        <span>Character name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Mary Wollstonecraft"
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      <label>
        <span>Context <i>optional</i></span>
        <input
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Era, work, location, or learning focus"
          maxLength={300}
        />
      </label>
      <button type="submit" disabled={pending || name.trim().length < 2}>
        {pending ? "Researching…" : "Research character"} <span aria-hidden="true">↗</span>
      </button>
      {pending ? <p className="research-pending" role="status">Researching sources and verifying identity…</p> : null}
      {error ? <p className="research-error" role="alert">{error}</p> : null}
    </form>
  );
}
