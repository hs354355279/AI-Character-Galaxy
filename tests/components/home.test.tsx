import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("presents the orbital exhibition and both official lessons", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /every person has a universe of relationships/i,
      }),
    ).toBeVisible();
    for (const name of ["Observe the galaxy", "Follow the evidence", "Explain what changed"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(screen.getAllByRole("link", { name: /start exploration/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /view sources/i })).toHaveLength(2);
    expect(screen.getByText(/French Revolution: People and Factions/i)).toBeVisible();
    expect(screen.getByText(/Romeo and Juliet: Character Relationships/i)).toBeVisible();
  });

  it("preserves safeguards and excludes free exploration", () => {
    render(<HomePage />);
    expect(screen.getByText("Evidence first")).toBeVisible();
    expect(screen.getByText("Works offline")).toBeVisible();
    expect(screen.queryByText(/free exploration/i)).not.toBeInTheDocument();
  });
});
