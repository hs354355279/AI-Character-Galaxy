import type { Metadata } from "next";
import { CharacterAtlas } from "@/components/characters/CharacterAtlas";
import { createCharacterDirectory } from "@/lib/characters/directory";
import { getAllLessonPacks } from "@/lib/lessons/repository";

export const metadata: Metadata = {
  title: "Character Atlas",
  description: "Browse reviewed people from every AI Character Galaxy course.",
};

export default function CharactersPage() {
  return <CharacterAtlas entries={createCharacterDirectory(getAllLessonPacks())} />;
}
