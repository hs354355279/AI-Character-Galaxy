import { callCharacterResearchModel } from "@/lib/openai/client";
import {
  CharacterResearchProfileSchema,
  CharacterResearchRequestSchema,
  type CharacterModelResult,
  type CharacterResearchCitation,
  type CharacterResearchProfile,
  type CharacterResearchRequest,
} from "@/lib/openai/character-schemas";
import { createSafetyIdentifier } from "@/lib/openai/safety";

export class CharacterResearchConfigurationError extends Error {
  constructor() {
    super("Character research is not configured.");
    this.name = "CharacterResearchConfigurationError";
  }
}

export class CharacterResearchNotFoundError extends Error {
  constructor() {
    super("A verified character profile could not be found.");
    this.name = "CharacterResearchNotFoundError";
  }
}

export class CharacterResearchUpstreamError extends Error {
  constructor(cause?: unknown) {
    super("Character research is temporarily unavailable.", { cause });
    this.name = "CharacterResearchUpstreamError";
  }
}

export type CharacterResearchCaller = (
  input: CharacterResearchRequest,
  safetyIdentifier: string,
) => Promise<CharacterModelResult>;

function usableProfile(profile: CharacterResearchProfile): boolean {
  return (
    profile.canonicalName.trim().length >= 2 &&
    profile.descriptor.trim().length >= 4 &&
    profile.era.trim().length >= 2 &&
    profile.summary.trim().length >= 40 &&
    profile.whyItMatters.trim().length >= 30 &&
    profile.relationships.length >= 2 &&
    profile.relationships.every(
      (relationship) => relationship.name.trim().length >= 2 && relationship.connection.trim().length >= 12,
    ) &&
    profile.studyPrompts.length >= 2 &&
    profile.studyPrompts.every((prompt) => prompt.trim().length >= 12)
  );
}

function cleanCitations(citations: CharacterResearchCitation[]): CharacterResearchCitation[] {
  const unique = new Map<string, CharacterResearchCitation>();
  for (const citation of citations) {
    try {
      const url = new URL(citation.url);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      if (!unique.has(url.href)) {
        unique.set(url.href, {
          title: citation.title.trim().slice(0, 180) || url.hostname,
          url: url.href,
        });
      }
    } catch {
      // Ignore malformed model or search-tool URLs.
    }
  }
  return [...unique.values()].slice(0, 8);
}

export async function queryCharacterResearch(
  input: CharacterResearchRequest,
  injectedCaller?: CharacterResearchCaller,
) {
  const request = CharacterResearchRequestSchema.parse(input);
  if (!injectedCaller && !process.env.OPENAI_API_KEY) {
    throw new CharacterResearchConfigurationError();
  }

  const caller = injectedCaller ?? callCharacterResearchModel;
  const safetyIdentifier = createSafetyIdentifier(request.sessionId);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await caller(request, safetyIdentifier);
      const profile = CharacterResearchProfileSchema.parse(raw.profile);
      if (!profile.found) throw new CharacterResearchNotFoundError();
      if (!usableProfile(profile)) throw new Error("The structured profile was incomplete.");
      return {
        source: "gpt-5.6" as const,
        data: profile,
        citations: cleanCitations(raw.citations),
      };
    } catch (error) {
      if (error instanceof CharacterResearchNotFoundError ||
          (error instanceof Error && error.name === "CharacterResearchRefusalError")) {
        throw new CharacterResearchNotFoundError();
      }
      lastError = error;
    }
  }

  throw new CharacterResearchUpstreamError(lastError);
}
