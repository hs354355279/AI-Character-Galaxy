import { z } from "zod";

const sessionId = z.string().min(8).max(128);

export const CharacterResearchRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    context: z.string().trim().min(2).max(300).optional(),
    sessionId,
  })
  .strict();

export const CharacterResearchRelationshipSchema = z
  .object({
    name: z.string().max(120),
    connection: z.string().max(360),
  })
  .strict();

export const CharacterResearchProfileSchema = z
  .object({
    found: z.boolean(),
    canonicalName: z.string().max(120),
    descriptor: z.string().max(180),
    era: z.string().max(120),
    summary: z.string().max(1_200),
    whyItMatters: z.string().max(900),
    relationships: z.array(CharacterResearchRelationshipSchema).max(4),
    studyPrompts: z.array(z.string().max(280)).max(3),
  })
  .strict();

export type CharacterResearchRequest = z.infer<typeof CharacterResearchRequestSchema>;
export type CharacterResearchProfile = z.infer<typeof CharacterResearchProfileSchema>;

export interface CharacterResearchCitation {
  title: string;
  url: string;
}

export interface CharacterModelResult {
  profile: unknown;
  citations: CharacterResearchCitation[];
}
