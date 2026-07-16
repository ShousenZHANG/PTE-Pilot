import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BatchUpsertRequest } from "@pte-pilot/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { openGatewayDatabase } from "../db/database.js";
import {
  AttemptProjection,
  ProjectionConflictError,
} from "./attempt-projection.js";

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

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("AttemptProjection", () => {
  it("deduplicates retries and keeps one stable receipt", () => {
    const database = openGatewayDatabase(":memory:");
    const projection = new AttemptProjection(database);
    const first = projection.upsertBatch(request);
    for (let delivery = 0; delivery < 100; delivery += 1) {
      expect(projection.upsertBatch(request)).toEqual(first);
    }
    expect(
      database.prepare("SELECT COUNT(*) AS count FROM attempt_events").get(),
    ).toEqual({ count: 1 });
    expect(first).toMatchObject({ projectionVersion: 1 });
    database.close();
  });

  it("rejects immutable attempt and batch collisions", () => {
    const database = openGatewayDatabase(":memory:");
    const projection = new AttemptProjection(database);
    const [event] = request.events;
    if (!event) throw new Error("missing test event");
    projection.upsertBatch(request);
    expect(() =>
      projection.upsertBatch({
        ...request,
        events: [{ ...event, accuracy: 0.4 }],
      }),
    ).toThrow(ProjectionConflictError);
    expect(() =>
      projection.upsertBatch({
        batchId: "33333333-3333-4333-8333-333333333333",
        events: [{ ...event, accuracy: 0.4 }],
      }),
    ).toThrow(ProjectionConflictError);
    expect(projection.getProjectionVersion()).toBe(1);
    database.close();
  });

  it("persists projection identity and emits only aggregate memory", () => {
    const directory = mkdtempSync(join(tmpdir(), "pte-pilot-gateway-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "projection.sqlite");
    const firstDatabase = openGatewayDatabase(path);
    const first = new AttemptProjection(firstDatabase);
    first.upsertBatch(request);
    const identity = first.getProjectionIdentity();
    expect(first.getCompactLearningProfile()).toEqual({
      meanAccuracy: 0.8,
      meanReplayCount: 2,
      projectionVersion: 1,
      topErrorTypes: [{ count: 1, type: "spelling" }],
      totalAttempts: 1,
      weakWords: [{ count: 1, word: "postponed" }],
    });
    firstDatabase.close();

    const reopenedDatabase = openGatewayDatabase(path);
    expect(
      new AttemptProjection(reopenedDatabase).getProjectionIdentity(),
    ).toEqual(identity);
    reopenedDatabase.close();
  });
});
