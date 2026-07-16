import { describe, expect, test, vi } from "vitest";
import { GatewayHttpClient } from "./gateway-http-client";
import type { GatewayTokenStore } from "./gateway-token-store";

const health = {
  service: "pte-pilot" as const,
  status: "degraded" as const,
  profile: "pte-pilot" as const,
  schemaVersion: 1 as const,
  projectionInstanceId: "5f522c04-4d75-461f-8d12-e2c890b1f405",
  projectionVersion: 0,
  capabilities: ["events:batchUpsert", "rank", "pair"] as const,
  hermes: {
    status: "offline" as const,
    model: null,
    enabledTools: [],
    unexpectedTools: [],
  },
};

describe("GatewayHttpClient", () => {
  test("pairs locally, stores token, and returns health without exposing token", async () => {
    let stored: string | null = null;
    const tokens: GatewayTokenStore = {
      read: async () => stored,
      write: async (token) => {
        stored = token;
      },
      clear: async () => {
        stored = null;
      },
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "x".repeat(43) }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(health), { status: 200 }),
      );
    const client = new GatewayHttpClient(tokens, fetchImpl, 1_000);
    const result = await client.pair("ABCDEFGH2345");
    expect(result).toEqual(health);
    expect(stored).toBe("x".repeat(43));
    expect(JSON.stringify(result)).not.toContain("x".repeat(43));
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:8642/pte/v1/pair",
    );
  });

  test("sends bearer and idempotency key only from background client", async () => {
    const tokens: GatewayTokenStore = {
      read: async () => "t".repeat(43),
      write: async () => undefined,
      clear: async () => undefined,
    };
    const response = {
      batchId: "1800c146-acf8-47be-9899-6895eca8dc8e",
      ackedAttemptIds: ["42bb8b2d-d7b3-42f9-b86f-7bd218b53cf5"],
      projectionInstanceId: "b2ef18d8-7a53-446f-9fd6-bd03e6e4a00c",
      projectionVersion: 1,
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 }),
      );
    const client = new GatewayHttpClient(tokens, fetchImpl, 1_000);
    await client.upsertEvents({
      batchId: response.batchId,
      events: [
        {
          attemptId: response.ackedAttemptIds[0] as string,
          questionId: "q1",
          accuracy: 1,
          durationMs: 1_000,
          replayCount: 0,
          errors: [],
          completedAt: "2026-07-15T10:00:00.000Z",
        },
      ],
    });
    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe(`Bearer ${"t".repeat(43)}`);
    expect(headers.get("Idempotency-Key")).toBe(response.batchId);
  });
});
