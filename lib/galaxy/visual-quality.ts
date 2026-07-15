export interface GalaxyQualityInput {
  width: number;
  devicePixelRatio: number;
  reducedMotion: boolean;
}

export interface GalaxyQuality {
  dpr: number;
  starCount: number;
  dustCount: number;
  animate: boolean;
}

export function getGalaxyQuality(input: GalaxyQualityInput): GalaxyQuality {
  const pixelRatio = Math.max(1, input.devicePixelRatio || 1);
  if (input.width < 700) {
    return {
      dpr: Math.min(pixelRatio, 1.15),
      starCount: input.reducedMotion ? 120 : 260,
      dustCount: input.reducedMotion ? 42 : 78,
      animate: !input.reducedMotion,
    };
  }
  if (input.width < 1100) {
    return {
      dpr: Math.min(pixelRatio, 1.25),
      starCount: input.reducedMotion ? 180 : 380,
      dustCount: input.reducedMotion ? 64 : 118,
      animate: !input.reducedMotion,
    };
  }
  return {
    dpr: Math.min(pixelRatio, 1.35),
    starCount: input.reducedMotion ? 220 : 520,
    dustCount: input.reducedMotion ? 90 : 168,
    animate: !input.reducedMotion,
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createParticlePositions(
  count: number,
  seed: number,
  radius: number,
  innerRadius = 0,
): Float32Array {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const innerCube = innerRadius ** 3;
  const radiusCube = radius ** 3;
  for (let index = 0; index < count; index += 1) {
    const distance = Math.cbrt(innerCube + random() * (radiusCube - innerCube));
    const theta = random() * Math.PI * 2;
    const cosine = random() * 2 - 1;
    const sine = Math.sqrt(1 - cosine * cosine);
    positions[index * 3] = distance * sine * Math.cos(theta);
    positions[index * 3 + 1] = distance * cosine;
    positions[index * 3 + 2] = distance * sine * Math.sin(theta);
  }
  return positions;
}
