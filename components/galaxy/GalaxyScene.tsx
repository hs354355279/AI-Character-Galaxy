"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { createGalaxyLayout } from "@/lib/layout/galaxy-layout";
import {
  classifyRelationshipProminence,
  createRelationshipSpace,
} from "@/lib/layout/relationship-space";
import {
  createRelationshipPositionStore,
  ensureRelationshipPositions,
} from "@/lib/layout/relationship-transition";
import { GalaxyParticles } from "@/components/galaxy/GalaxyParticles";
import { PlanetNode } from "@/components/galaxy/PlanetNode";
import { RelationshipAxesLegend } from "@/components/galaxy/RelationshipAxesLegend";
import { RelationshipField } from "@/components/galaxy/RelationshipField";
import { RelationshipSpaceController } from "@/components/galaxy/RelationshipSpaceController";
import { getGalaxyQuality } from "@/lib/galaxy/visual-quality";
import { getCourseObservatoryPalette } from "@/lib/galaxy/observatory-palette";
import { fitRelationshipCamera } from "@/lib/layout/relationship-camera";
import {
  createGalaxyLabelTransform,
  getGalaxyLabelOpacity,
} from "@/lib/layout/galaxy-label";
import type { RelationshipGraph } from "@/lib/network-expansion/schemas";

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
    }> = [];

    for (const label of labels) {
      const element = elementsRef.current.get(label.id);
      const point = positions.get(label.id);
      if (!element || !point) continue;

      planetProjected.copy(point).project(camera);
      element.dataset.planetX = String((planetProjected.x * 0.5 + 0.5) * size.width);
      element.dataset.planetY = String((-planetProjected.y * 0.5 + 0.5) * size.height);
      element.dataset.worldX = point.x.toFixed(3);
      element.dataset.worldY = point.y.toFixed(3);
      element.dataset.worldZ = point.z.toFixed(3);
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

      element.style.visibility = "visible";
      element.style.opacity = String(getGalaxyLabelOpacity(distance));
      projectedLabels.push({ element, x, y, z: projected.z });
    }

    const placed: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    for (const label of projectedLabels) {
      const width = Math.max(1, label.element.offsetWidth);
      const height = Math.max(1, label.element.offsetHeight);
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
      label.element.style.transform = createGalaxyLabelTransform(x, y);
    }
  });

  return null;
}

export function GalaxyScene({
  graph,
  selectedCharacterId,
  selectedRelationshipIds,
  highlightedRelationshipIds,
  reduceMotion,
  onSelectCharacter,
  onSelectRelationship,
}: {
  graph: RelationshipGraph;
  selectedCharacterId: string | null;
  selectedRelationshipIds: string[];
  highlightedRelationshipIds: string[];
  reduceMotion: boolean;
  onSelectCharacter: (id: string) => void;
  onSelectRelationship: (id: string) => void;
}) {
  const overviewLayout = useMemo(() => createGalaxyLayout(graph), [graph]);
  const observatoryPalette = useMemo(
    () => getCourseObservatoryPalette(graph.id),
    [graph.id],
  );
  const semanticLayout = useMemo(
    () => selectedCharacterId ? createRelationshipSpace(graph, selectedCharacterId) : null,
    [graph, selectedCharacterId],
  );
  const targetPoints = semanticLayout?.points ?? overviewLayout;
  const selectedCharacter = selectedCharacterId
    ? graph.characters.find((character) => character.id === selectedCharacterId)
    : null;
  const [positions] = useState(() => createRelationshipPositionStore(overviewLayout));
  const spawn = selectedCharacterId
    ? targetPoints.get(selectedCharacterId) ?? { x: 0, y: 0, z: 0 }
    : { x: 0, y: 0, z: 0 };
  ensureRelationshipPositions(positions, targetPoints, spawn);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
    devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
  }));
  useEffect(() => {
    const update = () => setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  const quality = useMemo(
    () => getGalaxyQuality({ ...viewport, reducedMotion: reduceMotion }),
    [reduceMotion, viewport],
  );
  const cameraFrame = useMemo(() => {
    const aspect = viewport.width / Math.max(1, viewport.height);
    return graph.characters.reduce(
      (largest, character) => {
        const frame = fitRelationshipCamera(
          createRelationshipSpace(graph, character.id).points.values(),
          { aspect },
        );
        return frame.distance > largest.distance ? frame : largest;
      },
      fitRelationshipCamera([], { aspect }),
    );
  }, [graph, viewport.height, viewport.width]);
  const labelElementsRef = useRef(new Map<string, HTMLElement>());
  const labels = useMemo(
    () => graph.characters.map((character) => ({
      id: character.id,
      offsetY: 0.82 + character.importance * 0.1,
    })),
    [graph.characters],
  );

  return (
    <div
      className="galaxy-canvas"
      aria-label="Interactive 3D relationship galaxy"
      data-character-count={graph.characters.length}
      data-relationship-count={graph.relationships.length}
      data-course-accent={observatoryPalette.accent}
      data-scene-fog={observatoryPalette.fog}
    >
      <div className="galaxy-canvas-surface">
        <Canvas
          camera={{ position: [0, 1, cameraFrame.distance], fov: cameraFrame.fov }}
          dpr={quality.dpr}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <fog attach="fog" args={[observatoryPalette.fog, 20, 45]} />
          <ambientLight intensity={0.28} />
          <hemisphereLight
            args={[observatoryPalette.keyLight, observatoryPalette.groundLight, 0.72]}
          />
          <pointLight
            position={[5, 8, 12]}
            intensity={8}
            color={observatoryPalette.keyLight}
          />
          <pointLight
            position={[-8, 1, 5]}
            intensity={4}
            color={observatoryPalette.fillLight}
          />
          <pointLight
            position={[0, -6, -3]}
            intensity={2.5}
            color={observatoryPalette.rimLight}
          />
          <GalaxyParticles quality={quality} seed={graph.layoutSeed} />
          <RelationshipSpaceController
            positions={positions}
            targets={targetPoints}
            reduceMotion={reduceMotion}
          />
          {graph.relationships.map((relationship) => (
            <RelationshipField
              key={relationship.id}
              relationship={relationship}
              from={positions.get(relationship.fromCharacterId)!}
              to={positions.get(relationship.toCharacterId)!}
              selected={selectedRelationshipIds.includes(relationship.id)}
              highlighted={highlightedRelationshipIds.includes(relationship.id)}
              prominence={semanticLayout
                ? classifyRelationshipProminence(relationship, semanticLayout)
                : "context"}
              animate={quality.animate}
              onSelect={() => onSelectRelationship(relationship.id)}
            />
          ))}
          {graph.characters.map((character) => {
            const group = graph.groups.find((item) => item.id === character.groupId)!;
            return (
              <PlanetNode
                key={character.id}
                id={character.id}
                color={group.color}
                importance={character.importance}
                position={positions.get(character.id)!}
                selected={selectedCharacterId === character.id}
                expanded={character.provenance === "ai-expanded"}
                selectionColor={observatoryPalette.accent}
                expandedAccent={observatoryPalette.expandedAccent}
                animate={quality.animate}
                onSelect={() => onSelectCharacter(character.id)}
              />
            );
          })}
          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            enableDamping={!reduceMotion}
            minDistance={cameraFrame.minDistance}
            maxDistance={cameraFrame.maxDistance}
          />
          <GalaxyLabelProjector
            labels={labels}
            positions={positions}
            elementsRef={labelElementsRef}
          />
        </Canvas>
      </div>
      {selectedCharacter ? (
        <RelationshipAxesLegend targetName={selectedCharacter.name} />
      ) : null}
      <div className="galaxy-label-layer">
        {graph.characters.map((character) => {
          const group = graph.groups.find((item) => item.id === character.groupId)!;
          return (
            <div
              key={character.id}
              data-character-label={character.name}
              data-selected={selectedCharacterId === character.id ? "true" : undefined}
              data-space-origin={selectedCharacterId === character.id ? "true" : undefined}
              data-label-layer={semanticLayout?.points.get(character.id)?.layer ?? "overview"}
              data-provenance={character.provenance}
              ref={(element) => {
                if (element) labelElementsRef.current.set(character.id, element);
                else labelElementsRef.current.delete(character.id);
              }}
              className="galaxy-node-label"
              aria-hidden="true"
              style={{ "--planet-accent": group.color } as React.CSSProperties}
            >
              <span>{character.provenance === "ai-expanded" ? "AI" : group.symbol}</span><strong>{character.name}</strong><small>{character.role}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
