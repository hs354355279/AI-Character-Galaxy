import { NextResponse } from "next/server";
import { ExpandNetworkRequestSchema, type ExpandNetworkRequest } from "@/lib/network-expansion/schemas";
import {
  NetworkExpansionConfigurationError,
  NetworkExpansionNotFoundError,
  NetworkExpansionUpstreamError,
  queryRelationshipNetworkExpansion,
} from "@/lib/openai/network-expansion";

type ExpansionService = (
  input: ExpandNetworkRequest,
) => ReturnType<typeof queryRelationshipNetworkExpansion>;

export function createExpandNetworkHandler(expand: ExpansionService = queryRelationshipNetworkExpansion) {
  return async function handler(request: Request) {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid relationship network expansion request." }, { status: 400 });
    }

    const parsed = ExpandNetworkRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid relationship network expansion request." }, { status: 400 });
    }

    try {
      return NextResponse.json(await expand(parsed.data));
    } catch (error) {
      if (error instanceof NetworkExpansionNotFoundError) {
        return NextResponse.json({ error: "No new verified relationships were found." }, { status: 422 });
      }
      if (error instanceof NetworkExpansionConfigurationError) {
        return NextResponse.json({ error: "GPT-5.6 network expansion is not configured." }, { status: 503 });
      }
      if (error instanceof NetworkExpansionUpstreamError) {
        return NextResponse.json({ error: "Relationship network expansion is temporarily unavailable." }, { status: 502 });
      }
      return NextResponse.json({ error: "Relationship network expansion is temporarily unavailable." }, { status: 502 });
    }
  };
}

export const POST = createExpandNetworkHandler();
