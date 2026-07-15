import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks } from "@/lib/lessons/repository";

const lessons = getAllLessonPacks().map(createLandingLesson);

describe("shared exhibition navigation", () => {
  it("links every primary destination and official course", () => {
    render(<ExhibitionHeader lessons={lessons} theme="paper" />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Exhibition" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: "Characters" })).toHaveAttribute(
      "href",
      "/characters",
    );
    expect(screen.getByRole("link", { name: /French Revolution/ })).toHaveAttribute(
      "href",
      "/learn/french-revolution",
    );
    expect(screen.getByRole("link", { name: /Romeo and Juliet/ })).toHaveAttribute(
      "href",
      "/learn/romeo-and-juliet",
    );
  });
});
