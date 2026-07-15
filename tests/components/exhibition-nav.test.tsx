import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExhibitionNav } from "@/components/home/ExhibitionNav";

describe("exhibition navigation", () => {
  it("opens, locks scroll, closes with Escape, and returns focus", async () => {
    const user = userEvent.setup();
    render(<ExhibitionNav />);
    const trigger = screen.getByRole("button", { name: "Open exhibition index" });

    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Exhibition index" })).toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Exhibition index" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when a chapter link is selected", async () => {
    const user = userEvent.setup();
    render(<ExhibitionNav />);

    await user.click(screen.getByRole("button", { name: "Open exhibition index" }));
    await user.click(screen.getByRole("link", { name: /02.*Lessons/i }));

    expect(
      screen.queryByRole("dialog", { name: "Exhibition index" }),
    ).not.toBeInTheDocument();
  });
});
