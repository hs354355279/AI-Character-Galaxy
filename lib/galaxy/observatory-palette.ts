import * as THREE from "three";

export const MINERAL_GROUP_COLORS = {
  monarchy: "#b79a5b",
  constitutional: "#5d83b1",
  radical: "#bd5b63",
  ideas: "#8d75ad",
  postRevolution: "#579583",
} as const;

export interface CourseObservatoryPalette {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  fog: string;
  keyLight: string;
  fillLight: string;
  groundLight: string;
  rimLight: string;
  expandedAccent: string;
}

const COURSE_OBSERVATORY_PALETTES: Record<string, CourseObservatoryPalette> = {
  "french-revolution": {
    accent: MINERAL_GROUP_COLORS.radical,
    accentStrong: "#914750",
    accentSoft: "#eee1e1",
    fog: "#0b111e",
    keyLight: "#d8e2ed",
    fillLight: "#817792",
    groundLight: "#292536",
    rimLight: MINERAL_GROUP_COLORS.radical,
    expandedAccent: MINERAL_GROUP_COLORS.postRevolution,
  },
  "romeo-and-juliet": {
    accent: MINERAL_GROUP_COLORS.ideas,
    accentStrong: "#66587f",
    accentSoft: "#ebe5ef",
    fog: "#0b111e",
    keyLight: "#d8e2ed",
    fillLight: "#817792",
    groundLight: "#292536",
    rimLight: MINERAL_GROUP_COLORS.ideas,
    expandedAccent: MINERAL_GROUP_COLORS.postRevolution,
  },
};

const DEFAULT_COURSE_PALETTE = COURSE_OBSERVATORY_PALETTES["french-revolution"];
const COOL_STONE = new THREE.Color("#dce1e5");
const LIFTED_SHADOW = new THREE.Color("#293446");

export function getCourseObservatoryPalette(lessonId: string): CourseObservatoryPalette {
  return COURSE_OBSERVATORY_PALETTES[lessonId] ?? DEFAULT_COURSE_PALETTE;
}

function toHex(color: THREE.Color) {
  return `#${color.getHexString()}`;
}

export function getMineralPlanetColors(color: string) {
  const groupColor = new THREE.Color(color);

  return {
    base: toHex(groupColor.clone().lerp(COOL_STONE, 0.12)),
    highlight: toHex(groupColor.clone().lerp(COOL_STONE, 0.4)),
    shadow: toHex(groupColor.clone().lerp(LIFTED_SHADOW, 0.5)),
  };
}
