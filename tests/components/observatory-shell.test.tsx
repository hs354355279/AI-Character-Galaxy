import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObservatoryShell } from "@/components/learning/ObservatoryShell";
import { getLessonPack } from "@/lib/lessons/repository";

const lesson = getLessonPack("french-revolution")!;

describe("ObservatoryShell", () => {
  it("exposes the editorial rail, dominant stage, evidence sheet, and people filmstrip", () => {
    render(
      <ObservatoryShell
        lesson={lesson}
        mission={<p>mission slot</p>}
        galaxy={<p>galaxy slot</p>}
        evidence={<p>evidence slot</p>}
        characterIndex={<p>people slot</p>}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Current mission" })).toHaveTextContent(
      "mission slot",
    );
    expect(screen.getByRole("region", { name: "Relationship observatory" })).toHaveTextContent(
      "galaxy slot",
    );
    expect(screen.getByRole("complementary", { name: "Evidence sheet" })).toHaveTextContent(
      "evidence slot",
    );
    expect(screen.getByRole("navigation", { name: "People filmstrip" })).toHaveTextContent(
      "people slot",
    );
    expect(screen.getByText("9 people · 12 relationships")).toBeVisible();
  });

  it("keeps a WebGL fallback status inside the stage", () => {
    render(
      <ObservatoryShell
        lesson={lesson}
        mission={<p>mission slot</p>}
        galaxy={<p>2D list slot</p>}
        evidence={<p>evidence slot</p>}
        characterIndex={<p>people slot</p>}
        status={<p role="status">3D is unavailable.</p>}
      />,
    );

    expect(screen.getByRole("region", { name: "Relationship observatory" })).toContainElement(
      screen.getByRole("status"),
    );
  });
});
