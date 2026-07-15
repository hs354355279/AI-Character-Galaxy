export function snapLabelCoordinate(value: number): number {
  return Math.round(value * 2) / 2;
}

export function createGalaxyLabelTransform(x: number, y: number): string {
  return `translate3d(${snapLabelCoordinate(x)}px, ${snapLabelCoordinate(y)}px, 0) translate(-50%, -50%)`;
}

export function getGalaxyLabelOpacity(distance: number): number {
  if (!Number.isFinite(distance)) return 1;
  return Math.min(1, Math.max(0.56, 1.2 - distance / 42));
}
