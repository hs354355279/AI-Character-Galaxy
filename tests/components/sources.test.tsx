import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceList } from "@/components/learning/SourceList";
import { getLessonPack } from "@/lib/lessons/repository";

describe("SourceList", () => {
  it("exposes source URLs, licenses, dates, and attribution", () => {
    const lesson = getLessonPack("romeo-and-juliet")!;
    render(<SourceList lesson={lesson} />);
    expect(screen.getByRole("link", { name: /Romeo and Juliet, eBook 1513/i })).toHaveAttribute(
      "href",
      "https://www.gutenberg.org/ebooks/1513",
    );
    expect(screen.getByText(/Public domain in the United States/i)).toBeVisible();
    expect(screen.getAllByText(/Retrieved July 14, 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/application code license does not cover third-party content/i)).toBeVisible();
  });
});
