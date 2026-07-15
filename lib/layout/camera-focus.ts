export type CameraVector = [number, number, number];

export interface CameraFocusTransition {
  fromCamera: CameraVector;
  fromTarget: CameraVector;
  toCamera: CameraVector;
  toTarget: CameraVector;
}

function add(left: CameraVector, right: CameraVector): CameraVector {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtract(left: CameraVector, right: CameraVector): CameraVector {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function interpolate(from: CameraVector, to: CameraVector, progress: number): CameraVector {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

export function createCameraFocusTransition(
  camera: CameraVector,
  target: CameraVector,
  nextTarget: CameraVector,
): CameraFocusTransition {
  return {
    fromCamera: camera,
    fromTarget: target,
    toCamera: add(nextTarget, subtract(camera, target)),
    toTarget: nextTarget,
  };
}

export function sampleCameraFocusTransition(
  transition: CameraFocusTransition,
  progress: number,
): { camera: CameraVector; target: CameraVector } {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = clamped * clamped * (3 - 2 * clamped);
  return {
    camera: interpolate(transition.fromCamera, transition.toCamera, eased),
    target: interpolate(transition.fromTarget, transition.toTarget, eased),
  };
}
