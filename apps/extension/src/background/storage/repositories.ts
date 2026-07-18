import {
  type AttemptEvent,
  AttemptEventSchema,
  type CandidateFact,
  type DraftCheckpoint,
  DraftCheckpointSchema,
  type IndexedQuestion,
  IndexedQuestionSchema,
  type IndexSnapshot,
  IndexSnapshotSchema,
  type QuestionRef,
  QuestionRefSchema,
  type RankCandidate,
  type RestoredSession,
  type UserSettings,
  UserSettingsSchema,
  type WordStatSummary,
} from "@pte-pilot/contracts";
import { scheduleNextReview } from "../../learning/spaced-repetition";
import { isTrainableWord } from "../../learning/word-filter";
import type {
  PtePilotDb,
  QuestionProgressRecord,
  SessionRecord,
  WordStatRecord,
} from "./db";

const HOUR_MS = 60 * 60 * 1_000;

const progressKey = (
  predictionEdition: string,
  questionId: string,
): readonly [string, string] => [predictionEdition, questionId];

const wordKey = (error: AttemptEvent["errors"][number]): string =>
  [
    error.type,
    error.expected.toLocaleLowerCase("en-AU"),
    error.actual.toLocaleLowerCase("en-AU"),
  ].join("\u0000");

function requireTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error("invalid timestamp");
  return timestamp;
}

export class CockpitRepositories {
  constructor(
    private readonly db: PtePilotDb,
    private readonly clock: () => number = Date.now,
  ) {}

  async loadDraft(
    predictionEdition: string,
    questionId: string,
  ): Promise<DraftCheckpoint | null> {
    return (
      (await this.db.drafts.get(progressKey(predictionEdition, questionId))) ??
      null
    );
  }

  async saveDraft(input: DraftCheckpoint): Promise<void> {
    const draft = DraftCheckpointSchema.parse(input);
    await this.db.transaction("rw", this.db.drafts, async () => {
      const key = progressKey(draft.predictionEdition, draft.questionId);
      const current = await this.db.drafts.get(key);
      if (!current || draft.revision > current.revision) {
        await this.db.drafts.put(draft);
      }
    });
  }

  async saveSession(
    input: QuestionRef,
    updatedAt = new Date(this.clock()).toISOString(),
  ): Promise<void> {
    const question = QuestionRefSchema.parse(input);
    requireTimestamp(updatedAt);
    const session: SessionRecord = { id: "current", ...question, updatedAt };
    await this.db.sessions.put(session);
  }

  async restoreSession(): Promise<RestoredSession> {
    const session = await this.db.sessions.get("current");
    if (!session) return { question: null, draft: null };
    const question = QuestionRefSchema.parse({
      questionId: session.questionId,
      predictionEdition: session.predictionEdition,
      position: session.position,
      total: session.total,
    });
    return {
      question,
      draft: await this.loadDraft(
        session.predictionEdition,
        session.questionId,
      ),
    };
  }

  async commitAttempt(
    predictionEdition: string,
    input: AttemptEvent,
  ): Promise<void> {
    const attempt = AttemptEventSchema.parse(input);
    await this.db.transaction(
      "rw",
      [
        this.db.attempts,
        this.db.wordStats,
        this.db.questionProgress,
        this.db.meta,
        this.db.sessions,
      ],
      async () => {
        const session = await this.db.sessions.get("current");
        if (
          session?.predictionEdition !== predictionEdition ||
          session.questionId !== attempt.questionId
        ) {
          throw new Error("attempt does not match verified current session");
        }
        if (await this.db.attempts.get(attempt.attemptId)) return;

        await this.db.attempts.add(attempt);
        const key = progressKey(predictionEdition, attempt.questionId);
        const current = await this.db.questionProgress.get(key);
        const schedule = scheduleNextReview({
          accuracy: attempt.accuracy,
          completedAt: attempt.completedAt,
          previousStreak: current?.streak ?? 0,
        });
        const progress: QuestionProgressRecord = {
          predictionEdition,
          questionId: attempt.questionId,
          attemptCount: (current?.attemptCount ?? 0) + 1,
          errorCount: (current?.errorCount ?? 0) + attempt.errors.length,
          lastAccuracy: attempt.accuracy,
          lastAttemptAt: attempt.completedAt,
          dueAt: schedule.dueAt,
          marked: current?.marked ?? false,
          streak: schedule.streak,
        };
        await this.db.questionProgress.put(progress);

        for (const error of attempt.errors) {
          // Only answer-side words with drilling value enter the library:
          // the learner's own extra words and short function words do not.
          if (!isTrainableWord(error.expected)) continue;
          const key = wordKey(error);
          const previous = await this.db.wordStats.get(key);
          const word: WordStatRecord = {
            key,
            expected: error.expected,
            actual: error.actual,
            type: error.type,
            occurrences: (previous?.occurrences ?? 0) + 1,
            lastSeenAt: attempt.completedAt,
          };
          await this.db.wordStats.put(word);
        }

        await this.incrementLearnerStateVersion();
      },
    );
  }

  async setMarked(
    predictionEdition: string,
    questionId: string,
    marked: boolean,
  ): Promise<void> {
    await this.db.transaction(
      "rw",
      [this.db.questionProgress, this.db.meta],
      async () => {
        const key = progressKey(predictionEdition, questionId);
        const current = await this.db.questionProgress.get(key);
        if (current?.marked === marked) return;
        await this.db.questionProgress.put({
          predictionEdition,
          questionId,
          attemptCount: current?.attemptCount ?? 0,
          errorCount: current?.errorCount ?? 0,
          lastAccuracy: current?.lastAccuracy ?? null,
          lastAttemptAt: current?.lastAttemptAt ?? null,
          dueAt: current?.dueAt ?? null,
          marked,
          streak: current?.streak ?? 0,
        });
        await this.incrementLearnerStateVersion();
      },
    );
  }

  /*
   * Re-identify a verified question set after a page reload. The site often
   * cannot express a stable edition itself, so the anchor is a stored
   * complete index whose question at the probed position matches exactly.
   * Ambiguity (several matching sets) fails closed to null.
   */
  async matchVerifiedEdition(probe: {
    questionId: string;
    position: number;
    total: number;
  }): Promise<string | null> {
    const snapshots = await this.db.snapshots.toArray();
    const matches = snapshots.filter(
      (snapshot) =>
        snapshot.completeness === "complete" &&
        snapshot.siteTotal === probe.total &&
        snapshot.orderedQuestionIds[probe.position - 1] === probe.questionId,
    );
    return matches.length === 1
      ? (matches[0]?.predictionEdition ?? null)
      : null;
  }

  async listCandidateFacts(
    predictionEdition: string,
  ): Promise<CandidateFact[]> {
    const rows = await this.db.questionProgress
      .where("predictionEdition")
      .equals(predictionEdition)
      .toArray();
    return rows
      .sort((left, right) =>
        left.questionId.localeCompare(right.questionId, "en"),
      )
      .map((row) => ({
        questionId: row.questionId,
        dueAt: row.dueAt,
        attemptCount: row.attemptCount,
        errorCount: row.errorCount,
        lastAccuracy: row.lastAccuracy,
        lastAttemptAt: row.lastAttemptAt,
        marked: row.marked,
      }));
  }

  async getRankCandidates(
    predictionEdition: string,
    requestedQuestionIds: readonly string[],
  ): Promise<{ learnerStateVersion: number; candidates: RankCandidate[] }> {
    const questionIds = [...new Set(requestedQuestionIds)];
    if (questionIds.length === 0 || questionIds.length > 500) {
      throw new Error("rank candidate count must be between 1 and 500");
    }
    return this.db.transaction(
      "r",
      [this.db.questionProgress, this.db.meta],
      async () => {
        const rows = await this.db.questionProgress.bulkGet(
          questionIds.map((questionId) =>
            progressKey(predictionEdition, questionId),
          ),
        );
        const now = this.clock();
        const candidates = questionIds.map((questionId, index) => {
          const row = rows[index];
          const dueScore = !row?.dueAt
            ? 1
            : Math.min(
                1,
                Math.max(
                  0,
                  (now - Date.parse(row.dueAt)) / (24 * HOUR_MS) + 0.5,
                ),
              );
          return {
            questionId,
            dueScore,
            weaknessScore: row
              ? Math.min(1, row.errorCount / Math.max(1, row.attemptCount * 3))
              : 0,
            noveltyScore: row ? 0 : 1,
            marked: row?.marked ?? false,
            attemptCount: row?.attemptCount ?? 0,
            lastAttemptAt: row?.lastAttemptAt ?? null,
          } satisfies RankCandidate;
        });
        return {
          learnerStateVersion:
            (await this.db.meta.get("learner-state-version"))?.numberValue ?? 0,
          candidates,
        };
      },
    );
  }

  async loadIndexSnapshot(
    predictionEdition: string,
  ): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }> {
    const snapshot = (await this.db.snapshots.get(predictionEdition)) ?? null;
    const allowed = new Set(snapshot?.orderedQuestionIds ?? []);
    return {
      snapshot,
      questions: (
        await this.db.questions
          .where("predictionEdition")
          .equals(predictionEdition)
          .sortBy("sitePosition")
      ).filter((question) => allowed.has(question.questionId)),
    };
  }

  async saveIndexSnapshot(
    inputSnapshot: IndexSnapshot,
    inputQuestions: readonly IndexedQuestion[],
  ): Promise<void> {
    const snapshot = IndexSnapshotSchema.parse(inputSnapshot);
    const questions = inputQuestions.map((question) =>
      IndexedQuestionSchema.parse(question),
    );
    if (
      questions.some(
        (question) =>
          question.predictionEdition !== snapshot.predictionEdition ||
          question.siteTotal !== snapshot.siteTotal ||
          !snapshot.orderedQuestionIds.includes(question.questionId),
      )
    ) {
      throw new Error("index write does not match snapshot");
    }
    if (snapshot.completeness === "complete") {
      const sortedQuestions = [...questions].sort(
        (left, right) => left.sitePosition - right.sitePosition,
      );
      const ordered = sortedQuestions.map((question) => question.questionId);
      const expectedPositions = sortedQuestions.every(
        (question, index) => question.sitePosition === index + 1,
      );
      if (
        questions.length !== snapshot.siteTotal ||
        !expectedPositions ||
        ordered.some(
          (questionId, index) =>
            questionId !== snapshot.orderedQuestionIds[index],
        )
      ) {
        throw new Error("complete index must cover ordered positions 1..N");
      }
    }

    await this.db.transaction(
      "rw",
      [this.db.snapshots, this.db.questions],
      async () => {
        await this.db.questions
          .where("predictionEdition")
          .equals(snapshot.predictionEdition)
          .delete();
        await this.db.questions.bulkPut(questions);
        await this.db.snapshots.put(snapshot);
      },
    );
  }

  async loadSettings(): Promise<UserSettings | null> {
    const settings = await this.db.settings.get("current");
    return settings ? UserSettingsSchema.parse(settings) : null;
  }

  async saveSettings(input: UserSettings): Promise<void> {
    await this.db.settings.put(UserSettingsSchema.parse(input));
  }

  async listWordStats(limit: number): Promise<WordStatSummary[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error("word stat limit must be between 1 and 500");
    }
    const words = await this.db.wordStats.toArray();
    return words
      .sort(
        (left, right) =>
          right.lastSeenAt.localeCompare(left.lastSeenAt) ||
          left.key.localeCompare(right.key, "en"),
      )
      .slice(0, limit);
  }

  private async incrementLearnerStateVersion(): Promise<void> {
    const current = await this.db.meta.get("learner-state-version");
    await this.db.meta.put({
      id: "learner-state-version",
      numberValue: (current?.numberValue ?? 0) + 1,
    });
  }
}
