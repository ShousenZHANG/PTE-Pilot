import { createHash } from "node:crypto";
import {
  type AttemptEvent,
  type BatchUpsertRequest,
  type BatchUpsertResponse,
  BatchUpsertResponseSchema,
} from "@pte-pilot/contracts";
import type Database from "better-sqlite3";
import type { CompactLearningProfile } from "../hermes/hermes-client.js";

type ProjectionIdentity = {
  projectionInstanceId: string;
  projectionVersion: number;
};

type MemorySyncState = {
  syncedVersion: number;
  targetVersion: number;
};

export class ProjectionConflictError extends Error {}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError("unsupported value in canonical JSON");
    }
    return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function hash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalAttempt(event: AttemptEvent): AttemptEvent {
  return {
    accuracy: event.accuracy,
    attemptId: event.attemptId,
    completedAt: event.completedAt,
    durationMs: event.durationMs,
    errors: event.errors.map((error) => ({
      actual: error.actual,
      expected: error.expected,
      type: error.type,
    })),
    questionId: event.questionId,
    replayCount: event.replayCount,
  };
}

export class AttemptProjection {
  constructor(private readonly database: Database.Database) {}

  upsertBatch(request: BatchUpsertRequest): BatchUpsertResponse {
    return this.database
      .transaction(() => {
        const attemptIds = request.events.map(({ attemptId }) => attemptId);
        if (new Set(attemptIds).size !== attemptIds.length) {
          throw new ProjectionConflictError(
            "batch contains duplicate attempt ids",
          );
        }

        const requestHash = hash({
          events: request.events.map(canonicalAttempt),
        });
        const existingReceipt = this.database
          .prepare(
            "SELECT request_hash AS requestHash, response_json AS responseJson FROM batch_receipts WHERE batch_id = ?",
          )
          .get(request.batchId) as
          | { requestHash: string; responseJson: string }
          | undefined;
        if (existingReceipt) {
          if (existingReceipt.requestHash !== requestHash) {
            throw new ProjectionConflictError("batch id collision");
          }
          return BatchUpsertResponseSchema.parse(
            JSON.parse(existingReceipt.responseJson),
          );
        }

        const findAttempt = this.database.prepare(
          "SELECT payload_hash AS payloadHash FROM attempt_events WHERE attempt_id = ?",
        );
        const insertAttempt = this.database.prepare(`
        INSERT INTO attempt_events(
          attempt_id, payload_hash, payload_json, question_id,
          accuracy, duration_ms, replay_count, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
        const insertError = this.database.prepare(`
        INSERT INTO attempt_errors(
          attempt_id, ordinal, expected, actual, error_type
        ) VALUES (?, ?, ?, ?, ?)
      `);

        let insertedCount = 0;
        for (const event of request.events) {
          const canonical = canonicalAttempt(event);
          const payloadJson = canonicalJson(canonical);
          const payloadHash = hash(canonical);
          const existing = findAttempt.get(event.attemptId) as
            | { payloadHash: string }
            | undefined;
          if (existing) {
            if (existing.payloadHash !== payloadHash) {
              throw new ProjectionConflictError(
                `attempt id collision: ${event.attemptId}`,
              );
            }
            continue;
          }

          insertAttempt.run(
            event.attemptId,
            payloadHash,
            payloadJson,
            event.questionId,
            event.accuracy,
            event.durationMs,
            event.replayCount,
            event.completedAt,
          );
          event.errors.forEach((error, ordinal) => {
            insertError.run(
              event.attemptId,
              ordinal,
              error.expected,
              error.actual,
              error.type,
            );
          });
          insertedCount += 1;
        }

        if (insertedCount > 0) {
          this.database
            .prepare(
              "UPDATE projection_meta SET projection_version = projection_version + ? WHERE singleton = 1",
            )
            .run(insertedCount);
          this.database
            .prepare(
              `UPDATE memory_sync_state
             SET target_version = (
               SELECT projection_version FROM projection_meta WHERE singleton = 1
             )
             WHERE singleton = 1`,
            )
            .run();
        }

        const identity = this.getProjectionIdentity();
        const response = BatchUpsertResponseSchema.parse({
          ackedAttemptIds: attemptIds,
          batchId: request.batchId,
          projectionInstanceId: identity.projectionInstanceId,
          projectionVersion: identity.projectionVersion,
        });
        this.database
          .prepare(
            `INSERT INTO batch_receipts(
            batch_id, request_hash, response_json, created_at
          ) VALUES (?, ?, ?, ?)`,
          )
          .run(
            request.batchId,
            requestHash,
            JSON.stringify(response),
            new Date().toISOString(),
          );
        return response;
      })
      .immediate();
  }

  getProjectionIdentity(): ProjectionIdentity {
    return this.database
      .prepare(
        `SELECT
          projection_instance_id AS projectionInstanceId,
          projection_version AS projectionVersion
         FROM projection_meta WHERE singleton = 1`,
      )
      .get() as ProjectionIdentity;
  }

  getProjectionVersion(): number {
    return this.getProjectionIdentity().projectionVersion;
  }

  getMemorySyncState(): MemorySyncState {
    return this.database
      .prepare(
        `SELECT target_version AS targetVersion, synced_version AS syncedVersion
         FROM memory_sync_state WHERE singleton = 1`,
      )
      .get() as MemorySyncState;
  }

  markMemorySynced(version: number): void {
    const state = this.getMemorySyncState();
    if (version > state.targetVersion) {
      throw new Error("cannot sync a future projection version");
    }
    this.database
      .prepare(
        `UPDATE memory_sync_state
         SET synced_version = MAX(synced_version, ?)
         WHERE singleton = 1`,
      )
      .run(version);
  }

  getCompactLearningProfile(): CompactLearningProfile {
    const aggregate = this.database
      .prepare(
        `SELECT
          COUNT(*) AS totalAttempts,
          COALESCE(AVG(accuracy), 0) AS meanAccuracy,
          COALESCE(AVG(replay_count), 0) AS meanReplayCount
         FROM attempt_events`,
      )
      .get() as {
      meanAccuracy: number;
      meanReplayCount: number;
      totalAttempts: number;
    };
    const topErrorTypes = this.database
      .prepare(
        `SELECT error_type AS type, COUNT(*) AS count
         FROM attempt_errors
         GROUP BY error_type
         ORDER BY count DESC, type ASC
         LIMIT 20`,
      )
      .all() as Array<{ count: number; type: string }>;
    const weakWords = this.database
      .prepare(
        `SELECT LOWER(expected) AS word, COUNT(*) AS count
         FROM attempt_errors
         WHERE LENGTH(TRIM(expected)) > 0
         GROUP BY LOWER(expected)
         ORDER BY count DESC, word ASC
         LIMIT 50`,
      )
      .all() as Array<{ count: number; word: string }>;

    return {
      meanAccuracy: aggregate.meanAccuracy,
      meanReplayCount: aggregate.meanReplayCount,
      projectionVersion: this.getProjectionVersion(),
      topErrorTypes,
      totalAttempts: aggregate.totalAttempts,
      weakWords,
    };
  }
}
