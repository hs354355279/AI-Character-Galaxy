import { createHash } from "node:crypto";
import { getLessonPack } from "@/lib/lessons/repository";
import {
  ExpandNetworkRequestSchema,
  NetworkExpansionBatchSchema,
  NetworkExpansionModelOutputSchema,
  type ExpandNetworkRequest,
  type ExpansionCitation,
  type NetworkExpansionModelCandidate,
  type NetworkExpansionModelResult,
} from "@/lib/network-expansion/schemas";
import {
  createExpandedCharacterId,
  createExpandedRelationshipId,
  createRelationshipKey,
} from "@/lib/network-expansion/runtime-graph";
import { callRelationshipNetworkExpansionModel } from "@/lib/openai/client";
import type { NetworkExpansionPromptContext } from "@/lib/openai/network-expansion-prompts";
import { createSafetyIdentifier } from "@/lib/openai/safety";

export class NetworkExpansionConfigurationError extends Error {
  constructor() {
    super("Relationship network expansion is not configured.");
    this.name = "NetworkExpansionConfigurationError";
  }
}

export class NetworkExpansionNotFoundError extends Error {
  constructor() {
    super("No new verified relationships were found.");
    this.name = "NetworkExpansionNotFoundError";
  }
}

export class NetworkExpansionUpstreamError extends Error {
  constructor(cause?: unknown) {
    super("Relationship network expansion is temporarily unavailable.", { cause });
    this.name = "NetworkExpansionUpstreamError";
  }
}

export type NetworkExpansionCaller = (
  input: ExpandNetworkRequest,
  context: NetworkExpansionPromptContext,
  safetyIdentifier: string,
) => Promise<NetworkExpansionModelResult>;

function normalizedIdentity(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function citationId(url: string): string {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 12);
  return `source-ai-${digest}`;
}

function cleanCitations(citations: NetworkExpansionModelResult["citations"]): ExpansionCitation[] {
  const unique = new Map<string, ExpansionCitation>();
  for (const citation of citations) {
    const url = normalizeUrl(citation.url);
    if (!url || unique.has(url)) continue;
    unique.set(url, {
      id: citationId(url),
      title: citation.title.trim().slice(0, 180) || new URL(url).hostname,
      url,
    });
  }
  return [...unique.values()].slice(0, 24);
}

function candidateCitationIds(
  candidate: NetworkExpansionModelCandidate,
  citationByUrl: Map<string, ExpansionCitation>,
): string[] {
  return [...new Set(candidate.evidenceSourceUrls
    .map(normalizeUrl)
    .filter((url): url is string => Boolean(url))
    .map((url) => citationByUrl.get(url)?.id)
    .filter((id): id is string => Boolean(id)))]
    .slice(0, 8);
}

function authoritativeRequest(input: ExpandNetworkRequest) {
  const lesson = getLessonPack(input.lessonId);
  if (!lesson) throw new NetworkExpansionNotFoundError();

  const reviewedFocus = lesson.characters.find((character) => character.id === input.focus.id);
  const focus = reviewedFocus ? {
    id: reviewedFocus.id,
    name: reviewedFocus.name,
    role: reviewedFocus.role,
    summary: reviewedFocus.summary,
  } : input.focus;

  const existingCharacterNames = [...new Set([
    ...input.existingCharacterNames,
    ...lesson.characters.flatMap((character) => [character.name, ...character.aliases]),
    focus.name,
  ])];

  return {
    lesson,
    request: { ...input, focus, existingCharacterNames },
  };
}

function buildBatch(
  request: ExpandNetworkRequest,
  raw: NetworkExpansionModelResult,
) {
  const output = NetworkExpansionModelOutputSchema.parse(raw.output);
  const citations = cleanCitations(raw.citations);
  const citationByUrl = new Map(citations.map((citation) => [citation.url, citation]));
  const knownNames = new Set(request.existingCharacterNames.map(normalizedIdentity));
  const existingKeys = new Set(request.existingRelationshipKeys);
  const characters = [];
  const relationships = [];
  const usedCitationIds = new Set<string>();

  for (const candidate of output.candidates) {
    const identities = [candidate.canonicalName, ...candidate.aliases].map(normalizedIdentity);
    if (identities.some((name) => knownNames.has(name))) continue;

    const citationIds = candidateCitationIds(candidate, citationByUrl);
    if (citationIds.length === 0) continue;

    const characterId = createExpandedCharacterId(candidate.canonicalName);
    const fromCharacterId = candidate.direction === "candidate-to-focus" ? characterId : request.focus.id;
    const toCharacterId = candidate.direction === "candidate-to-focus" ? request.focus.id : characterId;
    const direction = candidate.direction === "undirected" ? "undirected" as const : "directed" as const;
    const relationshipKey = createRelationshipKey({
      fromCharacterId,
      toCharacterId,
      type: candidate.relationshipType,
      direction,
    });
    if (existingKeys.has(relationshipKey)) continue;

    knownNames.add(normalizedIdentity(candidate.canonicalName));
    for (const alias of candidate.aliases) knownNames.add(normalizedIdentity(alias));
    existingKeys.add(relationshipKey);
    citationIds.forEach((id) => usedCitationIds.add(id));
    characters.push({
      id: characterId,
      name: candidate.canonicalName,
      aliases: candidate.aliases,
      role: candidate.role,
      summary: candidate.summary,
      groupId: "ai-expanded-network" as const,
      importance: 3,
      sourceRefIds: citationIds,
      learningTags: candidate.learningTags,
      provenance: "ai-expanded" as const,
      citationIds,
    });
    relationships.push({
      id: createExpandedRelationshipId(fromCharacterId, toCharacterId, candidate.relationshipType),
      fromCharacterId,
      toCharacterId,
      type: candidate.relationshipType,
      direction,
      strength: candidate.strength,
      summary: candidate.relationshipSummary,
      evidenceSummary: candidate.evidenceSummary,
      sourceRefIds: citationIds,
      confidence: candidate.confidence,
      isDisputed: candidate.isDisputed,
      ...(candidate.disputeNote ? { disputeNote: candidate.disputeNote } : {}),
      learningTags: candidate.learningTags,
      provenance: "ai-expanded" as const,
      citationIds,
    });
  }

  if (characters.length === 0 || relationships.length === 0) {
    throw new NetworkExpansionNotFoundError();
  }

  return NetworkExpansionBatchSchema.parse({
    focusCharacterId: request.focus.id,
    characters,
    relationships,
    citations: citations.filter((citation) => usedCitationIds.has(citation.id)),
    generatedAt: new Date().toISOString(),
  });
}

export async function queryRelationshipNetworkExpansion(
  input: ExpandNetworkRequest,
  injectedCaller?: NetworkExpansionCaller,
) {
  const parsed = ExpandNetworkRequestSchema.parse(input);
  if (!injectedCaller && !process.env.OPENAI_API_KEY) {
    throw new NetworkExpansionConfigurationError();
  }

  const { lesson, request } = authoritativeRequest(parsed);
  const caller = injectedCaller ?? callRelationshipNetworkExpansionModel;
  const context = { lessonTitle: lesson.title, lessonKind: lesson.kind };
  const safetyIdentifier = createSafetyIdentifier(request.sessionId);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await caller(request, context, safetyIdentifier);
      return { source: "gpt-5.6" as const, data: buildBatch(request, raw) };
    } catch (error) {
      if (error instanceof NetworkExpansionNotFoundError ||
          (error instanceof Error && error.name === "NetworkExpansionRefusalError")) {
        throw new NetworkExpansionNotFoundError();
      }
      lastError = error;
    }
  }

  throw new NetworkExpansionUpstreamError(lastError);
}
