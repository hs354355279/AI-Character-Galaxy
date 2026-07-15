import type { RelationshipSpacePoint } from "@/lib/layout/relationship-space";

export interface RelationshipCameraFrame {
  fov: 40;
  distance: number;
  minDistance: number;
  maxDistance: number;
}

export function fitRelationshipCamera(
  points: Iterable<RelationshipSpacePoint>,
  {
    aspect = 16 / 9,
    labelMargin = 1.8,
  }: { aspect?: number; labelMargin?: number } = {},
): RelationshipCameraFrame {
  const teachingPoints = [...points].filter((point) => point.layer !== "context");
  const frame = { fov: 40 as const, minDistance: 8, maxDistance: 34 };
  if (teachingPoints.length <= 1) return { ...frame, distance: 18 };

  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const safeMargin = Number.isFinite(labelMargin) && labelMargin >= 0 ? labelMargin : 1.8;
  const tangent = Math.tan((frame.fov * Math.PI) / 360);
  const vertical = Math.max(
    5,
    ...teachingPoints.map((point) => Math.abs(point.y) + safeMargin),
  );
  const horizontal = Math.max(
    8,
    ...teachingPoints.map((point) => Math.abs(point.x) / safeAspect + 1),
  );
  const nearestDepth = Math.max(0, ...teachingPoints.map((point) => point.z));
  const distance = Math.min(32, Math.max(18, nearestDepth + Math.max(vertical, horizontal) / tangent));

  return {
    ...frame,
    distance: Math.round(distance * 100) / 100,
  };
}
