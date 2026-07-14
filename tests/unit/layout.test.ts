import { describe, expect, it } from "vitest";
import { createGalaxyLayout } from "@/lib/layout/galaxy-layout";
import { getLessonPack } from "@/lib/lessons/repository";

describe("createGalaxyLayout", () => {
  it("returns stable coordinates for the same seed", () => {
    const lesson = getLessonPack("french-revolution")!;
    expect([...createGalaxyLayout(lesson).entries()]).toEqual([
      ...createGalaxyLayout(lesson).entries(),
    ]);
  });

  it("changes coordinates when the lesson seed changes", () => {
    const lesson = getLessonPack("french-revolution")!;
    const first = createGalaxyLayout(lesson);
    const second = createGalaxyLayout({ ...lesson, layoutSeed: lesson.layoutSeed + 1 });
    expect(first.get("robespierre")).not.toEqual(second.get("robespierre"));
  });

  it("keeps every coordinate finite and inside the teaching viewport", () => {
    const lesson = getLessonPack("romeo-and-juliet")!;
    for (const point of createGalaxyLayout(lesson).values()) {
      expect(Number.isFinite(point.x + point.y + point.z)).toBe(true);
      expect(Math.hypot(point.x, point.y, point.z)).toBeLessThan(15);
    }
  });
});
