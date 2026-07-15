import { NextResponse } from "next/server";
import {
  CharacterResearchConfigurationError,
  CharacterResearchNotFoundError,
  CharacterResearchUpstreamError,
  queryCharacterResearch,
} from "@/lib/openai/character-research";
import {
  CharacterResearchRequestSchema,
  type CharacterResearchRequest,
} from "@/lib/openai/character-schemas";

type QueryService = (input: CharacterResearchRequest) => ReturnType<typeof queryCharacterResearch>;

export function createCharacterQueryHandler(query: QueryService = queryCharacterResearch) {
  return async function handler(request: Request) {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid character research request." }, { status: 400 });
    }

    const parsed = CharacterResearchRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid character research request." }, { status: 400 });
    }

    try {
      return NextResponse.json(await query(parsed.data));
    } catch (error) {
      if (error instanceof CharacterResearchConfigurationError) {
        return NextResponse.json({ error: "Character research is not configured." }, { status: 503 });
      }
      if (error instanceof CharacterResearchNotFoundError) {
        return NextResponse.json({ error: "No verified character profile was found." }, { status: 422 });
      }
      if (error instanceof CharacterResearchUpstreamError) {
        return NextResponse.json({ error: "Character research is temporarily unavailable." }, { status: 502 });
      }
      return NextResponse.json({ error: "Character research is temporarily unavailable." }, { status: 502 });
    }
  };
}

export const POST = createCharacterQueryHandler();
