import { describe, expect, test } from "vitest";
import {
  AttemptEventSchema,
  IndexSnapshotSchema,
  NavigationEpochSchema,
  QuestionRefSchema,
  RuntimeRequestSchema,
} from "./index";

const question = QuestionRefSchema.parse({
  questionId: "131020",
  position: 12,
  total: 192,
  predictionEdition: "yc-2026-w29",
});

describe("shared contracts", () => {
  test("brands epochs through schema parsing", () => {
    expect(NavigationEpochSchema.parse(0)).toBe(0);
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
    expect(() =>
      AttemptEventSchema.parse({
        ...attempt,
        correctSentence: "secret answer",
      }),
    ).toThrow();
  });

  test("rejects loose runtime messages", () => {
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
  });
});
