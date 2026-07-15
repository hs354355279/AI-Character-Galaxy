import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";

const chapters = [
  ["00", "Introduction", "#top"],
  ["01", "Method", "#method"],
  ["02", "Lessons", "#official-lessons"],
  ["03", "Evidence", "#evidence"],
] as const;

export function ExhibitionNav({ lessons = [] }: { lessons?: LandingLesson[] }) {
  return (
    <ExhibitionHeader
      lessons={lessons}
      theme="paper"
      observeHero
      indexLabel="Open exhibition index"
      chapters={chapters.map(([number, label, href]) => ({ number, label, href }))}
    />
  );
}
