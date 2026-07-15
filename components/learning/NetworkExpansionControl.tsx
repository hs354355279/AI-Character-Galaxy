"use client";

import { useId, useState } from "react";
import {
  NetworkExpansionBatchSchema,
  type NetworkExpansionBatch,
  type RuntimeCharacter,
} from "@/lib/network-expansion/schemas";

class ExpansionRequestError extends Error {
  constructor(readonly status: number) {
    super("Relationship network expansion failed.");
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "The relationship search timed out. Try again.";
  }
  if (error instanceof ExpansionRequestError) {
    if (error.status === 422) return "No new verified relationships were found for this person.";
    if (error.status === 503) return "GPT-5.6 network expansion is not configured.";
  }
  return "The relationship network could not be expanded right now.";
}

export function NetworkExpansionControl({
  lessonId,
  focus,
  sessionId,
  existingCharacterNames,
  existingRelationshipKeys,
  disabledReason,
  onExpanded,
}: {
  lessonId: string;
  focus: RuntimeCharacter;
  sessionId: string;
  existingCharacterNames: string[];
  existingRelationshipKeys: string[];
  disabledReason?: string;
  onExpanded: (batch: NetworkExpansionBatch) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusId = useId();

  const expand = async () => {
    if (state === "loading" || disabledReason) return;
    setState("loading");
    setMessage("Researching verified relationships…");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch("/api/learning/expand-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          lessonId,
          focus: {
            id: focus.id,
            name: focus.name,
            role: focus.role,
            summary: focus.summary,
          },
          existingCharacterNames,
          existingRelationshipKeys,
          sessionId,
        }),
      });
      if (!response.ok) throw new ExpansionRequestError(response.status);
      const payload = await response.json() as { source?: unknown; data?: unknown };
      if (payload.source !== "gpt-5.6") throw new Error("Unexpected expansion source.");
      const batch = NetworkExpansionBatchSchema.parse(payload.data);
      onExpanded(batch);
      const names = batch.characters.map((character) => character.name);
      const noun = names.length === 1 ? "person" : "people";
      setMessage(`Added ${names.length} ${noun}: ${names.join(", ")}`);
      setState("success");
    } catch (error) {
      setMessage(errorMessage(error));
      setState("error");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const unavailable = disabledReason ?? "";
  return (
    <section
      className="network-expansion"
      aria-label="AI relationship network expansion"
      aria-busy={state === "loading"}
      data-state={state}
    >
      <div className="network-expansion-heading">
        <span className="network-expansion-orbit" aria-hidden="true"><i /></span>
        <div>
          <p className="eyebrow">Web-grounded network</p>
          <strong>Discover documented connections</strong>
        </div>
      </div>
      <button
        className="network-expansion-action pressable"
        type="button"
        disabled={state === "loading" || Boolean(disabledReason)}
        aria-describedby={statusId}
        onClick={expand}
      >
        {state === "loading"
          ? "Researching verified relationships…"
          : "Expand relationship galaxy with GPT-5.6"}
      </button>
      <p id={statusId} className="network-expansion-status" role="status" aria-live="polite">
        {unavailable || message}
      </p>
    </section>
  );
}
