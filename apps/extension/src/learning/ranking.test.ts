import { describe, expect, test } from "vitest";
import { rankLocally } from "./ranking";

const candidates = [
  {
    questionId: "new",
    dueScore: 0.5,
    weaknessScore: 0,
    noveltyScore: 1,
    marked: false,
    attemptCount: 0,
    lastAttemptAt: null,
  },
  {
    questionId: "weak",
    dueScore: 1,
    weaknessScore: 1,
    noveltyScore: 0,
    marked: true,
    attemptCount: 4,
    lastAttemptAt: "2026-07-14T00:00:00.000Z",
  },
] as const;

describe("local ranking", () => {
  test("puts marked overdue weak work first", () => {
    expect(rankLocally(candidates)).toEqual(["weak", "new"]);
  });

  test("uses question id as stable tie breaker", () => {
    expect(
      rankLocally([
        { ...candidates[0], questionId: "q2" },
        { ...candidates[0], questionId: "q1" },
      ]),
    ).toEqual(["q1", "q2"]);
  });
});
