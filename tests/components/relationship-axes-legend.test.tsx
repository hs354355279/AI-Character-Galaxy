import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelationshipAxesLegend } from "@/components/galaxy/RelationshipAxesLegend";

describe("RelationshipAxesLegend", () => {
  it("explains the target-centered semantic coordinates", () => {
    render(<RelationshipAxesLegend targetName="Romeo" />);

    expect(screen.getByRole("note", { name: "Relationship space axes" })).toHaveTextContent(
      "Romeo is the origin",
    );
    expect(screen.getByText(/affinity \/ conflict/i)).toBeVisible();
    expect(screen.getByText(/personal \/ public/i)).toBeVisible();
    expect(screen.getByText(/incoming \/ outgoing/i)).toBeVisible();
  });
});
