"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  createCameraFocusTransition,
  sampleCameraFocusTransition,
  type CameraVector,
  type CameraFocusTransition,
} from "@/lib/layout/camera-focus";
import { createGalaxyLayout, type GalaxyPoint } from "@/lib/layout/galaxy-layout";
import type { LessonPack, RelationshipEdge } from "@/lib/lessons/schema";

const FOCUS_DURATION_SECONDS = 0.55;

function toCameraVector(vector: THREE.Vector3): CameraVector {
  return [vector.x, vector.y, vector.z];
}

function CameraFocus({
  point,
  reduceMotion,
  controlsRef,
}: {
  point?: GalaxyPoint;
  reduceMotion: boolean;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const transitionRef = useRef<CameraFocusTransition | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!point || !controls) {
      transitionRef.current = null;
      return;
    }

    const transition = createCameraFocusTransition(
      toCameraVector(camera.position),
      toCameraVector(controls.target),
      [point.x, point.y, point.z],
    );

    if (reduceMotion) {
      camera.position.fromArray(transition.toCamera);
      controls.target.fromArray(transition.toTarget);
      controls.update();
      transitionRef.current = null;
      return;
    }

    elapsedRef.current = 0;
    transitionRef.current = transition;
  }, [camera, controlsRef, point, reduceMotion]);

  useFrame((_, delta) => {
    const transition = transitionRef.current;
    const controls = controlsRef.current;
    if (!transition || !controls) return;

    elapsedRef.current += Math.min(delta, 0.1);
    const progress = Math.min(1, elapsedRef.current / FOCUS_DURATION_SECONDS);
    const frame = sampleCameraFocusTransition(transition, progress);
    camera.position.fromArray(frame.camera);
    controls.target.fromArray(frame.target);
    controls.update();

    if (progress === 1) transitionRef.current = null;
  });

  return null;
}

function GalaxyNode({
  color,
  importance,
  point,
  selected,
  onSelect,
}: {
  color: string;
  importance: number;
  point: GalaxyPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const size = 0.25 + importance * 0.08;
  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh userData={{ galaxyInteraction: "planet" }} onClick={(event) => { event.stopPropagation(); onSelect(); }} scale={selected ? 1.3 : 1}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.5 : 0.45} roughness={0.32} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.55, 0.025, 8, 36]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.42} />
      </mesh>
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
    <lineSegments geometry={geometry} onClick={(event) => {
      const planetWasHit = event.intersections.some(
        (intersection) => intersection.object.userData.galaxyInteraction === "planet",
      );
      if (planetWasHit) return;
      event.stopPropagation();
      onSelect();
    }}>
      <lineBasicMaterial color={highlighted ? "#ffffff" : selected ? "#9fd2ff" : "#78819b"} transparent opacity={highlighted ? 1 : selected ? 0.9 : relationship.isDisputed ? 0.28 : 0.48} linewidth={1} />
    </lineSegments>
  );
}

interface GalaxyLabelPosition {
  id: string;
  point: GalaxyPoint;
  offsetY: number;
}

function GalaxyLabelProjector({
  labels,
  elementsRef,
}: {
  labels: GalaxyLabelPosition[];
  elementsRef: RefObject<Map<string, HTMLButtonElement>>;
}) {
  const { camera, size } = useThree();
  const world = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const pointDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.getWorldDirection(cameraDirection);
    const projectedLabels: Array<{
      element: HTMLButtonElement;
      x: number;
      y: number;
      z: number;
      scale: number;
    }> = [];

    for (const label of labels) {
      const element = elementsRef.current.get(label.id);
      if (!element) continue;

      world.set(label.point.x, label.point.y + label.offsetY, label.point.z);
      pointDirection.copy(world).sub(camera.position);
      projected.copy(world).project(camera);

      const visible =
        cameraDirection.dot(pointDirection) > 0 &&
        projected.z >= -1 &&
        projected.z <= 1;

      if (!visible) {
        element.style.visibility = "hidden";
        continue;
      }

      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const distance = Math.max(1, camera.position.distanceTo(world));
      const scale = camera instanceof THREE.PerspectiveCamera
        ? 13 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance)
        : camera.zoom;

      element.style.visibility = "visible";
      projectedLabels.push({ element, x, y, z: projected.z, scale });
    }

    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    for (const label of projectedLabels) {
      const width = Math.max(1, label.element.offsetWidth * label.scale);
      const height = Math.max(1, label.element.offsetHeight * label.scale);
      const x = Math.min(size.width - width / 2 - 8, Math.max(width / 2 + 8, label.x));
      const step = height + 6;
      let y = label.y;

      for (let attempt = 0; attempt < projectedLabels.length * 2; attempt += 1) {
        const direction = attempt % 2 === 0 ? -1 : 1;
        const distance = Math.ceil(attempt / 2) * step;
        const candidateY = Math.min(
          size.height - height / 2 - 8,
          Math.max(height / 2 + 8, label.y + direction * distance),
        );
        const candidate = {
          left: x - width / 2,
          right: x + width / 2,
          top: candidateY - height / 2,
          bottom: candidateY + height / 2,
        };
        const overlaps = placed.some((other) =>
          candidate.left < other.right + 4 &&
          candidate.right > other.left - 4 &&
          candidate.top < other.bottom + 4 &&
          candidate.bottom > other.top - 4,
        );

        y = candidateY;
        if (!overlaps) {
          placed.push(candidate);
          break;
        }
      }

      label.element.style.zIndex = String(Math.round((1 - label.z) * 1000));
      label.element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${label.scale})`;
    }
  });

  return null;
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
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const labelElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const labels = useMemo(
    () => lesson.characters.map((character) => ({
      id: character.id,
      point: layout.get(character.id)!,
      offsetY: 0.6 + character.importance * 0.08,
    })),
    [layout, lesson.characters],
  );

  return (
    <div className="galaxy-canvas" aria-label="Interactive 3D relationship galaxy">
      <div className="galaxy-canvas-surface">
        <Canvas camera={{ position: [0, 1, 18], fov: 44 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.65} />
          <pointLight position={[5, 8, 12]} intensity={22} color="#b8d7ff" />
          <Stars radius={45} depth={24} count={reduceMotion ? 80 : 260} factor={2} fade speed={reduceMotion ? 0 : 0.25} />
          {lesson.relationships.map((relationship) => (
            <GalaxyEdge key={relationship.id} relationship={relationship} from={layout.get(relationship.fromCharacterId)!} to={layout.get(relationship.toCharacterId)!} selected={selectedRelationshipIds.includes(relationship.id)} highlighted={highlightedRelationshipIds.includes(relationship.id)} onSelect={() => onSelectRelationship(relationship.id)} />
          ))}
          {lesson.characters.map((character) => {
            const group = lesson.groups.find((item) => item.id === character.groupId)!;
            return <GalaxyNode key={character.id} color={group.color} importance={character.importance} point={layout.get(character.id)!} selected={selectedCharacterId === character.id} onSelect={() => onSelectCharacter(character.id)} />;
          })}
          <OrbitControls ref={controlsRef} enablePan={false} enableDamping={!reduceMotion} minDistance={8} maxDistance={28} />
          <CameraFocus point={selectedCharacterId ? layout.get(selectedCharacterId) : undefined} reduceMotion={reduceMotion} controlsRef={controlsRef} />
          <GalaxyLabelProjector labels={labels} elementsRef={labelElementsRef} />
        </Canvas>
      </div>
      <div className="galaxy-label-layer">
        {lesson.characters.map((character) => {
          const group = lesson.groups.find((item) => item.id === character.groupId)!;
          return (
            <button
              key={character.id}
              ref={(element) => {
                if (element) labelElementsRef.current.set(character.id, element);
                else labelElementsRef.current.delete(character.id);
              }}
              className="galaxy-node-label"
              type="button"
              aria-label={`Select ${character.name}`}
              aria-pressed={selectedCharacterId === character.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectCharacter(character.id);
              }}
            >
              <span>{group.symbol}</span><strong>{character.name}</strong><small>{character.role}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
