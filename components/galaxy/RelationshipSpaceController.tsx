"use client";

import { useFrame } from "@react-three/fiber";
import type { GalaxyPoint } from "@/lib/layout/galaxy-layout";
import {
  advanceRelationshipPositions,
  type RelationshipPositionStore,
} from "@/lib/layout/relationship-transition";

export function RelationshipSpaceController({
  positions,
  targets,
  reduceMotion,
}: {
  positions: RelationshipPositionStore;
  targets: Map<string, GalaxyPoint>;
  reduceMotion: boolean;
}) {
  useFrame((_, delta) => {
    advanceRelationshipPositions(positions, targets, delta, reduceMotion);
  }, -1);

  return null;
}
