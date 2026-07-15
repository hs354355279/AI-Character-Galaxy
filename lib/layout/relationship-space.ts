import type { GalaxyPoint } from "@/lib/layout/galaxy-layout";
import type { LessonPack, RelationshipEdge } from "@/lib/lessons/schema";

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

function relationshipEdgesFor(pack: LessonPack, characterId: string): RelationshipEdge[] {
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

function createGraphDistances(pack: LessonPack, targetId: string): {
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
  pack: LessonPack,
  targetId: string,
  characterId: string,
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
  const direction = normalize({
    x: scores.direction / totalWeight + lane * 0.42,
    y: scores.valence / totalWeight + verticalLane * 0.12,
    z: scores.context / totalWeight + depthLane * 0.12,
  });
  const radius = 6.5 - strongest * 0.65;
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

function placeSeparated(
  candidate: RelationshipSpacePoint,
  placed: RelationshipSpacePoint[],
  seed: string,
): RelationshipSpacePoint {
  if (candidate.layer === "origin") return candidate;
  const base = normalize(candidate);
  const direction = hashUnit(seed) > 0.5 ? 1 : -1;

  for (let attempt = 0; attempt < 28; attempt += 1) {
    const angle = direction * Math.ceil(attempt / 2) * 0.105 * (attempt % 2 === 0 ? 1 : -1);
    const moved = scale(rotateAroundY(base, angle), candidate.radius);
    const separated = placed.every(
      (point) => Math.hypot(moved.x - point.x, moved.y - point.y, moved.z - point.z) > 1.05,
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

  const fallback = normalize({
    x: base.x + (hashUnit(`${seed}:x`) - 0.5) * 0.8,
    y: base.y + (hashUnit(`${seed}:y`) - 0.5) * 0.8,
    z: base.z + (hashUnit(`${seed}:z`) - 0.5) * 0.8,
  });
  const moved = scale(fallback, candidate.radius);
  return { ...candidate, x: round(moved.x), y: round(moved.y), z: round(moved.z) };
}

export function createRelationshipSpace(
  pack: LessonPack,
  targetId: string,
): RelationshipSpaceLayout {
  if (!pack.characters.some((character) => character.id === targetId)) {
    throw new Error(`Unknown relationship-space target: ${targetId}`);
  }

  const { degrees, firstHops, pathEdgeIds } = createGraphDistances(pack, targetId);
  const points = new Map<string, RelationshipSpacePoint>();
  const placed: RelationshipSpacePoint[] = [];

  for (const character of pack.characters) {
    const degree = degrees.get(character.id);
    let candidate: RelationshipSpacePoint;

    if (character.id === targetId) {
      candidate = { x: 0, y: 0, z: 0, layer: "origin", degree: 0, radius: 0 };
    } else if (degree === 1) {
      candidate = directPoint(pack, targetId, character.id);
    } else if (degree === 2) {
      const firstHop = firstHops.get(character.id)!;
      const anchor = points.get(firstHop) ?? directPoint(pack, targetId, firstHop);
      const radius = 7.2 + hashUnit(`${pack.layoutSeed}:${targetId}:${character.id}:degree2`) * 2.2;
      const semantic = normalize(anchor);
      const contextual = contextualDirection(`${targetId}:${character.id}:degree2`);
      const direction = normalize({
        x: semantic.x * 0.78 + contextual.x * 0.22,
        y: semantic.y * 0.78 + contextual.y * 0.22,
        z: semantic.z * 0.78 + contextual.z * 0.22,
      });
      const point = scale(direction, radius);
      candidate = {
        x: round(point.x),
        y: round(point.y),
        z: round(point.z),
        layer: "second-degree",
        degree,
        radius: round(radius),
      };
    } else {
      const radius = 10.5 + hashUnit(`${pack.layoutSeed}:${targetId}:${character.id}:context`) * 1.5;
      const point = scale(contextualDirection(`${targetId}:${character.id}:context`), radius);
      candidate = {
        x: round(point.x),
        y: round(point.y),
        z: round(point.z),
        layer: "context",
        degree: degree ?? null,
        radius: round(radius),
      };
    }

    const point = placeSeparated(
      candidate,
      placed,
      `${pack.layoutSeed}:${targetId}:${character.id}:separate`,
    );
    points.set(character.id, point);
    placed.push(point);
  }

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
