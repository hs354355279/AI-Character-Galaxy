"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createParticlePositions, type GalaxyQuality } from "@/lib/galaxy/visual-quality";

export function GalaxyParticles({ quality, seed }: { quality: GalaxyQuality; seed: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const stars = useMemo(
    () => createParticlePositions(quality.starCount, seed + 101, 34, 12),
    [quality.starCount, seed],
  );
  const dust = useMemo(
    () => createParticlePositions(quality.dustCount, seed + 307, 13, 3),
    [quality.dustCount, seed],
  );

  useFrame((_, delta) => {
    if (!quality.animate) return;
    if (starsRef.current) starsRef.current.rotation.y += delta * 0.003;
    if (dustRef.current) {
      dustRef.current.rotation.y -= delta * 0.008;
      dustRef.current.rotation.x += delta * 0.0015;
    }
  });

  const disableRaycast = () => undefined;
  return (
    <group>
      <points ref={starsRef} raycast={disableRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#dfe9ff" size={0.055} sizeAttenuation transparent opacity={0.68} depthWrite={false} />
      </points>
      <points ref={dustRef} raycast={disableRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#b9a3ff"
          size={0.095}
          sizeAttenuation
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
