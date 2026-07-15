import { createHash } from "node:crypto";

export function createSafetyIdentifier(sessionId: string): string {
  const digest = createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
  return `acg_${digest}`;
}
