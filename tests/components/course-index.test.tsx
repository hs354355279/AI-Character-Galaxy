import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseIndex } from "@/components/courses/CourseIndex";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

const lessons = getAllLessonPacks().map(createLandingLesson);

describe("course index", () => {
  it("renders both validated courses as editorial chapters", () => {
    render(<CourseIndex lessons={lessons} />);

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /Enter French Revolution/i }),
    ).toHaveAttribute("href", "/learn/french-revolution");
    expect(
      screen.getByRole("link", { name: /Enter Romeo and Juliet/i }),
    ).toHaveAttribute("href", "/learn/romeo-and-juliet");
    expect(screen.getAllByRole("link", { name: /View sources/i })).toHaveLength(2);
  });
});
