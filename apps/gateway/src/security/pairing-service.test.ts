import { describe, expect, it } from "vitest";
import { openGatewayDatabase } from "../db/database.js";
import { PairingError, PairingService } from "./pairing-service.js";

function makeService(now: () => Date) {
  const database = openGatewayDatabase(":memory:");
  const service = new PairingService({
    database,
    now,
    pepper: "a-secure-test-pepper-with-at-least-32-characters",
    randomBytes: (size) => Buffer.alloc(size, 7),
    ttlMs: 300_000,
  });
  return { database, service };
}

describe("PairingService", () => {
  it("consumes one code and validates only the resulting token", () => {
    const { database, service } = makeService(
      () => new Date("2026-07-15T00:00:00.000Z"),
    );
    const code = service.createCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
    const token = service.pair(code);
    expect(service.isTokenActive(token)).toBe(true);
    expect(
      service.isTokenActive("wrong-token-with-a-long-enough-value________"),
    ).toBe(false);
    expect(() => service.pair(code)).toThrow(PairingError);
    database.close();
  });

  it("rejects an expired code", () => {
    let now = new Date("2026-07-15T00:00:00.000Z");
    const result = makeService(() => now);
    const code = result.service.createCode();
    now = new Date("2026-07-15T00:05:00.001Z");
    expect(() => result.service.pair(code)).toThrow("pairing code expired");
    result.database.close();
  });
});
