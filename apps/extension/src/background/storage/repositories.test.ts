import type { AttemptEvent, IndexedQuestion } from "@pte-pilot/contracts";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createPtePilotDb, type PtePilotDb } from "./db";
import { CockpitRepositories } from "./repositories";

const attempt: AttemptEvent = {
  attemptId: "8ac6f879-5608-4f32-b0c7-eb5d0e9b8080",
  questionId: "131020",
  accuracy: 0.75,
  durationMs: 4_000,
  replayCount: 1,
  errors: [{ expected: "sentence", actual: "sentense", type: "spelling" }],
  completedAt: "2026-07-15T10:00:00.000Z",
};

describe("CockpitRepositories", () => {
  let db: PtePilotDb;
  let repository: CockpitRepositories;

  beforeEach(async () => {
    db = createPtePilotDb(`pte-pilot-test-${crypto.randomUUID()}`);
    repository = new CockpitRepositories(db, () =>
      Date.parse("2026-07-15T10:01:00.000Z"),
    );
    await repository.saveSession(
      {
        questionId: attempt.questionId,
        predictionEdition: "yc-2026-w29",
        position: 12,
        total: 192,
      },
      "2026-07-15T10:00:00.000Z",
    );
  });

  afterEach(async () => {
    await db.delete();
  });

  test("commits attempt, statistics, progress, and outbox atomically", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect(await db.wordStats.count()).toBe(1);
    expect(await db.questionProgress.count()).toBe(1);
    expect(await db.outbox.count()).toBe(1);
  });

  test("is idempotent for the same attemptId", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect((await db.wordStats.toArray())[0]?.occurrences).toBe(1);
    expect((await db.meta.get("learner-state-version"))?.numberValue).toBe(1);
  });

  test("rolls every fact table back if outbox insert fails", async () => {
    db.outbox.hook("creating", () => {
      throw new Error("forced outbox failure");
    });
    await expect(
      repository.commitAttempt("yc-2026-w29", attempt),
    ).rejects.toThrow("forced outbox failure");
    expect(await db.attempts.count()).toBe(0);
    expect(await db.wordStats.count()).toBe(0);
    expect(await db.questionProgress.count()).toBe(0);
    expect(await db.meta.count()).toBe(0);
  });

  test("refuses an attempt for a session in another edition", async () => {
    await expect(
      repository.commitAttempt("yc-2026-w30", attempt),
    ).rejects.toThrow("attempt does not match verified current session");
    expect(await db.attempts.count()).toBe(0);
  });

  test("leases and acknowledges only matching outbox rows", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const batchId = "9dc99e6e-7f31-4869-ad78-d824fa0e7840";
    const batch = await repository.leaseOutbox(
      batchId,
      10,
      "2026-07-15T10:01:00.000Z",
    );
    expect(batch?.events).toEqual([attempt]);
    await repository.ackOutbox({
      batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "e3850a41-0566-43f1-8f73-50a9ff028ad0",
      projectionVersion: 1,
    });
    expect(await db.outbox.count()).toBe(0);
  });

  test("keeps unacknowledged rows and applies retry backoff on partial ACK", async () => {
    const secondAttempt: AttemptEvent = {
      ...attempt,
      attemptId: "787d7eed-d370-4e17-b6da-f0ac9d72f31a",
      completedAt: "2026-07-15T10:00:01.000Z",
    };
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.commitAttempt("yc-2026-w29", secondAttempt);
    const batchId = "46db01ae-f4f4-4b16-aef6-b0b05a7cb2df";
    await repository.leaseOutbox(batchId, 10, "2026-07-15T10:01:00.000Z");
    await repository.ackOutbox(
      {
        batchId,
        ackedAttemptIds: [attempt.attemptId],
        projectionInstanceId: "db6a1603-ed9b-475f-aa6f-4758e4fc4398",
        projectionVersion: 1,
      },
      "2026-07-15T10:01:00.000Z",
    );
    expect(await repository.countOutbox()).toBe(1);
    expect((await db.outbox.get(secondAttempt.attemptId))?.status).toBe(
      "pending",
    );
    expect((await db.outbox.get(secondAttempt.attemptId))?.retryCount).toBe(1);
  });

  test("reclaims an expired inflight lease after a Service Worker crash", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.leaseOutbox(
      "28dbda55-3132-44f0-8159-d1c641ae5dce",
      10,
      "2026-07-15T10:01:00.000Z",
    );
    const reclaimed = await repository.leaseOutbox(
      "b49e848e-fe3b-4bcb-81d3-0f4a592b9225",
      10,
      "2026-07-15T10:01:31.000Z",
    );
    expect(reclaimed?.events).toEqual([attempt]);
    expect((await db.outbox.get(attempt.attemptId))?.retryCount).toBe(1);
  });

  test("increments learnerStateVersion for attempts and actual mark changes", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const afterAttempt = await repository.getRankCandidates("yc-2026-w29", [
      attempt.questionId,
    ]);
    await repository.setMarked("yc-2026-w29", attempt.questionId, true);
    const afterMark = await repository.getRankCandidates("yc-2026-w29", [
      attempt.questionId,
    ]);
    await repository.setMarked("yc-2026-w29", attempt.questionId, true);
    expect(afterMark.learnerStateVersion).toBe(
      afterAttempt.learnerStateVersion + 1,
    );
    expect(
      (await repository.getRankCandidates("yc-2026-w29", [attempt.questionId]))
        .learnerStateVersion,
    ).toBe(afterMark.learnerStateVersion);
  });

  test("isolates drafts and progress through edition-question compound keys", async () => {
    const base = {
      questionId: "131020",
      text: "one",
      revision: 1,
      updatedAt: "2026-07-15T10:00:00.000Z",
    };
    await repository.saveDraft({ ...base, predictionEdition: "yc-2026-w29" });
    await repository.saveDraft({
      ...base,
      predictionEdition: "yc-2026-w30",
      text: "two",
    });
    expect((await repository.loadDraft("yc-2026-w29", "131020"))?.text).toBe(
      "one",
    );
    expect((await repository.loadDraft("yc-2026-w30", "131020"))?.text).toBe(
      "two",
    );
  });

  test("requeues immutable attempts when projection instance changes", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const firstBatch = await repository.leaseOutbox(
      "66c3fdbe-432a-4a97-8d26-4c6c6f21d451",
      10,
      "2026-07-15T10:01:00.000Z",
    );
    if (!firstBatch) throw new Error("missing first batch");
    await repository.ackOutbox({
      batchId: firstBatch.batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "b27112b6-2b19-4868-96a3-9a0b0c4f5030",
      projectionVersion: 1,
    });
    await repository.requeueAllAttemptsForProjection(
      "1730a136-3517-4a8c-b31a-34594d9cab49",
      "2026-07-15T10:02:00.000Z",
    );
    expect(
      (
        await repository.leaseOutbox(
          "25977310-a3e2-4d21-b1a8-b073de47b929",
          10,
          "2026-07-15T10:02:00.000Z",
        )
      )?.events,
    ).toEqual([attempt]);
  });

  test("atomically rebuilds historical outbox when an ACK reveals a projection reset", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const originalBatch = await repository.leaseOutbox(
      "2c47501c-d630-4aa0-b7c9-960302a412d9",
      10,
      "2026-07-15T10:01:00.000Z",
    );
    if (!originalBatch) throw new Error("missing original batch");
    await repository.ackOutbox({
      batchId: originalBatch.batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "7db37d2a-3530-4be2-90de-8669023a1c01",
      projectionVersion: 1,
    });

    const currentAttempt: AttemptEvent = {
      ...attempt,
      attemptId: "d9299d4d-eb12-4087-aa37-0a281623cf91",
      completedAt: "2026-07-15T10:01:01.000Z",
    };
    await repository.commitAttempt("yc-2026-w29", currentAttempt);
    const resetBatch = await repository.leaseOutbox(
      "862693e9-da0c-41e2-96c8-64827ff4b77a",
      10,
      "2026-07-15T10:02:00.000Z",
    );
    if (!resetBatch) throw new Error("missing reset batch");
    await repository.ackOutbox(
      {
        batchId: resetBatch.batchId,
        ackedAttemptIds: [currentAttempt.attemptId],
        projectionInstanceId: "ca961ae5-7dca-4bb5-bd15-c5612beec495",
        projectionVersion: 1,
      },
      "2026-07-15T10:02:00.000Z",
    );

    expect(await db.outbox.toArray()).toEqual([
      {
        attemptId: attempt.attemptId,
        batchId: null,
        status: "pending",
        retryCount: 0,
        nextAttemptAt: "2026-07-15T10:02:00.000Z",
        leaseExpiresAt: null,
      },
    ]);
    expect((await db.meta.get("projection-instance-id"))?.stringValue).toBe(
      "ca961ae5-7dca-4bb5-bd15-c5612beec495",
    );
    expect((await db.meta.get("projection-version"))?.numberValue).toBe(1);
  });

  test("complete index replaces stale edition rows and validates 1..N", async () => {
    const discoveredAt = "2026-07-15T10:00:00.000Z";
    const questions: IndexedQuestion[] = [
      {
        predictionEdition: "yc-2026-w29",
        questionId: "q1",
        sitePosition: 1,
        siteTotal: 2,
        tags: [],
        discoveredAt,
        schemaVersion: 1,
      },
      {
        predictionEdition: "yc-2026-w29",
        questionId: "q2",
        sitePosition: 2,
        siteTotal: 2,
        tags: [],
        discoveredAt,
        schemaVersion: 1,
      },
    ];
    await repository.saveIndexSnapshot(
      {
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["q1"],
        siteTotal: 2,
        completeness: "partial",
        checkpointPosition: 1,
        schemaVersion: 1,
      },
      [questions[0] as IndexedQuestion],
    );
    await repository.saveIndexSnapshot(
      {
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["q1", "q2"],
        siteTotal: 2,
        completeness: "complete",
        schemaVersion: 1,
      },
      questions,
    );
    expect(
      (await repository.loadIndexSnapshot("yc-2026-w29")).questions.map(
        (question) => question.questionId,
      ),
    ).toEqual(["q1", "q2"]);
  });

  test("partial index atomically replaces a conflicting question at the same position", async () => {
    const discoveredAt = "2026-07-15T10:00:00.000Z";
    const question = (questionId: string, sitePosition: number) => ({
      predictionEdition: "yc-2026-w29",
      questionId,
      sitePosition,
      siteTotal: 3,
      tags: [],
      discoveredAt,
      schemaVersion: 1,
    });
    await repository.saveIndexSnapshot(
      {
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["q1", "q-old"],
        siteTotal: 3,
        completeness: "partial",
        checkpointPosition: 2,
        schemaVersion: 1,
      },
      [question("q1", 1), question("q-old", 2)],
    );
    await repository.saveIndexSnapshot(
      {
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["q1", "q-new"],
        siteTotal: 3,
        completeness: "partial",
        checkpointPosition: 2,
        schemaVersion: 1,
      },
      [question("q1", 1), question("q-new", 2)],
    );

    const loaded = await repository.loadIndexSnapshot("yc-2026-w29");
    expect(loaded.snapshot?.orderedQuestionIds).toEqual(["q1", "q-new"]);
    expect(loaded.questions.map((value) => value.questionId)).toEqual([
      "q1",
      "q-new",
    ]);
  });
});
