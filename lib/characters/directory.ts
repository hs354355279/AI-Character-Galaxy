import type { LessonPack } from "@/lib/lessons/schema";

export interface CharacterDirectoryEntry {
  id: string;
  lessonId: string;
  lessonTitle: string;
  name: string;
  aliases: string[];
  role: string;
  summary: string;
  group: {
    id: string;
    name: string;
    color: string;
    symbol: string;
  };
  learningTags: string[];
  sourceHref: string;
  lessonHref: string;
}

export interface CharacterFilters {
  query: string;
  lessonId: string;
  groupId: string;
}

export function createCharacterDirectory(lessons: LessonPack[]): CharacterDirectoryEntry[] {
  return lessons.flatMap((lesson) => {
    const groups = new Map(lesson.groups.map((group) => [group.id, group]));
    return lesson.characters.map((character) => {
      const group = groups.get(character.groupId);
      if (!group) throw new Error(`Character ${character.id} references an unknown group.`);
      return {
        id: `${lesson.id}:${character.id}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        name: character.name,
        aliases: character.aliases,
        role: character.role,
        summary: character.summary,
        group: {
          id: group.id,
          name: group.name,
          color: group.color,
          symbol: group.symbol,
        },
        learningTags: character.learningTags,
        sourceHref: `/sources/${lesson.slug}`,
        lessonHref: `/learn/${lesson.slug}?focus=${character.id}`,
      };
    });
  });
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

export function filterCharacters(
  entries: CharacterDirectoryEntry[],
  filters: CharacterFilters,
): CharacterDirectoryEntry[] {
  const query = normalize(filters.query);
  return entries.filter((entry) => {
    if (filters.lessonId !== "all" && entry.lessonId !== filters.lessonId) return false;
    if (filters.groupId !== "all" && entry.group.id !== filters.groupId) return false;
    if (!query) return true;
    const searchable = [
      entry.name,
      ...entry.aliases,
      entry.role,
      entry.summary,
      entry.group.name,
      entry.lessonTitle,
      ...entry.learningTags,
    ].join(" ");
    return normalize(searchable).includes(query);
  });
}
