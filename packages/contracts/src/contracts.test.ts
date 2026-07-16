import { describe, expect, test } from "vitest";
import {
  AttemptEpochSchema,
  AttemptEventSchema,
  BatchUpsertRequestSchema,
  GatewayHealthSchema,
  IndexSnapshotSchema,
  NavigationEpochSchema,
  PracticeStateSchema,
  QuestionRefSchema,
  RankRequestSchema,
  RuntimeRequestSchema,
  SubmissionTokenSchema,
} from "./index";

const question = QuestionRefSchema.parse({
  questionId: "131020",
  position: 12,
  total: 192,
  predictionEdition: "yc-2026-w29",
});

describe("shared contracts", () => {
  test("brands epochs and tokens through schema parsing", () => {
    expect(NavigationEpochSchema.parse(0)).toBe(0);
    expect(AttemptEpochSchema.parse(4)).toBe(4);
    expect(
      SubmissionTokenSchema.parse("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"),
    ).toMatch(/^[0-9a-f-]+$/u);
    expect(() => NavigationEpochSchema.parse(-1)).toThrow();
  });

  test("rejects impossible question positions and incomplete complete snapshots", () => {
    expect(() =>
      QuestionRefSchema.parse({ ...question, position: 193 }),
    ).toThrow();
    expect(() =>
      IndexSnapshotSchema.parse({
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["131020"],
        siteTotal: 192,
        completeness: "complete",
        schemaVersion: 1,
      }),
    ).toThrow();
  });

  test("attempt events contain only sanitized word-level facts", () => {
    const attempt = AttemptEventSchema.parse({
      attemptId: "81d4e9de-457d-4b86-a51a-e93996dcb1ac",
      questionId: "131020",
      accuracy: 0.75,
      durationMs: 8_400,
      replayCount: 1,
      errors: [{ expected: "sentence", actual: "sentense", type: "spelling" }],
      completedAt: "2026-07-15T10:00:00.000Z",
    });
    expect(
      BatchUpsertRequestSchema.parse({
        batchId: "f7cb19be-7aa2-4e80-bc4b-6f2c924b864f",
        events: [attempt],
      }).events,
    ).toHaveLength(1);
    expect(() =>
      AttemptEventSchema.parse({
        ...attempt,
        correctSentence: "secret answer",
      }),
    ).toThrow();
  });

  test("requires unique rank candidates and parses a bounded request", () => {
    const candidate = {
      questionId: "131020",
      dueScore: 1,
      weaknessScore: 0.5,
      noveltyScore: 0,
      marked: false,
      attemptCount: 2,
      lastAttemptAt: "2026-07-15T10:00:00.000Z",
    };
    expect(
      RankRequestSchema.parse({
        decisionId: "fbbe1ba0-e458-49ab-b03a-0ceebb1d32a8",
        candidateSetHash: `sha256:${"a".repeat(64)}`,
        learnerStateVersion: 3,
        candidates: [candidate],
      }).candidates,
    ).toHaveLength(1);
    expect(() =>
      RankRequestSchema.parse({
        decisionId: "fbbe1ba0-e458-49ab-b03a-0ceebb1d32a8",
        candidateSetHash: `sha256:${"a".repeat(64)}`,
        learnerStateVersion: 3,
        candidates: [candidate, candidate],
      }),
    ).toThrow();
  });

  test("parses flat runtime state and rejects loose runtime messages", () => {
    expect(
      PracticeStateSchema.parse({
        phase: "ANSWERING",
        question,
        navigationEpoch: NavigationEpochSchema.parse(1),
        attemptEpoch: AttemptEpochSchema.parse(0),
        audioStatus: "READY",
        indexStatus: "PARTIAL",
        hermesOnline: false,
        fault: null,
      }).phase,
    ).toBe("ANSWERING");
    const message = {
      requestId: "89ed35f1-88a3-41a6-b7af-ddb26bb1ed48",
      action: "storage/loadDraft",
      predictionEdition: "yc-2026-w29",
      questionId: "131020",
    };
    expect(RuntimeRequestSchema.parse(message).action).toBe(
      "storage/loadDraft",
    );
    expect(() =>
      RuntimeRequestSchema.parse({ ...message, arbitrary: true }),
    ).toThrow();
    expect(
      RuntimeRequestSchema.parse({
        requestId: "785f5d2c-ed8d-48b5-ac54-32a0a8129747",
        action: "gateway/pair",
        pairingCode: "ABCDEFGH2345",
      }).action,
    ).toBe("gateway/pair");
  });

  test("requires exact Gateway identity and bounded capabilities", () => {
    expect(
      GatewayHealthSchema.parse({
        service: "pte-pilot",
        status: "degraded",
        profile: "pte-pilot",
        schemaVersion: 1,
        projectionInstanceId: "ef8153d5-87c5-48f4-9340-d369927b801f",
        projectionVersion: 0,
        capabilities: ["events:batchUpsert", "rank", "pair"],
        hermes: {
          status: "offline",
          model: null,
          enabledTools: [],
          unexpectedTools: [],
        },
      }).profile,
    ).toBe("pte-pilot");
  });
});
