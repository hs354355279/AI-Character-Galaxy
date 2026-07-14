import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("presents both official lessons and the product purpose", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /explore why relationships mattered/i }),
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: /start exploration/i })).toHaveLength(2);
    expect(screen.getByText(/French Revolution: People and Factions/i)).toBeVisible();
    expect(screen.getByText(/Romeo and Juliet: Character Relationships/i)).toBeVisible();
  });

  it("keeps unverified free exploration out of the official MVP", () => {
    render(<HomePage />);
    expect(screen.queryByText(/free exploration/i)).not.toBeInTheDocument();
  });
});
