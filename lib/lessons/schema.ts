import { z } from "zod";

const idSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case IDs.");

export const LearningObjectiveSchema = z
  .object({
    id: idSchema,
    title: z.string().min(4),
    description: z.string().min(12),
  })
  .strict();

export const CharacterGroupSchema = z
  .object({
    id: idSchema,
    name: z.string().min(2),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    symbol: z.string().min(1).max(3),
    description: z.string().min(8),
  })
  .strict();

export const CharacterNodeSchema = z
  .object({
    id: idSchema,
    name: z.string().min(2),
    aliases: z.array(z.string().min(1)),
    role: z.string().min(2),
    summary: z.string().min(20),
    groupId: idSchema,
    importance: z.number().min(1).max(5),
    sourceRefIds: z.array(idSchema).min(1),
    learningTags: z.array(idSchema).min(1),
  })
  .strict();

export const RelationshipEdgeSchema = z
  .object({
    id: idSchema,
    fromCharacterId: idSchema,
    toCharacterId: idSchema,
    type: z.enum([
      "alliance",
      "conflict",
      "family",
      "influence",
      "mentorship",
      "romance",
      "friendship",
      "political-rivalry",
      "service",
    ]),
    direction: z.enum(["directed", "undirected"]),
    strength: z.number().min(1).max(5),
    summary: z.string().min(12),
    evidenceSummary: z.string().min(20),
    evidenceLocation: z.string().min(3).optional(),
    sourceRefIds: z.array(idSchema).min(1),
    confidence: z.number().min(0).max(1),
    isDisputed: z.boolean(),
    disputeNote: z.string().min(12).optional(),
    learningTags: z.array(idSchema).min(1),
  })
  .strict()
  .superRefine((edge, context) => {
    if (edge.isDisputed && !edge.disputeNote) {
      context.addIssue({
        code: "custom",
        path: ["disputeNote"],
        message: "Disputed relationships require a neutral dispute note.",
      });
    }
  });

const MissionCompletionRuleSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("select-character"),
      characterIds: z.array(idSchema).min(1),
      minimumSelections: z.number().int().positive().default(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("select-group-members"),
      groupId: idSchema,
      characterIds: z.array(idSchema).min(2),
      minimumSelections: z.number().int().min(2),
    })
    .strict(),
  z
    .object({
      kind: z.literal("trace-relationships"),
      startCharacterId: idSchema,
      endCharacterId: idSchema,
      orderedRelationshipIds: z.array(idSchema).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("compare-characters"),
      characterIds: z.array(idSchema).length(2),
      minimumResponseLength: z.number().int().min(20),
    })
    .strict(),
  z
    .object({
      kind: z.literal("explain-relationship"),
      relationshipIds: z.array(idSchema).min(1),
      minimumResponseLength: z.number().int().min(20),
    })
    .strict(),
  z
    .object({
      kind: z.literal("cause-and-effect"),
      relationshipIds: z.array(idSchema).min(1),
      minimumResponseLength: z.number().int().min(20),
    })
    .strict(),
]);

export const ExplorationMissionSchema = z
  .object({
    id: idSchema,
    type: z.enum([
      "find_character",
      "identify_group",
      "trace_path",
      "compare_characters",
      "explain_relationship",
      "cause_and_effect",
    ]),
    title: z.string().min(4),
    prompt: z.string().min(12),
    hints: z.array(z.string().min(8)).min(1).max(2),
    relevantCharacterIds: z.array(idSchema),
    relevantRelationshipIds: z.array(idSchema),
    relevantObjectiveIds: z.array(idSchema).min(1),
    evidenceRequired: z.boolean(),
    completionRule: MissionCompletionRuleSchema,
  })
  .strict();

export const SourceReferenceSchema = z
  .object({
    id: idSchema,
    title: z.string().min(3),
    url: z.string().url(),
    publisher: z.string().min(2),
    license: z.string().min(2),
    retrievedAt: z.string().date(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    attributionText: z.string().min(12),
  })
  .strict();

export const AssessmentQuestionSchema = z
  .object({
    id: idSchema,
    type: z.enum(["multiple-choice", "compare", "discussion"]),
    prompt: z.string().min(12),
    options: z.array(z.string().min(1)).optional(),
    correctOptionIndex: z.number().int().nonnegative().optional(),
    sourceRefIds: z.array(idSchema).min(1),
  })
  .strict();

export const LessonPackSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: idSchema,
    slug: idSchema,
    title: z.string().min(5),
    subtitle: z.string().min(8),
    kind: z.enum(["history", "literature"]),
    locale: z.literal("en"),
    targetAge: z.object({ min: z.number().int().min(10), max: z.number().int().max(18) }).strict(),
    estimatedMinutes: z.number().int().min(5).max(30),
    overview: z.string().min(40),
    essentialQuestion: z.string().min(12),
    objectives: z.array(LearningObjectiveSchema).min(3).max(6),
    groups: z.array(CharacterGroupSchema).min(2).max(8),
    characters: z.array(CharacterNodeSchema).min(8).max(12),
    relationships: z.array(RelationshipEdgeSchema).min(10).max(25),
    missions: z.array(ExplorationMissionSchema).min(4).max(6),
    discussionQuestions: z.array(z.string().min(12)).min(2),
    preparedAssessment: z.array(AssessmentQuestionSchema).length(5),
    preparedSummary: z.array(z.string().min(20)).min(3),
    sources: z.array(SourceReferenceSchema).min(2),
    layoutSeed: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((pack, context) => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    const checkUnique = (values: string[], path: string) => {
      if (!unique(values)) {
        context.addIssue({ code: "custom", path: [path], message: `${path} IDs must be unique.` });
      }
    };

    checkUnique(pack.groups.map((item) => item.id), "groups");
    checkUnique(pack.characters.map((item) => item.id), "characters");
    checkUnique(pack.relationships.map((item) => item.id), "relationships");
    checkUnique(pack.missions.map((item) => item.id), "missions");
    checkUnique(pack.sources.map((item) => item.id), "sources");

    const groups = new Set(pack.groups.map((item) => item.id));
    const characters = new Set(pack.characters.map((item) => item.id));
    const relationships = new Map(pack.relationships.map((item) => [item.id, item]));
    const sources = new Set(pack.sources.map((item) => item.id));
    const objectives = new Set(pack.objectives.map((item) => item.id));

    for (const [index, character] of pack.characters.entries()) {
      if (!groups.has(character.groupId)) {
        context.addIssue({ code: "custom", path: ["characters", index, "groupId"], message: "Unknown group ID." });
      }
      for (const sourceId of character.sourceRefIds) {
        if (!sources.has(sourceId)) {
          context.addIssue({ code: "custom", path: ["characters", index, "sourceRefIds"], message: "Unknown source ID." });
        }
      }
    }

    for (const [index, edge] of pack.relationships.entries()) {
      if (!characters.has(edge.fromCharacterId) || !characters.has(edge.toCharacterId)) {
        context.addIssue({ code: "custom", path: ["relationships", index], message: "Relationship references an unknown character." });
      }
      if (pack.kind === "literature" && !edge.evidenceLocation) {
        context.addIssue({ code: "custom", path: ["relationships", index, "evidenceLocation"], message: "Literary evidence needs an act and scene locator." });
      }
      for (const sourceId of edge.sourceRefIds) {
        if (!sources.has(sourceId)) {
          context.addIssue({ code: "custom", path: ["relationships", index, "sourceRefIds"], message: "Unknown source ID." });
        }
      }
    }

    for (const [index, mission] of pack.missions.entries()) {
      for (const characterId of mission.relevantCharacterIds) {
        if (!characters.has(characterId)) {
          context.addIssue({ code: "custom", path: ["missions", index, "relevantCharacterIds"], message: "Unknown character ID." });
        }
      }
      for (const relationshipId of mission.relevantRelationshipIds) {
        const edge = relationships.get(relationshipId);
        if (!edge) {
          context.addIssue({ code: "custom", path: ["missions", index, "relevantRelationshipIds"], message: "Unknown relationship ID." });
        } else if (edge.confidence < 0.7) {
          context.addIssue({ code: "custom", path: ["missions", index, "relevantRelationshipIds"], message: "Low-confidence relationships cannot power official missions." });
        }
      }
      for (const objectiveId of mission.relevantObjectiveIds) {
        if (!objectives.has(objectiveId)) {
          context.addIssue({ code: "custom", path: ["missions", index, "relevantObjectiveIds"], message: "Unknown objective ID." });
        }
      }
    }

    const coveredObjectives = new Set(pack.missions.flatMap((mission) => mission.relevantObjectiveIds));
    for (const objective of pack.objectives) {
      if (!coveredObjectives.has(objective.id)) {
        context.addIssue({ code: "custom", path: ["objectives"], message: `Objective ${objective.id} has no mission coverage.` });
      }
    }
  });

export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;
export type CharacterGroup = z.infer<typeof CharacterGroupSchema>;
export type CharacterNode = z.infer<typeof CharacterNodeSchema>;
export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;
export type ExplorationMission = z.infer<typeof ExplorationMissionSchema>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type LessonPack = z.infer<typeof LessonPackSchema>;
export type MissionCompletionRule = z.infer<typeof MissionCompletionRuleSchema>;
