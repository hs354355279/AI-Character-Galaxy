"use client";

import type { ReactNode } from "react";

export function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function WebGLBoundary({
  available,
  children,
  fallback,
}: {
  available: boolean;
  children: ReactNode;
  fallback: ReactNode;
}) {
  return available ? children : fallback;
}
