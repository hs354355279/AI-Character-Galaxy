import * as THREE from "three";
import type { GalaxyPoint } from "@/lib/layout/galaxy-layout";

export type RelationshipPositionStore = Map<string, THREE.Vector3>;

export function createRelationshipPositionStore(
  points: Map<string, GalaxyPoint>,
): RelationshipPositionStore {
  return new Map(
    [...points].map(([id, point]) => [
      id,
      new THREE.Vector3(point.x, point.y, point.z),
    ]),
  );
}

export function advanceRelationshipPositions(
  positions: RelationshipPositionStore,
  targets: Map<string, GalaxyPoint>,
  delta: number,
  snap: boolean,
): void {
  const alpha = snap ? 1 : 1 - Math.exp(-8 * Math.min(delta, 0.1));

  for (const [id, target] of targets) {
    let current = positions.get(id);
    if (!current) {
      current = new THREE.Vector3(target.x, target.y, target.z);
      positions.set(id, current);
      continue;
    }

    current.x += (target.x - current.x) * alpha;
    current.y += (target.y - current.y) * alpha;
    current.z += (target.z - current.z) * alpha;
  }
}
