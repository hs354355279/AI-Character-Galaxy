import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningExperience } from "@/components/learning/LearningExperience";
import { getLessonPack } from "@/lib/lessons/repository";

vi.mock("@/components/galaxy/GalaxyScene", () => ({
  GalaxyScene: () => <div aria-label="Interactive 3D relationship galaxy" />,
}));

describe("offline learning flow", () => {
  it("keeps every mission control available without WebGL or network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(
      <LearningExperience
        lesson={getLessonPack("romeo-and-juliet")!}
        initialView="3d"
        webglAvailable={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /start missions/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/3D is unavailable/i);
    expect(screen.getByRole("button", { name: "3D galaxy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select Friar Laurence" })).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
