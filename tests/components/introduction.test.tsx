import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LessonIntroduction } from "@/components/learning/LessonIntroduction";
import { getLessonPack } from "@/lib/lessons/repository";

describe("LessonIntroduction", () => {
  it("shows objectives, essential question, and a text-equivalent legend", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <LessonIntroduction
        lesson={getLessonPack("french-revolution")!}
        onStart={onStart}
      />,
    );

    expect(screen.getByText(/How did relationships and competing ideas/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /learning objectives/i })).toBeVisible();
    expect(screen.getByText(/Solid lines show established relationships/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /start missions/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
