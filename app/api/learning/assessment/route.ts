import { NextResponse } from "next/server";
import { getLessonPack } from "@/lib/lessons/repository";
import { generateAssessment } from "@/lib/openai/learning-service";
import { AssessmentRequestSchema } from "@/lib/openai/schemas";

export async function POST(request: Request) {
  try {
    const input = AssessmentRequestSchema.parse(await request.json());
    const lesson = getLessonPack(input.lessonId);
    if (!lesson) return NextResponse.json({ error: "Unknown lesson." }, { status: 400 });
    return NextResponse.json(await generateAssessment(input, lesson));
  } catch {
    return NextResponse.json({ error: "Invalid assessment request." }, { status: 400 });
  }
}
