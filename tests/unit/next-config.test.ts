import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("Next.js development origins", () => {
  it("allows the documented loopback address used by local run instructions", () => {
    expect(nextConfig.allowedDevOrigins).toContain("127.0.0.1");
  });
});
