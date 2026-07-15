"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uBase;
  uniform vec3 uShadow;
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float ridge = sin(vPosition.y * 13.0 + sin(vPosition.x * 7.0 + uSeed) * 1.8 + uTime * 0.08);
    float grain = sin((vPosition.x + vPosition.z) * 21.0 + uSeed * 3.1) * 0.18;
    float field = smoothstep(-0.7, 0.82, ridge + grain);
    vec3 surface = mix(uShadow, uBase, field);
    vec3 lightDirection = normalize(vec3(-0.35, 0.68, 0.72));
    float diffuse = 0.32 + max(dot(normalize(vNormal), lightDirection), 0.0) * 0.78;
    float rim = pow(1.0 - abs(vNormal.z), 3.0) * 0.24;
    gl_FragColor = vec4(surface * diffuse + uBase * rim, 1.0);
  }
`;

function seedFromId(id: string): number {
  return [...id].reduce((value, character) => value + character.charCodeAt(0), 0) % 97;
}

export function PlanetNode({
  id,
  color,
  importance,
  position,
  selected,
  animate,
  onSelect,
}: {
  id: string;
  color: string;
  importance: number;
  position: THREE.Vector3;
  selected: boolean;
  animate: boolean;
  onSelect: () => void;
}) {
  const size = 0.38 + importance * 0.1;
  const seed = seedFromId(id);
  const groupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.ShaderMaterial>(null);
  const colors = useMemo(() => {
    const base = new THREE.Color(color).lerp(new THREE.Color("#f0ece2"), 0.18);
    const shadow = new THREE.Color(color).multiplyScalar(0.34);
    return { base, shadow };
  }, [color]);

  useFrame(({ clock }, delta) => {
    if (surfaceRef.current) surfaceRef.current.uniforms.uTime.value = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      if (animate) groupRef.current.rotation.y += delta * (0.025 + seed * 0.00015);
    }
  });

  const disableRaycast = () => undefined;
  return (
    <group
      ref={groupRef}
      rotation={[seed * 0.008, seed * 0.014, -0.16 + seed * 0.002]}
    >
      <mesh
        userData={{ galaxyInteraction: "planet", characterId: id }}
        onClick={(event) => { event.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[size * 1.42, 28, 28]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      <mesh raycast={disableRaycast}>
        <sphereGeometry args={[size, 40, 40]} />
        <shaderMaterial
          ref={surfaceRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uBase: { value: colors.base },
            uShadow: { value: colors.shadow },
            uTime: { value: 0 },
            uSeed: { value: seed * 0.17 },
          }}
        />
      </mesh>
      <mesh raycast={disableRaycast} scale={1.11}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={selected ? 0.3 : 0.13}
          depthWrite={false}
        />
      </mesh>
      <mesh raycast={disableRaycast} rotation={[Math.PI / 2 + seed * 0.006, 0, 0]}>
        <torusGeometry args={[size * 1.55, size * 0.035, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.36} depthWrite={false} />
      </mesh>
      <mesh raycast={disableRaycast} rotation={[Math.PI / 2 + seed * 0.006, 0, 0]}>
        <torusGeometry args={[size * 1.9, size * 0.012, 6, 64]} />
        <meshBasicMaterial color="#f4f0e7" transparent opacity={selected ? 0.7 : 0.12} depthWrite={false} />
      </mesh>
      {selected ? (
        <mesh raycast={disableRaycast} scale={1.34}>
          <sphereGeometry args={[size, 20, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} wireframe depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
