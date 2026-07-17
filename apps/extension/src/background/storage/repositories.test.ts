import type { AttemptEvent, IndexedQuestion } from "@pte-pilot/contracts";
import Dexie from "dexie";
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

  test("removes legacy outbox from the current database schema", () => {
    expect(db.tables.map((table) => table.name)).not.toContain("outbox");
  });

  test("migration deletes legacy sync queue and projection metadata", async () => {
    const databaseName = `pte-pilot-legacy-${crypto.randomUUID()}`;
    const legacy = new Dexie(databaseName);
    legacy.version(1).stores({
      drafts:
        "&[predictionEdition+questionId], predictionEdition, questionId, updatedAt",
      attempts: "&attemptId, questionId, completedAt",
      outbox: "&attemptId, status, nextAttemptAt, batchId, leaseExpiresAt",
      wordStats: "&key, expected, lastSeenAt",
      questionProgress:
        "&[predictionEdition+questionId], predictionEdition, questionId, dueAt, marked",
      questions:
        "&[predictionEdition+questionId], predictionEdition, questionId, sitePosition",
      snapshots: "&predictionEdition",
      sessions: "&id, predictionEdition, questionId, updatedAt",
      settings: "&id, updatedAt",
      meta: "&id",
    });
    await legacy.table("outbox").put({
      attemptId: "legacy-attempt",
      batchId: null,
      status: "pending",
      retryCount: 0,
      nextAttemptAt: "2026-07-15T10:00:00.000Z",
      leaseExpiresAt: null,
    });
    await legacy.table("meta").bulkPut([
      { id: "learner-state-version", numberValue: 7 },
      { id: "projection-instance-id", stringValue: "legacy-projection" },
      { id: "projection-version", numberValue: 3 },
    ]);
    legacy.close();

    const migrated = createPtePilotDb(databaseName);
    try {
      await migrated.open();
      expect(migrated.tables.map((table) => table.name)).not.toContain(
        "outbox",
      );
      expect(await migrated.meta.toArray()).toEqual([
        { id: "learner-state-version", numberValue: 7 },
      ]);
    } finally {
      await migrated.delete();
    }
  });

  test("commits attempt, statistics, and progress atomically", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect(await db.wordStats.count()).toBe(1);
    expect(await db.questionProgress.count()).toBe(1);
  });

  test("graduates the review interval on perfect streaks and resets on a lapse", async () => {
    const key = ["yc-2026-w29", attempt.questionId] as const;
    const perfectFirst: AttemptEvent = {
      ...attempt,
      attemptId: "11111111-1111-4111-8111-111111111111",
      accuracy: 1,
      errors: [],
      completedAt: "2026-07-15T10:00:00.000Z",
    };
    await repository.commitAttempt("yc-2026-w29", perfectFirst);
    let progress = await db.questionProgress.get(key);
    expect(progress?.streak).toBe(1);
    expect(progress?.dueAt).toBe("2026-07-16T10:00:00.000Z");

    const perfectSecond: AttemptEvent = {
      ...perfectFirst,
      attemptId: "22222222-2222-4222-8222-222222222222",
      completedAt: "2026-07-16T10:00:00.000Z",
    };
    await repository.commitAttempt("yc-2026-w29", perfectSecond);
    progress = await db.questionProgress.get(key);
    expect(progress?.streak).toBe(2);
    expect(progress?.dueAt).toBe("2026-07-18T10:00:00.000Z");

    const lapse: AttemptEvent = {
      ...attempt,
      attemptId: "33333333-3333-4333-8333-333333333333",
      accuracy: 0.5,
      completedAt: "2026-07-18T10:00:00.000Z",
    };
    await repository.commitAttempt("yc-2026-w29", lapse);
    progress = await db.questionProgress.get(key);
    expect(progress?.streak).toBe(0);
    expect(progress?.dueAt).toBe("2026-07-18T10:30:00.000Z");
  });

  test("marking preserves the review streak", async () => {
    const perfect: AttemptEvent = {
      ...attempt,
      attemptId: "44444444-4444-4444-8444-444444444444",
      accuracy: 1,
      errors: [],
    };
    await repository.commitAttempt("yc-2026-w29", perfect);
    await repository.setMarked("yc-2026-w29", attempt.questionId, true);
    const progress = await db.questionProgress.get([
      "yc-2026-w29",
      attempt.questionId,
    ] as const);
    expect(progress?.marked).toBe(true);
    expect(progress?.streak).toBe(1);
  });

  test("is idempotent for the same attemptId", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect((await db.wordStats.toArray())[0]?.occurrences).toBe(1);
    expect((await db.meta.get("learner-state-version"))?.numberValue).toBe(1);
  });

  test("rolls every fact table back if a local fact write fails", async () => {
    db.wordStats.hook("creating", () => {
      throw new Error("forced word-stat failure");
    });
    await expect(
      repository.commitAttempt("yc-2026-w29", attempt),
    ).rejects.toThrow("forced word-stat failure");
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
