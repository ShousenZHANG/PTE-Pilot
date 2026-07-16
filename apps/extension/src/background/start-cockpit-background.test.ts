import { describe, expect, test, vi } from "vitest";
import {
  GATEWAY_TOKEN_STORAGE_KEY,
  type TrustedLocalStorage,
} from "./gateway-token-store";
import {
  type BackgroundBrowserApi,
  startCockpitBackground,
} from "./start-cockpit-background";
import { createPtePilotDb } from "./storage/db";
import { CockpitRepositories } from "./storage/repositories";

const health = {
  service: "pte-pilot",
  status: "degraded",
  profile: "pte-pilot",
  schemaVersion: 1,
  projectionInstanceId: "5f522c04-4d75-461f-8d12-e2c890b1f405",
  projectionVersion: 0,
  capabilities: ["events:batchUpsert", "rank", "pair"],
  hermes: {
    status: "offline",
    model: null,
    enabledTools: [],
    unexpectedTools: [],
  },
};

describe("startCockpitBackground", () => {
  test("locks token storage and health failure does not block local startup", async () => {
    const setAccessLevel = vi.fn(async () => undefined);
    const listenerSet = new Set<(...args: never[]) => unknown>();
    const local: TrustedLocalStorage = {
      get: async () => ({ [GATEWAY_TOKEN_STORAGE_KEY]: "t".repeat(43) }),
      set: async () => undefined,
      remove: async () => undefined,
      setAccessLevel,
    };
    const browserApi: BackgroundBrowserApi = {
      runtime: {
        id: "extension-id",
        onMessage: {
          addListener: (listener) => {
            listenerSet.add(listener as (...args: never[]) => unknown);
          },
          removeListener: (listener) => {
            listenerSet.delete(listener as (...args: never[]) => unknown);
          },
        },
      },
      storage: { local },
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("offline"));
    const dispose = await startCockpitBackground(browserApi, {
      databaseName: `pte-pilot-start-${crypto.randomUUID()}`,
      fetchImpl,
    });
    expect(setAccessLevel).toHaveBeenCalledWith({
      accessLevel: "TRUSTED_CONTEXTS",
    });
    expect(listenerSet.size).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8642/pte/v1/health",
      expect.any(Object),
    );
    dispose();
    expect(listenerSet.size).toBe(0);
  });

  test("new projection instance replays acknowledged history before sync", async () => {
    const databaseName = `pte-pilot-start-${crypto.randomUUID()}`;
    const seedDb = createPtePilotDb(databaseName);
    const seedRepository = new CockpitRepositories(seedDb, () =>
      Date.parse("2026-07-15T10:01:00.000Z"),
    );
    await seedRepository.saveSession({
      questionId: "q1",
      predictionEdition: "edition",
      position: 1,
      total: 1,
    });
    const attempt = {
      attemptId: "1b6be6a0-d76b-4734-ac8e-444d669ef9e5",
      questionId: "q1",
      accuracy: 1,
      durationMs: 1_000,
      replayCount: 0,
      errors: [],
      completedAt: "2026-07-15T10:00:00.000Z",
    };
    await seedRepository.commitAttempt("edition", attempt);
    const oldBatch = await seedRepository.leaseOutbox(
      "77f4da5f-20eb-413d-888b-59f18af86b0f",
      10,
      "2026-07-15T10:01:00.000Z",
    );
    if (!oldBatch) throw new Error("seed outbox missing");
    await seedRepository.ackOutbox({
      batchId: oldBatch.batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "f2817390-30a6-440d-b8d2-5907ef0a8ea5",
      projectionVersion: 1,
    });
    seedDb.close();

    const local: TrustedLocalStorage = {
      get: async () => ({ [GATEWAY_TOKEN_STORAGE_KEY]: "t".repeat(43) }),
      set: async () => undefined,
      remove: async () => undefined,
      setAccessLevel: async () => undefined,
    };
    const browserApi: BackgroundBrowserApi = {
      runtime: {
        id: "extension-id",
        onMessage: {
          addListener: () => undefined,
          removeListener: () => undefined,
        },
      },
      storage: { local },
    };
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      if (String(input).endsWith("/pte/v1/health")) {
        return new Response(JSON.stringify(health), { status: 200 });
      }
      const batch = JSON.parse(String(init?.body)) as {
        batchId: string;
        events: Array<{ attemptId: string }>;
      };
      return new Response(
        JSON.stringify({
          batchId: batch.batchId,
          ackedAttemptIds: batch.events.map((event) => event.attemptId),
          projectionInstanceId: health.projectionInstanceId,
          projectionVersion: 1,
        }),
        { status: 200 },
      );
    });
    const dispose = await startCockpitBackground(browserApi, {
      databaseName,
      fetchImpl,
    });
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:8642/pte/v1/health",
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:8642/pte/v1/events:batchUpsert",
    );
    expect(String(fetchImpl.mock.calls[1]?.[1]?.body)).toContain(
      attempt.attemptId,
    );
    dispose();
    const cleanupDb = createPtePilotDb(databaseName);
    await cleanupDb.delete();
  });
});
