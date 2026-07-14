import frenchRevolutionData from "@/content/lesson-packs/french-revolution.json";
import romeoAndJulietData from "@/content/lesson-packs/romeo-and-juliet.json";
import { LessonPackSchema, type LessonPack } from "@/lib/lessons/schema";

const lessonPacks: LessonPack[] = [frenchRevolutionData, romeoAndJulietData].map((pack) =>
  LessonPackSchema.parse(pack),
);

export function getAllLessonPacks(): LessonPack[] {
  return lessonPacks;
}

export function getLessonPack(id: string): LessonPack | null {
  return lessonPacks.find((pack) => pack.id === id || pack.slug === id) ?? null;
}
