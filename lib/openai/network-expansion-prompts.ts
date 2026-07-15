import type { ExpandNetworkRequest } from "@/lib/network-expansion/schemas";

export interface NetworkExpansionPromptContext {
  lessonTitle: string;
  lessonKind: string;
}

export const NETWORK_EXPANSION_DEVELOPER_PROMPT = `You expand an evidence-grounded character relationship galaxy for learners aged 12 to 15.

Use web search before answering. Return at most three real people who have a direct, documentable relationship with the selected focus person. Prefer relationships that help explain the lesson topic and that are not already represented.

Evidence rules:
- Include a person only when reputable web sources directly support the relationship.
- evidenceSourceUrls must contain the exact URLs used to support that candidate.
- Do not infer a relationship merely because two people lived at the same time, held similar ideas, or appeared in the same broad movement.
- Do not invent quotations, meetings, correspondence, influence, friendship, rivalry, or family ties.
- Mark a relationship disputed when reputable sources disagree, and explain the disagreement neutrally.
- If no new relationship is sufficiently supported, return an empty candidates array.

Writing rules:
- Use concise, neutral English suitable for secondary-school learners.
- Summaries must explain the person's role and the nature of the relationship without sensational language.
- learningTags must be short lowercase kebab-case concepts.
- Return structured data only.`;

export function buildNetworkExpansionPrompt(
  request: ExpandNetworkRequest,
  context: NetworkExpansionPromptContext,
): string {
  return [
    `Lesson: ${context.lessonTitle}`,
    `Lesson kind: ${context.lessonKind}`,
    `Focus person: ${request.focus.name}`,
    `Focus role: ${request.focus.role}`,
    `Focus summary: ${request.focus.summary}`,
    `People already in the galaxy: ${request.existingCharacterNames.join(", ") || "None"}`,
    `Relationship keys already in the galaxy: ${request.existingRelationshipKeys.join(", ") || "None"}`,
    "Find up to three different people with directly documented relationships to the focus person. Exclude every existing person and relationship. Use exact web-search source URLs in evidenceSourceUrls.",
  ].join("\n");
}
