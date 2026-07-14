import { NextResponse } from "next/server";
import { getLessonPack } from "@/lib/lessons/repository";
import { generateSummary } from "@/lib/openai/learning-service";
import { SummaryRequestSchema } from "@/lib/openai/schemas";

export async function POST(request: Request) {
  try {
    const input = SummaryRequestSchema.parse(await request.json());
    const lesson = getLessonPack(input.lessonId);
    if (!lesson) return NextResponse.json({ error: "Unknown lesson." }, { status: 400 });
    return NextResponse.json(await generateSummary(input, lesson));
  } catch {
    return NextResponse.json({ error: "Invalid summary request." }, { status: 400 });
  }
}
