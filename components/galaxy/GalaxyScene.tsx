"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createGalaxyLayout, type GalaxyPoint } from "@/lib/layout/galaxy-layout";
import type { LessonPack, RelationshipEdge } from "@/lib/lessons/schema";

function CameraFocus({ point, reduceMotion }: { point?: GalaxyPoint; reduceMotion: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!point) return;
    const target = new THREE.Vector3(point.x, point.y, point.z);
    const destination = target.clone().add(new THREE.Vector3(0, 1.2, 8));
    if (reduceMotion) camera.position.copy(destination);
    else camera.position.lerp(destination, 0.75);
    camera.lookAt(target);
  }, [camera, point, reduceMotion]);
  return null;
}

function GalaxyNode({
  name,
  role,
  color,
  symbol,
  importance,
  point,
  selected,
  onSelect,
}: {
  name: string;
  role: string;
  color: string;
  symbol: string;
  importance: number;
  point: GalaxyPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const size = 0.25 + importance * 0.08;
  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh onClick={(event) => { event.stopPropagation(); onSelect(); }} scale={selected ? 1.3 : 1}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.5 : 0.45} roughness={0.32} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.55, 0.025, 8, 36]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.42} />
      </mesh>
      <Html center position={[0, size + 0.35, 0]} distanceFactor={13}>
        <button className="galaxy-node-label" type="button" aria-label={`Select ${name}`} onClick={onSelect}>
          <span>{symbol}</span><strong>{name}</strong><small>{role}</small>
        </button>
      </Html>
    </group>
  );
}

function GalaxyEdge({
  relationship,
  from,
  to,
  selected,
  highlighted,
  onSelect,
}: {
  relationship: RelationshipEdge;
  from: GalaxyPoint;
  to: GalaxyPoint;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
}) {
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setFromPoints([new THREE.Vector3(from.x, from.y, from.z), new THREE.Vector3(to.x, to.y, to.z)]);
    return value;
  }, [from, to]);
  return (
    <lineSegments geometry={geometry} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <lineBasicMaterial color={highlighted ? "#ffffff" : selected ? "#9fd2ff" : "#78819b"} transparent opacity={highlighted ? 1 : selected ? 0.9 : relationship.isDisputed ? 0.28 : 0.48} linewidth={1} />
    </lineSegments>
  );
}

export function GalaxyScene({
  lesson,
  selectedCharacterId,
  selectedRelationshipIds,
  highlightedRelationshipIds,
  reduceMotion,
  onSelectCharacter,
  onSelectRelationship,
}: {
  lesson: LessonPack;
  selectedCharacterId: string | null;
  selectedRelationshipIds: string[];
  highlightedRelationshipIds: string[];
  reduceMotion: boolean;
  onSelectCharacter: (id: string) => void;
  onSelectRelationship: (id: string) => void;
}) {
  const layout = useMemo(() => createGalaxyLayout(lesson), [lesson]);
  return (
    <div className="galaxy-canvas" aria-label="Interactive 3D relationship galaxy">
      <Canvas camera={{ position: [0, 1, 18], fov: 44 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.65} />
        <pointLight position={[5, 8, 12]} intensity={22} color="#b8d7ff" />
        <Stars radius={45} depth={24} count={reduceMotion ? 80 : 260} factor={2} fade speed={reduceMotion ? 0 : 0.25} />
        {lesson.relationships.map((relationship) => (
          <GalaxyEdge key={relationship.id} relationship={relationship} from={layout.get(relationship.fromCharacterId)!} to={layout.get(relationship.toCharacterId)!} selected={selectedRelationshipIds.includes(relationship.id)} highlighted={highlightedRelationshipIds.includes(relationship.id)} onSelect={() => onSelectRelationship(relationship.id)} />
        ))}
        {lesson.characters.map((character) => {
          const group = lesson.groups.find((item) => item.id === character.groupId)!;
          return <GalaxyNode key={character.id} name={character.name} role={character.role} color={group.color} symbol={group.symbol} importance={character.importance} point={layout.get(character.id)!} selected={selectedCharacterId === character.id} onSelect={() => onSelectCharacter(character.id)} />;
        })}
        <CameraFocus point={selectedCharacterId ? layout.get(selectedCharacterId) : undefined} reduceMotion={reduceMotion} />
        <OrbitControls enablePan={false} enableDamping={!reduceMotion} minDistance={8} maxDistance={28} />
      </Canvas>
    </div>
  );
}
