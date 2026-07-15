"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GalaxyPoint } from "@/lib/layout/galaxy-layout";
import type { RelationshipEdge } from "@/lib/lessons/schema";

export function RelationshipField({
  relationship,
  from,
  to,
  selected,
  highlighted,
  animate,
  onSelect,
}: {
  relationship: RelationshipEdge;
  from: GalaxyPoint;
  to: GalaxyPoint;
  selected: boolean;
  highlighted: boolean;
  animate: boolean;
  onSelect: () => void;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const endpoints = useMemo(() => ({
    from: new THREE.Vector3(from.x, from.y, from.z),
    to: new THREE.Vector3(to.x, to.y, to.z),
  }), [from, to]);
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setFromPoints([endpoints.from, endpoints.to]);
    return value;
  }, [endpoints]);

  useFrame(({ clock }) => {
    if (!pulseRef.current || !highlighted) return;
    const progress = animate ? (clock.elapsedTime * 0.16) % 1 : 0.5;
    pulseRef.current.position.lerpVectors(endpoints.from, endpoints.to, progress);
  });

  const disableRaycast = () => undefined;
  return (
    <group>
      <lineSegments
        geometry={geometry}
        userData={{ galaxyInteraction: "relationship", relationshipId: relationship.id }}
        onClick={(event) => {
          const planetWasHit = event.intersections.some(
            (intersection) => intersection.object.userData.galaxyInteraction === "planet",
          );
          if (planetWasHit) return;
          event.stopPropagation();
          onSelect();
        }}
      >
        <lineBasicMaterial
          color={highlighted ? "#f5f2e9" : selected ? "#a9d9ff" : "#78819b"}
          transparent
          opacity={highlighted ? 0.92 : selected ? 0.84 : relationship.isDisputed ? 0.2 : 0.38}
        />
      </lineSegments>
      {highlighted ? (
        <mesh ref={pulseRef} raycast={disableRaycast}>
          <sphereGeometry args={[0.065, 10, 10]} />
          <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
