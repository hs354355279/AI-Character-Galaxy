import type { GalaxyPoint } from "@/lib/layout/galaxy-layout";
import type { CharacterNode, RelationshipEdge } from "@/lib/lessons/schema";
import type { RelationshipGraph } from "@/lib/network-expansion/schemas";

type RelationshipSpaceInput = Pick<RelationshipGraph, "layoutSeed"> & {
  characters: ReadonlyArray<CharacterNode>;
  relationships: ReadonlyArray<RelationshipEdge>;
};

export type RelationshipLayer = "origin" | "direct" | "second-degree" | "context";
export type RelationshipProminence = "origin" | "second-degree" | "context";

export interface RelationshipSpacePoint extends GalaxyPoint {
  layer: RelationshipLayer;
  degree: number | null;
  radius: number;
}

export interface RelationshipSpaceLayout {
  points: Map<string, RelationshipSpacePoint>;
  degrees: Map<string, number>;
  pathEdgeIds: Set<string>;
  targetId: string;
}

export interface RelationshipScores {
  direction: number;
  valence: number;
  context: number;
}

export const MIN_RELATIONSHIP_SEPARATION = 2.2;
export const RELATIONSHIP_SHELLS = {
  direct: { min: 6.8, max: 9.2 },
  "second-degree": { min: 10.2, max: 13.2 },
  context: { min: 13.5, max: 15.5 },
} as const;

const TYPE_VALENCE = {
  romance: 1,
  friendship: 0.8,
  family: 0.55,
  alliance: 0.5,
  mentorship: 0.3,
  service: 0.15,
  influence: 0.1,
  conflict: -1,
  "political-rivalry": -0.9,
} satisfies Record<RelationshipEdge["type"], number>;

const TYPE_CONTEXT = {
  romance: 1,
  friendship: 0.8,
  family: 0.85,
  mentorship: 0.35,
  service: -0.25,
  alliance: -0.45,
  influence: -0.65,
  conflict: -0.35,
  "political-rivalry": -1,
} satisfies Record<RelationshipEdge["type"], number>;

const POSITIVE_TAGS = new Set([
  "love",
  "trust",
  "loyalty",
  "friendship",
  "peace",
  "care",
  "allies",
  "marriage",
]);
const NEGATIVE_TAGS = new Set([
  "betrayal",
  "conflict",
  "feud",
  "revenge",
  "terror",
  "trial",
  "violence",
  "banishment",
]);
const PRIVATE_TAGS = new Set([
  "family",
  "love",
  "trust",
  "friendship",
  "loyalty",
  "honor",
  "marriage",
  "messages",
]);
const PUBLIC_TAGS = new Set([
  "authority",
  "constitutional-monarchy",
  "constitutional-reform",
  "faction",
  "institutional-change",
  "jacobins",
  "monarchy",
  "popular-politics",
  "republic",
  "terror",
]);

function clamp(value: number, minimum = -1, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function hashUnit(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function otherCharacterId(edge: RelationshipEdge, characterId: string): string | null {
  if (edge.fromCharacterId === characterId) return edge.toCharacterId;
  if (edge.toCharacterId === characterId) return edge.fromCharacterId;
  return null;
}

function normalize(point: GalaxyPoint): GalaxyPoint {
  const length = Math.hypot(point.x, point.y, point.z);
  if (length < 0.0001) return { x: 1, y: 0, z: 0 };
  return { x: point.x / length, y: point.y / length, z: point.z / length };
}

function scale(point: GalaxyPoint, radius: number): GalaxyPoint {
  return {
    x: point.x * radius,
    y: point.y * radius,
    z: point.z * radius,
  };
}

function relationshipEdgesFor(pack: RelationshipSpaceInput, characterId: string): RelationshipEdge[] {
  return pack.relationships.filter(
    (edge) => edge.fromCharacterId === characterId || edge.toCharacterId === characterId,
  );
}

export function scoreRelationship(
  edge: RelationshipEdge,
  targetId: string,
): RelationshipScores {
  const direction = edge.direction === "undirected"
    ? 0
    : edge.fromCharacterId === targetId
      ? 1
      : edge.toCharacterId === targetId
        ? -1
        : 0;
  let valence = TYPE_VALENCE[edge.type];
  let context = TYPE_CONTEXT[edge.type];

  for (const tag of edge.learningTags) {
    if (POSITIVE_TAGS.has(tag)) valence += 0.12;
    if (NEGATIVE_TAGS.has(tag)) valence -= 0.16;
    if (PRIVATE_TAGS.has(tag)) context += 0.12;
    if (PUBLIC_TAGS.has(tag)) context -= 0.14;
  }

  return {
    direction,
    valence: clamp(valence),
    context: clamp(context),
  };
}

function createGraphDistances(pack: RelationshipSpaceInput, targetId: string): {
  degrees: Map<string, number>;
  firstHops: Map<string, string>;
  pathEdgeIds: Set<string>;
} {
  const degrees = new Map<string, number>([[targetId, 0]]);
  const firstHops = new Map<string, string>();
  const pathEdgeIds = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDegree = degrees.get(current)!;
    for (const edge of relationshipEdgesFor(pack, current)) {
      const next = otherCharacterId(edge, current);
      if (!next || degrees.has(next)) continue;
      degrees.set(next, currentDegree + 1);
      firstHops.set(next, current === targetId ? next : firstHops.get(current)!);
      pathEdgeIds.add(edge.id);
      queue.push(next);
    }
  }

  return { degrees, firstHops, pathEdgeIds };
}

function directPoint(
  pack: RelationshipSpaceInput,
  targetId: string,
  characterId: string,
  sectorIndex: number,
  sectorCount: number,
): RelationshipSpacePoint {
  const edges = pack.relationships.filter(
    (edge) => otherCharacterId(edge, targetId) === characterId,
  );
  const totalWeight = edges.reduce((sum, edge) => sum + edge.strength, 0);
  const scores = edges.reduce(
    (sum, edge) => {
      const score = scoreRelationship(edge, targetId);
      return {
        direction: sum.direction + score.direction * edge.strength,
        valence: sum.valence + score.valence * edge.strength,
        context: sum.context + score.context * edge.strength,
      };
    },
    { direction: 0, valence: 0, context: 0 },
  );
  const strongest = Math.max(...edges.map((edge) => edge.strength));
  const lane = hashUnit(`${pack.layoutSeed}:${targetId}:${characterId}:lane`) - 0.5;
  const verticalLane = hashUnit(`${characterId}:${targetId}:vertical`) - 0.5;
  const depthLane = hashUnit(`${targetId}:${characterId}:depth`) - 0.5;
  const sectorAngle = ((sectorIndex + 0.5) / Math.max(1, sectorCount)) * Math.PI * 2
    + lane * 0.24;
  const direction = normalize({
    x: scores.direction / totalWeight + Math.cos(sectorAngle) * 0.62,
    y: scores.valence / totalWeight + verticalLane * 0.18,
    z: scores.context / totalWeight + Math.sin(sectorAngle) * 0.62 + depthLane * 0.14,
  });
  const strength = clamp(strongest / 5, 0, 1);
  const radius = RELATIONSHIP_SHELLS.direct.max
    - strength * (RELATIONSHIP_SHELLS.direct.max - RELATIONSHIP_SHELLS.direct.min);
  const point = scale(direction, radius);

  return {
    x: round(point.x),
    y: round(point.y),
    z: round(point.z),
    layer: "direct",
    degree: 1,
    radius: round(radius),
  };
}

function contextualDirection(seed: string): GalaxyPoint {
  const first = hashUnit(`${seed}:theta`);
  const second = hashUnit(`${seed}:height`);
  const theta = first * Math.PI * 2;
  const y = second * 1.6 - 0.8;
  const horizontal = Math.sqrt(Math.max(0.05, 1 - y * y));
  return normalize({
    x: Math.cos(theta) * horizontal,
    y,
    z: Math.sin(theta) * horizontal,
  });
}

function rotateAroundY(point: GalaxyPoint, angle: number): GalaxyPoint {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: point.x * cosine - point.z * sine,
    y: point.y,
    z: point.x * sine + point.z * cosine,
  };
}

function rotateAroundX(point: GalaxyPoint, angle: number): GalaxyPoint {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cosine - point.z * sine,
    z: point.y * sine + point.z * cosine,
  };
}

function constrainContextDepth(point: GalaxyPoint): GalaxyPoint {
  const z = clamp(point.z, -0.72, 0.72);
  const horizontalLength = Math.hypot(point.x, point.y);
  const horizontalTarget = Math.sqrt(Math.max(0.001, 1 - z * z));
  if (horizontalLength < 0.0001) return { x: horizontalTarget, y: 0, z };
  const multiplier = horizontalTarget / horizontalLength;
  return { x: point.x * multiplier, y: point.y * multiplier, z };
}

function shellRadius(
  layer: Exclude<RelationshipLayer, "origin" | "direct">,
  seed: string,
): number {
  const shell = RELATIONSHIP_SHELLS[layer];
  return shell.min + hashUnit(seed) * (shell.max - shell.min);
}

function placeSeparated(
  candidate: RelationshipSpacePoint,
  placed: RelationshipSpacePoint[],
  seed: string,
): RelationshipSpacePoint {
  if (candidate.layer === "origin") return candidate;
  const base = normalize(candidate);
  const direction = hashUnit(seed) > 0.5 ? 1 : -1;

  for (let attempt = 0; attempt < 96; attempt += 1) {
    const yaw = direction * Math.ceil(attempt / 2) * 0.17 * (attempt % 2 === 0 ? 1 : -1);
    const pitch = Math.sin(attempt * 1.73 + hashUnit(`${seed}:pitch`) * Math.PI) * 0.16;
    let movedDirection = normalize(rotateAroundX(rotateAroundY(base, yaw), pitch));
    if (candidate.layer === "context") movedDirection = constrainContextDepth(movedDirection);
    const moved = scale(movedDirection, candidate.radius);
    const separated = placed.every(
      (point) => Math.hypot(moved.x - point.x, moved.y - point.y, moved.z - point.z)
        >= MIN_RELATIONSHIP_SEPARATION,
    );
    if (separated) {
      return {
        ...candidate,
        x: round(moved.x),
        y: round(moved.y),
        z: round(moved.z),
      };
    }
  }

  for (let attempt = 0; attempt < 256; attempt += 1) {
    let fallback = contextualDirection(`${seed}:fallback:${attempt}`);
    if (candidate.layer === "context") fallback = constrainContextDepth(fallback);
    const moved = scale(fallback, candidate.radius);
    const separated = placed.every(
      (point) => Math.hypot(moved.x - point.x, moved.y - point.y, moved.z - point.z)
        >= MIN_RELATIONSHIP_SEPARATION,
    );
    if (separated) {
      return {
        ...candidate,
        x: round(moved.x),
        y: round(moved.y),
        z: round(moved.z),
      };
    }
  }

  throw new Error(`Unable to place relationship-space point: ${seed}`);
}

export function createRelationshipSpace(
  pack: RelationshipSpaceInput,
  targetId: string,
): RelationshipSpaceLayout {
  if (!pack.characters.some((character) => character.id === targetId)) {
    throw new Error(`Unknown relationship-space target: ${targetId}`);
  }

  const { degrees, firstHops, pathEdgeIds } = createGraphDistances(pack, targetId);
  const points = new Map<string, RelationshipSpacePoint>();
  const placed: RelationshipSpacePoint[] = [];

  const origin = { x: 0, y: 0, z: 0, layer: "origin", degree: 0, radius: 0 } satisfies RelationshipSpacePoint;
  points.set(targetId, origin);
  placed.push(origin);

  const directIds = pack.characters
    .filter((character) => degrees.get(character.id) === 1)
    .map((character) => character.id)
    .sort();
  directIds.forEach((characterId, index) => {
    const candidate = directPoint(pack, targetId, characterId, index, directIds.length);
    const point = placeSeparated(candidate, placed, `${pack.layoutSeed}:${targetId}:${characterId}:separate`);
    points.set(characterId, point);
    placed.push(point);
  });

  const secondDegreeIds = pack.characters
    .filter((character) => degrees.get(character.id) === 2)
    .map((character) => character.id)
    .sort();
  secondDegreeIds.forEach((characterId, index) => {
    const firstHop = firstHops.get(characterId)!;
    const anchor = points.get(firstHop)!;
    const semantic = normalize(anchor);
    const sectorAngle = ((index + 0.5) / Math.max(1, secondDegreeIds.length)) * Math.PI * 2
      + (hashUnit(`${targetId}:${characterId}:sector`) - 0.5) * 0.34;
    const direction = normalize({
      x: semantic.x * 0.48 + Math.cos(sectorAngle) * 1.05,
      y: semantic.y * 0.68 + (hashUnit(`${characterId}:height`) - 0.5) * 0.42,
      z: semantic.z * 0.48 + Math.sin(sectorAngle) * 1.05,
    });
    const radius = shellRadius(
      "second-degree",
      `${pack.layoutSeed}:${targetId}:${characterId}:degree2`,
    );
    const candidate = {
      ...scale(direction, radius),
      layer: "second-degree",
      degree: 2,
      radius: round(radius),
    } satisfies RelationshipSpacePoint;
    const point = placeSeparated(candidate, placed, `${pack.layoutSeed}:${targetId}:${characterId}:separate`);
    points.set(characterId, point);
    placed.push(point);
  });

  const contextIds = pack.characters
    .filter((character) => character.id !== targetId && (degrees.get(character.id) ?? Infinity) > 2)
    .map((character) => character.id)
    .sort();
  contextIds.forEach((characterId) => {
    const radius = shellRadius("context", `${pack.layoutSeed}:${targetId}:${characterId}:context`);
    const direction = constrainContextDepth(contextualDirection(`${targetId}:${characterId}:context`));
    const candidate = {
      ...scale(direction, radius),
      layer: "context",
      degree: degrees.get(characterId) ?? null,
      radius: round(radius),
    } satisfies RelationshipSpacePoint;
    const point = placeSeparated(candidate, placed, `${pack.layoutSeed}:${targetId}:${characterId}:separate`);
    points.set(characterId, point);
    placed.push(point);
  });

  return { points, degrees, pathEdgeIds, targetId };
}

export function classifyRelationshipProminence(
  edge: RelationshipEdge,
  layout: RelationshipSpaceLayout,
): RelationshipProminence {
  if (edge.fromCharacterId === layout.targetId || edge.toCharacterId === layout.targetId) {
    return "origin";
  }
  if (layout.pathEdgeIds.has(edge.id)) return "second-degree";
  return "context";
}
