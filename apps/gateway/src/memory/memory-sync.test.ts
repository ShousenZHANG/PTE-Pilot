import type { BatchUpsertRequest } from "@pte-pilot/contracts";
import { describe, expect, it, vi } from "vitest";
import { openGatewayDatabase } from "../db/database.js";
import type { HermesClient } from "../hermes/hermes-client.js";
import { AttemptProjection } from "../projection/attempt-projection.js";
import { MemorySyncCoordinator } from "./memory-sync.js";

const request: BatchUpsertRequest = {
  batchId: "11111111-1111-4111-8111-111111111111",
  events: [
    {
      accuracy: 0.8,
      attemptId: "22222222-2222-4222-8222-222222222222",
      completedAt: "2026-07-15T00:00:00.000Z",
      durationMs: 12_500,
      errors: [{ actual: "postpond", expected: "postponed", type: "spelling" }],
      questionId: "131020",
      replayCount: 2,
    },
  ],
};

function makeClient(syncMemory: HermesClient["syncMemory"]): HermesClient {
  return {
    audit: async () => ({
      enabledTools: ["memory"],
      model: "pte-pilot",
      status: "ready",
      unexpectedTools: [],
    }),
    rank: async () => ({}),
    syncMemory,
  };
}

describe("MemorySyncCoordinator", () => {
  it("advances memory state only after bounded aggregate sync", async () => {
    const database = openGatewayDatabase(":memory:");
    const projection = new AttemptProjection(database);
    projection.upsertBatch(request);
    const syncMemory = vi.fn().mockResolvedValue(undefined);
    await new MemorySyncCoordinator(
      projection,
      makeClient(syncMemory),
      30_000,
    ).flush();
    expect(syncMemory).toHaveBeenCalledWith({
      meanAccuracy: 0.8,
      meanReplayCount: 2,
      projectionVersion: 1,
      topErrorTypes: [{ count: 1, type: "spelling" }],
      totalAttempts: 1,
      weakWords: [{ count: 1, word: "postponed" }],
    });
    expect(projection.getMemorySyncState()).toEqual({
      syncedVersion: 1,
      targetVersion: 1,
    });
    database.close();
  });

  it("does not affect projection acknowledgement on Hermes failure", async () => {
    const database = openGatewayDatabase(":memory:");
    const projection = new AttemptProjection(database);
    projection.upsertBatch(request);
    await new MemorySyncCoordinator(
      projection,
      makeClient(async () => {
        throw new Error("offline");
      }),
      30_000,
    ).flush();
    expect(projection.getProjectionVersion()).toBe(1);
    expect(projection.getMemorySyncState()).toEqual({
      syncedVersion: 0,
      targetVersion: 1,
    });
    database.close();
  });
});
