export interface ReviewScheduleInput {
  accuracy: number;
  completedAt: string;
  previousStreak: number;
}

export interface ReviewSchedule {
  streak: number;
  dueAt: string;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/*
 * Weekly-prediction-tuned spaced repetition (fixed-ladder SM-2 variant).
 *
 * A lapse (<80%) resets the streak and comes back within the same session:
 * the immediate retry is where most of the retention gain lives. A near-miss
 * keeps the streak but returns the same day. A perfect attempt climbs a
 * doubling ladder capped at 7 days — the question set rotates weekly, so
 * longer intervals would schedule reviews past the set's lifetime.
 *
 * No ease factor on purpose: it needs dozens of repetitions per item to
 * converge, while a question here lives for at most a handful, so a fixed
 * deterministic ladder is both simpler and better calibrated.
 */
const LAPSE_DELAY_MS = 30 * MINUTE_MS;
const NEAR_MISS_DELAY_MS = 6 * HOUR_MS;
const GRADUATED_INTERVALS_MS = [
  DAY_MS,
  2 * DAY_MS,
  4 * DAY_MS,
  7 * DAY_MS,
] as const;

export function scheduleNextReview(input: ReviewScheduleInput): ReviewSchedule {
  const completedAt = Date.parse(input.completedAt);
  if (!Number.isFinite(completedAt))
    throw new Error("review:invalid-completed-at");
  const previousStreak = Math.max(0, Math.floor(input.previousStreak));

  if (input.accuracy < 0.8) {
    return { streak: 0, dueAt: toIso(completedAt + LAPSE_DELAY_MS) };
  }
  if (input.accuracy < 1) {
    return {
      streak: previousStreak,
      dueAt: toIso(completedAt + NEAR_MISS_DELAY_MS),
    };
  }
  const streak = previousStreak + 1;
  const interval =
    GRADUATED_INTERVALS_MS[
      Math.min(streak, GRADUATED_INTERVALS_MS.length) - 1
    ] ?? DAY_MS;
  return { streak, dueAt: toIso(completedAt + interval) };
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
