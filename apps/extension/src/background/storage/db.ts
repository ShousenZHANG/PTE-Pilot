import type {
  AttemptEvent,
  IndexedQuestion,
  IndexSnapshot,
  UserSettings,
} from "@pte-pilot/contracts";
import Dexie, { type Table } from "dexie";
import { isTrainableWord } from "../../learning/word-filter";

export interface WordStatRecord {
  key: string;
  expected: string;
  actual: string;
  type: AttemptEvent["errors"][number]["type"];
  occurrences: number;
  lastSeenAt: string;
}

export interface QuestionProgressRecord {
  predictionEdition: string;
  questionId: string;
  attemptCount: number;
  errorCount: number;
  lastAccuracy: number | null;
  lastAttemptAt: string | null;
  dueAt: string | null;
  marked: boolean;
  /** Consecutive perfect attempts; optional because pre-existing rows lack it. */
  streak?: number;
}

export interface SessionRecord {
  id: "current";
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
  updatedAt: string;
}

export type MetaId = "learner-state-version";

export interface MetaRecord {
  id: MetaId;
  numberValue?: number;
  stringValue?: string;
}

export class PtePilotDb extends Dexie {
  attempts!: Table<AttemptEvent, string>;
  wordStats!: Table<WordStatRecord, string>;
  questionProgress!: Table<QuestionProgressRecord, readonly [string, string]>;
  questions!: Table<IndexedQuestion, readonly [string, string]>;
  snapshots!: Table<IndexSnapshot, string>;
  sessions!: Table<SessionRecord, "current">;
  settings!: Table<UserSettings, "current">;
  meta!: Table<MetaRecord, MetaId>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
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
    this.version(2)
      .stores({
        outbox: null,
      })
      .upgrade((transaction) =>
        transaction
          .table("meta")
          .bulkDelete(["projection-instance-id", "projection-version"]),
      );
    // Purge word-library entries recorded before the admission policy:
    // extra words (empty expected), probe letters and function words.
    this.version(3).upgrade((transaction) =>
      transaction
        .table<WordStatRecord>("wordStats")
        .filter((record) => !isTrainableWord(record.expected))
        .delete(),
    );
    // Drafts are no longer restored: every question entry starts with an
    // empty answer box, so the store (and its stale text) goes away.
    this.version(4).stores({ drafts: null });
  }
}

// This module lives under background/storage so only the extension Service Worker
// owns database construction. Content code communicates through runtime messages.
export const createPtePilotDb = (name = "pte-pilot-facts-v1"): PtePilotDb =>
  new PtePilotDb(name);
