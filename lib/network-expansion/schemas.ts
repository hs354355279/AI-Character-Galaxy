import { z } from "zod";
import type {
  CharacterGroup,
  CharacterNode,
  RelationshipEdge,
} from "@/lib/lessons/schema";

const idSchema = z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const sessionIdSchema = z.string().min(8).max(128);

export const EXPANDED_GROUP_ID = "ai-expanded-network";
export const MAX_EXPANDED_CHARACTERS = 12;

export const ExpansionCitationSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(2).max(180),
  url: z.string().url().max(2_000),
}).strict();

export const ExpandedCharacterSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(120),
  aliases: z.array(z.string().trim().min(1).max(120)).max(8),
  role: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(20).max(1_200),
  groupId: z.literal(EXPANDED_GROUP_ID),
  importance: z.number().int().min(1).max(5),
  sourceRefIds: z.array(idSchema).min(1).max(8),
  learningTags: z.array(idSchema).min(1).max(8),
  provenance: z.literal("ai-expanded"),
  citationIds: z.array(idSchema).min(1).max(8),
}).strict();

const relationshipTypeSchema = z.enum([
  "alliance",
  "conflict",
  "family",
  "influence",
  "mentorship",
  "romance",
  "friendship",
  "political-rivalry",
  "service",
]);

export const ExpandedRelationshipSchema = z.object({
  id: idSchema,
  fromCharacterId: idSchema,
  toCharacterId: idSchema,
  type: relationshipTypeSchema,
  direction: z.enum(["directed", "undirected"]),
  strength: z.number().int().min(1).max(5),
  summary: z.string().trim().min(12).max(600),
  evidenceSummary: z.string().trim().min(20).max(900),
  evidenceLocation: z.string().trim().min(3).max(240).optional(),
  sourceRefIds: z.array(idSchema).min(1).max(8),
  confidence: z.number().min(0).max(1),
  isDisputed: z.boolean(),
  disputeNote: z.string().trim().min(12).max(500).optional(),
  learningTags: z.array(idSchema).min(1).max(8),
  provenance: z.literal("ai-expanded"),
  citationIds: z.array(idSchema).min(1).max(8),
}).strict().superRefine((relationship, context) => {
  if (relationship.fromCharacterId === relationship.toCharacterId) {
    context.addIssue({ code: "custom", path: ["toCharacterId"], message: "Self relationships are not allowed." });
  }
  if (relationship.isDisputed && !relationship.disputeNote) {
    context.addIssue({ code: "custom", path: ["disputeNote"], message: "Disputed relationships require a note." });
  }
});

export const NetworkExpansionBatchSchema = z.object({
  focusCharacterId: idSchema,
  characters: z.array(ExpandedCharacterSchema).max(3),
  relationships: z.array(ExpandedRelationshipSchema).min(1).max(6),
  citations: z.array(ExpansionCitationSchema).min(1).max(24),
  generatedAt: z.string().datetime(),
}).strict();

export const ExpansionEventSchema = z.object({
  focusCharacterId: idSchema,
  addedCharacterIds: z.array(idSchema).max(3),
  addedRelationshipIds: z.array(idSchema).max(6),
  generatedAt: z.string().datetime(),
}).strict();

export const RelationshipNetworkExpansionStateSchema = z.object({
  schemaVersion: z.literal("1.0"),
  lessonId: idSchema,
  characters: z.array(ExpandedCharacterSchema).max(MAX_EXPANDED_CHARACTERS),
  relationships: z.array(ExpandedRelationshipSchema).max(48),
  citations: z.array(ExpansionCitationSchema).max(96),
  expansionEvents: z.array(ExpansionEventSchema).max(48),
}).strict();

export const ExpandNetworkRequestSchema = z.object({
  lessonId: idSchema,
  focus: z.object({
    id: idSchema,
    name: z.string().trim().min(2).max(120),
    role: z.string().trim().min(2).max(180),
    summary: z.string().trim().min(20).max(1_200),
  }).strict(),
  existingCharacterNames: z.array(z.string().trim().min(2).max(120)).max(48),
  existingRelationshipKeys: z.array(z.string().trim().min(3).max(360)).max(96),
  sessionId: sessionIdSchema,
}).strict();

export const NetworkExpansionModelCandidateSchema = z.object({
  canonicalName: z.string().trim().min(2).max(120),
  aliases: z.array(z.string().trim().min(1).max(120)).max(6),
  role: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(20).max(1_200),
  relationshipType: relationshipTypeSchema,
  direction: z.enum(["focus-to-candidate", "candidate-to-focus", "undirected"]),
  strength: z.number().int().min(1).max(5),
  relationshipSummary: z.string().trim().min(12).max(600),
  evidenceSummary: z.string().trim().min(20).max(900),
  confidence: z.number().min(0).max(1),
  isDisputed: z.boolean(),
  disputeNote: z.string().trim().min(12).max(500).optional(),
  learningTags: z.array(idSchema).min(1).max(8),
  evidenceSourceUrls: z.array(z.string().url().max(2_000)).min(1).max(4),
}).strict().superRefine((candidate, context) => {
  if (candidate.isDisputed && !candidate.disputeNote) {
    context.addIssue({ code: "custom", path: ["disputeNote"], message: "Disputed relationships require a note." });
  }
});

export const NetworkExpansionModelOutputSchema = z.object({
  candidates: z.array(NetworkExpansionModelCandidateSchema).max(3),
}).strict();

export type ExpansionCitation = z.infer<typeof ExpansionCitationSchema>;
export type ExpandedCharacter = z.infer<typeof ExpandedCharacterSchema>;
export type ExpandedRelationship = z.infer<typeof ExpandedRelationshipSchema>;
export type NetworkExpansionBatch = z.infer<typeof NetworkExpansionBatchSchema>;
export type RelationshipNetworkExpansionState = z.infer<typeof RelationshipNetworkExpansionStateSchema>;
export type ExpandNetworkRequest = z.infer<typeof ExpandNetworkRequestSchema>;
export type NetworkExpansionModelOutput = z.infer<typeof NetworkExpansionModelOutputSchema>;
export type NetworkExpansionModelCandidate = z.infer<typeof NetworkExpansionModelCandidateSchema>;

export type RuntimeCharacter = CharacterNode & {
  provenance: "reviewed" | "ai-expanded";
  citationIds: string[];
};

export type RuntimeRelationship = RelationshipEdge & {
  provenance: "reviewed" | "ai-expanded";
  citationIds: string[];
};

export interface RelationshipGraph {
  id: string;
  layoutSeed: string;
  groups: CharacterGroup[];
  characters: RuntimeCharacter[];
  relationships: RuntimeRelationship[];
  citations: ExpansionCitation[];
}

export interface NetworkExpansionModelResult {
  output: unknown;
  citations: Array<{ title: string; url: string }>;
}

export const EXPANDED_GROUP: CharacterGroup = {
  id: EXPANDED_GROUP_ID,
  name: "Expanded network",
  color: "#61c9b4",
  symbol: "AI",
  description: "Web-grounded people added around a selected character with GPT-5.6.",
};
