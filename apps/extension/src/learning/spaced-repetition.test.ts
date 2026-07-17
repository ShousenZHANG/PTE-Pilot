import { describe, expect, test } from "vitest";
import { scheduleNextReview } from "./spaced-repetition";

const completedAt = "2026-07-15T10:00:00.000Z";

describe("scheduleNextReview", () => {
  test("a lapse resets the streak and returns within the session", () => {
    const schedule = scheduleNextReview({
      accuracy: 0.5,
      completedAt,
      previousStreak: 3,
    });
    expect(schedule.streak).toBe(0);
    expect(schedule.dueAt).toBe("2026-07-15T10:30:00.000Z");
  });

  test("a near miss keeps the streak and returns the same day", () => {
    const schedule = scheduleNextReview({
      accuracy: 0.85,
      completedAt,
      previousStreak: 2,
    });
    expect(schedule.streak).toBe(2);
    expect(schedule.dueAt).toBe("2026-07-15T16:00:00.000Z");
  });

  test("perfect attempts climb the 1/2/4/7-day ladder and cap at 7 days", () => {
    const expectations = [
      { previousStreak: 0, dueAt: "2026-07-16T10:00:00.000Z", streak: 1 },
      { previousStreak: 1, dueAt: "2026-07-17T10:00:00.000Z", streak: 2 },
      { previousStreak: 2, dueAt: "2026-07-19T10:00:00.000Z", streak: 3 },
      { previousStreak: 3, dueAt: "2026-07-22T10:00:00.000Z", streak: 4 },
      { previousStreak: 9, dueAt: "2026-07-22T10:00:00.000Z", streak: 10 },
    ];
    for (const expected of expectations) {
      const schedule = scheduleNextReview({
        accuracy: 1,
        completedAt,
        previousStreak: expected.previousStreak,
      });
      expect(schedule).toEqual({
        streak: expected.streak,
        dueAt: expected.dueAt,
      });
    }
  });

  test("negative or fractional streaks are normalized before scheduling", () => {
    const schedule = scheduleNextReview({
      accuracy: 1,
      completedAt,
      previousStreak: -2,
    });
    expect(schedule.streak).toBe(1);
    expect(schedule.dueAt).toBe("2026-07-16T10:00:00.000Z");
  });

  test("rejects an unparseable completion timestamp", () => {
    expect(() =>
      scheduleNextReview({
        accuracy: 1,
        completedAt: "not-a-date",
        previousStreak: 0,
      }),
    ).toThrow("review:invalid-completed-at");
  });
});
