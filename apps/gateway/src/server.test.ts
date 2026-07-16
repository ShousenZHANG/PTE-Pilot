import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { openGatewayDatabase } from "./db/database.js";
import { createOfflineHermesClient } from "./hermes/hermes-client.js";
import { PairingService } from "./security/pairing-service.js";
import { createGatewayServer } from "./server.js";
import { makeTestConfig } from "./test/make-test-config.js";

const event = {
  accuracy: 0.75,
  attemptId: "22222222-2222-4222-8222-222222222222",
  completedAt: "2026-07-15T00:00:00.000Z",
  durationMs: 10_000,
  errors: [{ actual: "form", expected: "from", type: "spelling" }],
  questionId: "131020",
  replayCount: 1,
} as const;

let app: FastifyInstance | undefined;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await app?.close();
  app = undefined;
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Gateway HTTP contract", () => {
  it("exposes only the four allowed routes with bearer protection", async () => {
    const directory = mkdtempSync(join(tmpdir(), "pte-pilot-server-"));
    temporaryDirectories.push(directory);
    const dbPath = join(directory, "gateway.sqlite");
    const config = makeTestConfig({
      dbPath,
      hermesClient: createOfflineHermesClient(),
      hermesEnabled: false,
    });

    const setupDatabase = openGatewayDatabase(dbPath);
    const pairing = new PairingService({
      database: setupDatabase,
      now: config.now,
      pepper: config.tokenPepper,
      randomBytes: config.randomBytes,
      ttlMs: config.pairingCodeTtlMs,
    });
    const pairingCode = pairing.createCode();
    setupDatabase.close();

    app = await createGatewayServer(config);
    const health = await app.inject({ method: "GET", url: "/pte/v1/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({
      hermes: { status: "offline" },
      service: "pte-pilot",
      status: "degraded",
    });
    expect(
      (
        await app.inject({
          method: "POST",
          payload: { batchId: randomUUID(), events: [event] },
          url: "/pte/v1/events:batchUpsert",
        })
      ).statusCode,
    ).toBe(401);

    const paired = await app.inject({
      method: "POST",
      payload: { pairingCode },
      url: "/pte/v1/pair",
    });
    expect(paired.statusCode).toBe(200);
    const token = (paired.json() as { token: string }).token;
    const authorization = `Bearer ${token}`;
    const batch = {
      batchId: "11111111-1111-4111-8111-111111111111",
      events: [event],
    };
    const missingIdempotencyKey = await app.inject({
      headers: { authorization },
      method: "POST",
      payload: batch,
      url: "/pte/v1/events:batchUpsert",
    });
    const mismatchedIdempotencyKey = await app.inject({
      headers: {
        authorization,
        "idempotency-key": "33333333-3333-4333-8333-333333333333",
      },
      method: "POST",
      payload: batch,
      url: "/pte/v1/events:batchUpsert",
    });
    const longTimestampBatch = {
      batchId: "44444444-4444-4444-8444-444444444444",
      events: [
        {
          ...event,
          attemptId: "55555555-5555-4555-8555-555555555555",
          completedAt: `2026-07-15T00:00:00.${"0".repeat(45)}Z`,
        },
      ],
    };
    const longTimestamp = await app.inject({
      headers: {
        authorization,
        "idempotency-key": longTimestampBatch.batchId,
      },
      method: "POST",
      payload: longTimestampBatch,
      url: "/pte/v1/events:batchUpsert",
    });
    expect(longTimestamp.statusCode).toBe(400);
    expect(missingIdempotencyKey.statusCode).toBe(400);
    expect(mismatchedIdempotencyKey.statusCode).toBe(400);

    const first = await app.inject({
      headers: { authorization, "idempotency-key": batch.batchId },
      method: "POST",
      payload: batch,
      url: "/pte/v1/events:batchUpsert",
    });
    const duplicate = await app.inject({
      headers: { authorization, "idempotency-key": batch.batchId },
      method: "POST",
      payload: batch,
      url: "/pte/v1/events:batchUpsert",
    });
    expect(first.statusCode).toBe(200);
    expect(duplicate.json()).toEqual(first.json());

    const rank = await app.inject({
      headers: { authorization },
      method: "POST",
      payload: {
        candidateSetHash: `sha256:${"a".repeat(64)}`,
        candidates: [
          {
            attemptCount: 4,
            dueScore: 0.8,
            lastAttemptAt: "2026-07-15T00:00:00.000Z",
            marked: false,
            noveltyScore: 0.2,
            questionId: "131020",
            weaknessScore: 0.9,
          },
          {
            attemptCount: 0,
            dueScore: 0.1,
            lastAttemptAt: null,
            marked: true,
            noveltyScore: 1,
            questionId: "131021",
            weaknessScore: 0.1,
          },
        ],
        decisionId: "33333333-3333-4333-8333-333333333333",
        learnerStateVersion: 1,
      },
      url: "/pte/v1/rank",
    });
    expect(rank.statusCode).toBe(200);
    expect(rank.json()).toMatchObject({
      rankedQuestionIds: ["131021", "131020"],
    });

    expect(
      (await app.inject({ method: "GET", url: "/pte/v1/proxy" })).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          headers: { origin: "https://evil.example" },
          method: "GET",
          url: "/pte/v1/health",
        })
      ).statusCode,
    ).toBe(403);
  });

  it("accepts a maximum-cardinality event batch above the old body limit", async () => {
    const directory = mkdtempSync(join(tmpdir(), "pte-pilot-server-"));
    temporaryDirectories.push(directory);
    const dbPath = join(directory, "gateway.sqlite");
    const config = makeTestConfig({
      dbPath,
      hermesClient: createOfflineHermesClient(),
      hermesEnabled: false,
    });

    const setupDatabase = openGatewayDatabase(dbPath);
    const pairing = new PairingService({
      database: setupDatabase,
      now: config.now,
      pepper: config.tokenPepper,
      randomBytes: config.randomBytes,
      ttlMs: config.pairingCodeTtlMs,
    });
    const pairingCode = pairing.createCode();
    setupDatabase.close();

    app = await createGatewayServer(config);
    const paired = await app.inject({
      method: "POST",
      payload: { pairingCode },
      url: "/pte/v1/pair",
    });
    const token = (paired.json() as { token: string }).token;
    const error = {
      actual: "a".repeat(256),
      expected: "e".repeat(256),
      type: "substitution" as const,
    };
    const errors = Array.from({ length: 512 }, () => error);
    const batch = {
      batchId: "66666666-6666-4666-8666-666666666666",
      events: Array.from({ length: 100 }, (_, index) => ({
        accuracy: 1,
        attemptId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        completedAt: "2026-07-15T00:00:00.000Z",
        durationMs: Number.MAX_SAFE_INTEGER,
        errors,
        questionId: "q".repeat(128),
        replayCount: Number.MAX_SAFE_INTEGER,
      })),
    };
    expect(Buffer.byteLength(JSON.stringify(batch))).toBeGreaterThan(
      256 * 1024,
    );

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": batch.batchId,
      },
      method: "POST",
      payload: batch,
      url: "/pte/v1/events:batchUpsert",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      batchId: batch.batchId,
      ackedAttemptIds: batch.events.map(({ attemptId }) => attemptId),
    });
  }, 30_000);

  it("creates an injectable server without listening", async () => {
    app = await createGatewayServer(makeTestConfig());
    expect(app.server.address()).toBeNull();
  });
});
