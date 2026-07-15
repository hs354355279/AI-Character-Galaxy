import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

function setMedia(reducedMotion: boolean, coarsePointer: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches:
        (query === "(prefers-reduced-motion: reduce)" && reducedMotion) ||
        (query === "(pointer: coarse)" && coarsePointer),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

describe("SmoothScrollProvider", () => {
  afterEach(() => {
    delete document.documentElement.dataset.lenisActive;
    setMedia(true, false);
  });

  it("marks Lenis as the sole scroll owner only on capable desktop", async () => {
    setMedia(false, false);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });

    const view = render(<SmoothScrollProvider />);

    await waitFor(() => {
      expect(document.documentElement.dataset.lenisActive).toBe("true");
    });

    view.unmount();
    expect(document.documentElement.dataset.lenisActive).toBeUndefined();
  });

  it("leaves reduced-motion scrolling native", () => {
    setMedia(true, false);
    render(<SmoothScrollProvider />);

    expect(document.documentElement.dataset.lenisActive).toBeUndefined();
  });
});
