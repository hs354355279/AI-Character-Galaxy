import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiInsight } from "@/components/learning/AiInsight";

afterEach(() => vi.unstubAllGlobals());

describe("AiInsight", () => {
  it("requests a validated explanation and identifies prepared fallback content", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            source: "prepared",
            data: {
              explanation: "This reviewed relationship connects political ideas with revolutionary action.",
              sourceRefIds: ["fr-wikipedia"],
              followUpPrompt: "How did an idea become a political action?",
            },
          }),
          { status: 200 },
        ),
      ),
    );

    render(
      <AiInsight
        lessonId="french-revolution"
        relationshipId="rousseau-influences-robespierre"
        sessionId="french-revolution:2026-07-14"
      />,
    );
    await user.click(screen.getByRole("button", { name: /explain with gpt-5.6/i }));

    expect(await screen.findByText(/connects political ideas/i)).toBeVisible();
    expect(screen.getByText(/reviewed fallback/i)).toBeVisible();
    expect(screen.getByText(/fr-wikipedia/i)).toBeVisible();
  });

  it("keeps required lesson evidence usable when the request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <AiInsight
        lessonId="french-revolution"
        characterId="robespierre"
        sessionId="french-revolution:2026-07-14"
      />,
    );

    await user.click(screen.getByRole("button", { name: /explain with gpt-5.6/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/could not add an ai explanation/i);
  });
});
