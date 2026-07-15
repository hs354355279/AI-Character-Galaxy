import type { CharacterGroup, CharacterNode } from "@/lib/lessons/schema";
import type { RelationshipGraph } from "@/lib/network-expansion/schemas";

export interface GalaxyPoint {
  x: number;
  y: number;
  z: number;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

type GalaxyLayoutInput = Pick<RelationshipGraph, "layoutSeed"> & {
  groups: ReadonlyArray<CharacterGroup>;
  characters: ReadonlyArray<CharacterNode>;
};

export function createGalaxyLayout(pack: GalaxyLayoutInput): Map<string, GalaxyPoint> {
  const random = mulberry32(pack.layoutSeed);
  const points = new Map<string, GalaxyPoint>();
  const groupCount = pack.groups.length;

  pack.groups.forEach((group, groupIndex) => {
    const groupAngle = (groupIndex / groupCount) * Math.PI * 2 - Math.PI / 2;
    const groupRadius = groupCount <= 3 ? 5.2 : 6.2;
    const centerX = Math.cos(groupAngle) * groupRadius;
    const centerY = Math.sin(groupAngle) * groupRadius;
    const centerZ = (random() - 0.5) * 2.4;
    const members = pack.characters.filter((character) => character.groupId === group.id);

    members.forEach((character, memberIndex) => {
      const angle =
        (memberIndex / Math.max(members.length, 1)) * Math.PI * 2 + random() * 0.55;
      const localRadius = members.length === 1 ? 0 : 1.15 + random() * 1.05;
      points.set(character.id, {
        x: round(centerX + Math.cos(angle) * localRadius),
        y: round(centerY + Math.sin(angle) * localRadius),
        z: round(centerZ + (random() - 0.5) * 2.2),
      });
    });
  });

  return points;
}
