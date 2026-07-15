"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { createGalaxyLayout } from "@/lib/layout/galaxy-layout";
import { createRelationshipSpace } from "@/lib/layout/relationship-space";
import { createRelationshipPositionStore } from "@/lib/layout/relationship-transition";
import { GalaxyParticles } from "@/components/galaxy/GalaxyParticles";
import { PlanetNode } from "@/components/galaxy/PlanetNode";
import { RelationshipField } from "@/components/galaxy/RelationshipField";
import { RelationshipSpaceController } from "@/components/galaxy/RelationshipSpaceController";
import { getGalaxyQuality } from "@/lib/galaxy/visual-quality";
import type { LessonPack } from "@/lib/lessons/schema";

interface GalaxyLabelPosition {
  id: string;
  offsetY: number;
}

function GalaxyLabelProjector({
  labels,
  positions,
  elementsRef,
}: {
  labels: GalaxyLabelPosition[];
  positions: Map<string, THREE.Vector3>;
  elementsRef: RefObject<Map<string, HTMLElement>>;
}) {
  const { camera, size } = useThree();
  const world = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const planetProjected = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const pointDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.getWorldDirection(cameraDirection);
    const projectedLabels: Array<{
      element: HTMLElement;
      x: number;
      y: number;
      z: number;
      scale: number;
    }> = [];

    for (const label of labels) {
      const element = elementsRef.current.get(label.id);
      const point = positions.get(label.id);
      if (!element || !point) continue;

      planetProjected.copy(point).project(camera);
      element.dataset.planetX = String((planetProjected.x * 0.5 + 0.5) * size.width);
      element.dataset.planetY = String((-planetProjected.y * 0.5 + 0.5) * size.height);
      element.dataset.projectionReady = "true";
      world.set(point.x, point.y + label.offsetY, point.z);
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
      let y = Math.max(38 + height / 2, label.y);

      for (let attempt = 0; attempt < projectedLabels.length * 2; attempt += 1) {
        const direction = attempt % 2 === 0 ? -1 : 1;
        const distance = Math.ceil(attempt / 2) * step;
        const candidateY = Math.min(
          size.height - height / 2 - 8,
          Math.max(height / 2 + 38, label.y + direction * distance),
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
  const overviewLayout = useMemo(() => createGalaxyLayout(lesson), [lesson]);
  const semanticLayout = useMemo(
    () => selectedCharacterId ? createRelationshipSpace(lesson, selectedCharacterId) : null,
    [lesson, selectedCharacterId],
  );
  const targetPoints = semanticLayout?.points ?? overviewLayout;
  const positions = useMemo(
    () => createRelationshipPositionStore(overviewLayout),
    [overviewLayout],
  );
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
  }));
  useEffect(() => {
    const update = () => setViewport({
      width: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
    });
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  const quality = useMemo(
    () => getGalaxyQuality({ ...viewport, reducedMotion: reduceMotion }),
    [reduceMotion, viewport],
  );
  const labelElementsRef = useRef(new Map<string, HTMLElement>());
  const labels = useMemo(
    () => lesson.characters.map((character) => ({
      id: character.id,
      offsetY: 0.6 + character.importance * 0.08,
    })),
    [lesson.characters],
  );

  return (
    <div className="galaxy-canvas" aria-label="Interactive 3D relationship galaxy">
      <div className="galaxy-canvas-surface">
        <Canvas
          camera={{ position: [0, 1, 18], fov: 44 }}
          dpr={quality.dpr}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <fog attach="fog" args={["#080c16", 20, 45]} />
          <ambientLight intensity={0.4} />
          <hemisphereLight args={["#c5dcff", "#241b32", 1.1]} />
          <pointLight position={[5, 8, 12]} intensity={16} color="#b8d7ff" />
          <pointLight position={[-9, -4, 3]} intensity={9} color="#e86c7b" />
          <GalaxyParticles quality={quality} seed={lesson.layoutSeed} />
          <RelationshipSpaceController
            positions={positions}
            targets={targetPoints}
            reduceMotion={reduceMotion}
          />
          {lesson.relationships.map((relationship) => (
            <RelationshipField
              key={relationship.id}
              relationship={relationship}
              from={positions.get(relationship.fromCharacterId)!}
              to={positions.get(relationship.toCharacterId)!}
              selected={selectedRelationshipIds.includes(relationship.id)}
              highlighted={highlightedRelationshipIds.includes(relationship.id)}
              animate={quality.animate}
              onSelect={() => onSelectRelationship(relationship.id)}
            />
          ))}
          {lesson.characters.map((character) => {
            const group = lesson.groups.find((item) => item.id === character.groupId)!;
            return (
              <PlanetNode
                key={character.id}
                id={character.id}
                color={group.color}
                importance={character.importance}
                position={positions.get(character.id)!}
                selected={selectedCharacterId === character.id}
                animate={quality.animate}
                onSelect={() => onSelectCharacter(character.id)}
              />
            );
          })}
          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            enableDamping={!reduceMotion}
            minDistance={8}
            maxDistance={28}
          />
          <GalaxyLabelProjector
            labels={labels}
            positions={positions}
            elementsRef={labelElementsRef}
          />
        </Canvas>
      </div>
      <div className="galaxy-label-layer">
        {lesson.characters.map((character) => {
          const group = lesson.groups.find((item) => item.id === character.groupId)!;
          return (
            <div
              key={character.id}
              data-character-label={character.name}
              data-selected={selectedCharacterId === character.id ? "true" : undefined}
              ref={(element) => {
                if (element) labelElementsRef.current.set(character.id, element);
                else labelElementsRef.current.delete(character.id);
              }}
              className="galaxy-node-label"
              aria-hidden="true"
              style={{ "--planet-accent": group.color } as React.CSSProperties}
            >
              <span>{group.symbol}</span><strong>{character.name}</strong><small>{character.role}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
