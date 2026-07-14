import { NextResponse } from "next/server";
import { getLessonPack } from "@/lib/lessons/repository";
import { generateExplanation } from "@/lib/openai/learning-service";
import { ExplanationRequestSchema } from "@/lib/openai/schemas";

export async function POST(request: Request) {
  try {
    const input = ExplanationRequestSchema.parse(await request.json());
    const lesson = getLessonPack(input.lessonId);
    if (!lesson) return NextResponse.json({ error: "Unknown lesson." }, { status: 400 });
    return NextResponse.json(await generateExplanation(input, lesson));
  } catch {
    return NextResponse.json({ error: "Invalid explanation request." }, { status: 400 });
  }
}
