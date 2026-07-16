import type { AttemptEvent } from "@pte-pilot/contracts";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { PtePilotGatewayClient } from "./gateway-http-client";
import {
  OutboxSynchronizer,
  type OutboxWakeScheduler,
} from "./outbox-synchronizer";
import { createPtePilotDb, type PtePilotDb } from "./storage/db";
import { CockpitRepositories } from "./storage/repositories";

const attempt: AttemptEvent = {
  attemptId: "c5986a45-3d33-4692-aee4-701995cbb22c",
  questionId: "q1",
  accuracy: 1,
  durationMs: 1_000,
  replayCount: 0,
  errors: [],
  completedAt: "2026-07-15T10:00:00.000Z",
};

describe("OutboxSynchronizer", () => {
  let db: PtePilotDb;
  let repository: CockpitRepositories;

  beforeEach(async () => {
    db = createPtePilotDb(`pte-pilot-sync-${crypto.randomUUID()}`);
    repository = new CockpitRepositories(db, () =>
      Date.parse("2026-07-15T10:01:00.000Z"),
    );
    await repository.saveSession({
      questionId: "q1",
      predictionEdition: "edition",
      position: 1,
      total: 1,
    });
    await repository.commitAttempt("edition", attempt);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("deletes only a matching batch acknowledgement", async () => {
    const gateway: PtePilotGatewayClient = {
      pair: async () => {
        throw new Error("unused");
      },
      health: async () => {
        throw new Error("unused");
      },
      rank: async () => {
        throw new Error("unused");
      },
      upsertEvents: async (batch) => ({
        batchId: batch.batchId,
        ackedAttemptIds: [attempt.attemptId],
        projectionInstanceId: "62a31b48-4aca-43aa-aaf8-f5233fc69ca7",
        projectionVersion: 1,
      }),
    };
    const result = await new OutboxSynchronizer(repository, gateway, () =>
      Date.parse("2026-07-15T10:01:00.000Z"),
    ).drain();
    expect(result).toEqual({ acknowledged: 1, pending: 0 });
  });

  test("releases row when Gateway echoes another batch", async () => {
    const gateway: PtePilotGatewayClient = {
      pair: async () => {
        throw new Error("unused");
      },
      health: async () => {
        throw new Error("unused");
      },
      rank: async () => {
        throw new Error("unused");
      },
      upsertEvents: async () => ({
        batchId: "efc74e86-7709-4f56-99a4-b3e9e56e0bf8",
        ackedAttemptIds: [attempt.attemptId],
        projectionInstanceId: "62a31b48-4aca-43aa-aaf8-f5233fc69ca7",
        projectionVersion: 1,
      }),
    };
    await expect(
      new OutboxSynchronizer(repository, gateway).drain(),
    ).rejects.toThrow("does not match leased batch");
    expect(await repository.countOutbox()).toBe(1);
    expect((await db.outbox.get(attempt.attemptId))?.status).toBe("pending");
  });

  test("wakes itself when a released row reaches its retry time", async () => {
    let now = Date.parse("2026-07-15T10:01:00.000Z");
    let wake:
      | { callback: () => void; delayMs: number; handle: symbol }
      | undefined;
    const wakeScheduler: OutboxWakeScheduler = {
      schedule: (callback, delayMs) => {
        const handle = Symbol("wake");
        wake = { callback, delayMs, handle };
        return handle;
      },
      cancel: (handle) => {
        if (wake?.handle === handle) wake = undefined;
      },
    };
    let requests = 0;
    const gateway: PtePilotGatewayClient = {
      pair: async () => {
        throw new Error("unused");
      },
      health: async () => {
        throw new Error("unused");
      },
      rank: async () => {
        throw new Error("unused");
      },
      upsertEvents: async (batch) => {
        requests += 1;
        if (requests === 1) throw new Error("offline");
        return {
          batchId: batch.batchId,
          ackedAttemptIds: batch.events.map((event) => event.attemptId),
          projectionInstanceId: "62a31b48-4aca-43aa-aaf8-f5233fc69ca7",
          projectionVersion: 1,
        };
      },
    };
    const synchronizer = new OutboxSynchronizer(
      repository,
      gateway,
      () => now,
      10,
      wakeScheduler,
    );

    await expect(synchronizer.drain()).rejects.toThrow("offline");
    expect(wake?.delayMs).toBe(2_000);
    now += 1_999;
    expect(requests).toBe(1);
    now += 1;
    wake?.callback();
    await synchronizer.drain();

    expect(requests).toBe(2);
    expect(await repository.countOutbox()).toBe(0);
  });

  test("continues draining due backlog after the per-drain batch cap", async () => {
    let wake: { callback: () => void; delayMs: number } | undefined;
    const wakeScheduler: OutboxWakeScheduler = {
      schedule: (callback, delayMs) => {
        wake = { callback, delayMs };
        return Symbol("wake");
      },
      cancel: () => {
        wake = undefined;
      },
    };
    const extraAttempts = Array.from({ length: 100 }, (_, index) => ({
      ...attempt,
      attemptId: crypto.randomUUID(),
      questionId: `q-${index + 2}`,
    }));
    await db.attempts.bulkPut(extraAttempts);
    await db.outbox.bulkPut(
      extraAttempts.map((event) => ({
        attemptId: event.attemptId,
        batchId: null,
        status: "pending" as const,
        retryCount: 0,
        nextAttemptAt: event.completedAt,
        leaseExpiresAt: null,
      })),
    );
    let requests = 0;
    const gateway: PtePilotGatewayClient = {
      pair: async () => {
        throw new Error("unused");
      },
      health: async () => {
        throw new Error("unused");
      },
      rank: async () => {
        throw new Error("unused");
      },
      upsertEvents: async (batch) => {
        requests += 1;
        return {
          batchId: batch.batchId,
          ackedAttemptIds: batch.events.map((event) => event.attemptId),
          projectionInstanceId: "62a31b48-4aca-43aa-aaf8-f5233fc69ca7",
          projectionVersion: requests,
        };
      },
    };
    const synchronizer = new OutboxSynchronizer(
      repository,
      gateway,
      Date.now,
      1,
      wakeScheduler,
    );

    const firstDrain = await synchronizer.drain();
    expect(wake?.delayMs).toBe(0);
    wake?.callback();
    const continuation = await synchronizer.drain();

    expect(firstDrain).toEqual({ acknowledged: 100, pending: 1 });
    expect(continuation).toEqual({ acknowledged: 1, pending: 0 });
    expect(requests).toBe(2);
  });
});
