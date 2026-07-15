import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getLessonPack } from "@/lib/lessons/repository";

describe("landing lesson view model", () => {
  it("maps history to the approved coral artwork", () => {
    const lesson = createLandingLesson(getLessonPack("french-revolution")!, 0);

    expect(lesson).toMatchObject({
      number: "01",
      slug: "french-revolution",
      accent: "coral",
      image: {
        src: "/images/landing/lesson-french-revolution.png",
        width: 1122,
        height: 1402,
      },
    });
    expect(lesson.objectives).toHaveLength(3);
    expect(
      fs.existsSync(
        path.join(process.cwd(), "public", lesson.image.src.replace(/^\//, "")),
      ),
    ).toBe(true);
  });

  it("maps literature to the approved violet artwork", () => {
    const lesson = createLandingLesson(getLessonPack("romeo-and-juliet")!, 1);

    expect(lesson).toMatchObject({
      number: "02",
      slug: "romeo-and-juliet",
      accent: "violet",
      image: {
        src: "/images/landing/lesson-romeo-and-juliet.png",
        width: 1122,
        height: 1402,
      },
    });
  });
});
