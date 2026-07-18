import { z } from "zod";
import {
  AttemptErrorSchema,
  AttemptEventSchema,
  RankCandidateSchema,
} from "./learning";
import {
  IndexedQuestionSchema,
  IndexSnapshotSchema,
  PredictionEditionSchema,
  QuestionIdSchema,
  QuestionRefSchema,
} from "./site";

export const CandidateFactSchema = z
  .object({
    questionId: QuestionIdSchema,
    dueAt: z.string().datetime().nullable(),
    attemptCount: z.number().int().nonnegative(),
    errorCount: z.number().int().nonnegative(),
    lastAccuracy: z.number().finite().min(0).max(1).nullable(),
    lastAttemptAt: z.string().datetime().nullable(),
    marked: z.boolean(),
  })
  .strict();
export type CandidateFact = z.infer<typeof CandidateFactSchema>;

export const RestoredSessionSchema = z
  .object({
    question: QuestionRefSchema.nullable(),
  })
  .strict();
export type RestoredSession = z.infer<typeof RestoredSessionSchema>;

export const RankCandidateSnapshotSchema = z
  .object({
    learnerStateVersion: z.number().int().nonnegative(),
    candidates: z.array(RankCandidateSchema).max(500),
  })
  .strict();
export type RankCandidateSnapshot = z.infer<typeof RankCandidateSnapshotSchema>;

export const PracticeModeSchema = z.enum(["practice", "exam"]);
export type PracticeMode = z.infer<typeof PracticeModeSchema>;

export const AudioStrategySchema = z.enum([
  "site-player-only",
  "transfer-to-extension",
]);
export type AudioStrategy = z.infer<typeof AudioStrategySchema>;

export const UserSettingsSchema = z
  .object({
    id: z.literal("current"),
    mode: PracticeModeSchema,
    audioStrategy: AudioStrategySchema,
    keymap: z.record(z.string().min(1).max(64), z.string().min(1).max(64)),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const WordStatSummarySchema = z
  .object({
    key: z.string().min(1).max(1_024),
    expected: z.string().max(256),
    actual: z.string().max(256),
    type: AttemptErrorSchema.shape.type,
    occurrences: z.number().int().positive(),
    lastSeenAt: z.string().datetime(),
  })
  .strict();
export type WordStatSummary = z.infer<typeof WordStatSummarySchema>;

const RequestIdSchema = z.string().uuid();
const request = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ requestId: RequestIdSchema, ...shape }).strict();

export const RuntimeRequestSchema = z.discriminatedUnion("action", [
  request({
    action: z.literal("storage/commitAttempt"),
    predictionEdition: PredictionEditionSchema,
    attempt: AttemptEventSchema,
  }),
  request({
    action: z.literal("storage/setMarked"),
    predictionEdition: PredictionEditionSchema,
    questionId: QuestionIdSchema,
    marked: z.boolean(),
  }),
  request({
    action: z.literal("storage/getRankCandidates"),
    predictionEdition: PredictionEditionSchema,
    questionIds: z.array(QuestionIdSchema).min(1).max(500),
  }),
  request({ action: z.literal("storage/restoreSession") }),
  request({
    action: z.literal("storage/saveSession"),
    question: QuestionRefSchema,
  }),
  request({
    action: z.literal("storage/loadIndexSnapshot"),
    predictionEdition: PredictionEditionSchema,
  }),
  request({
    action: z.literal("storage/saveIndexSnapshot"),
    snapshot: IndexSnapshotSchema,
    questions: z.array(IndexedQuestionSchema),
  }),
  request({ action: z.literal("storage/loadSettings") }),
  request({
    action: z.literal("storage/saveSettings"),
    settings: UserSettingsSchema,
  }),
  request({
    action: z.literal("storage/listWordStats"),
    limit: z.number().int().positive().max(500),
  }),
  request({
    action: z.literal("storage/matchVerifiedEdition"),
    questionId: QuestionIdSchema,
    position: z.number().int().positive(),
    total: z.number().int().positive(),
  }),
]);
export type RuntimeRequest = z.infer<typeof RuntimeRequestSchema>;

const success = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object({ requestId: RequestIdSchema, ok: z.literal(true), ...shape })
    .strict();

export const RuntimeSuccessSchema = z.discriminatedUnion("action", [
  success({ action: z.literal("storage/commitAttempt") }),
  success({ action: z.literal("storage/setMarked") }),
  success({
    action: z.literal("storage/getRankCandidates"),
    snapshot: RankCandidateSnapshotSchema,
  }),
  success({
    action: z.literal("storage/restoreSession"),
    session: RestoredSessionSchema,
  }),
  success({ action: z.literal("storage/saveSession") }),
  success({
    action: z.literal("storage/loadIndexSnapshot"),
    snapshot: IndexSnapshotSchema.nullable(),
    questions: z.array(IndexedQuestionSchema),
  }),
  success({ action: z.literal("storage/saveIndexSnapshot") }),
  success({
    action: z.literal("storage/loadSettings"),
    settings: UserSettingsSchema.nullable(),
  }),
  success({ action: z.literal("storage/saveSettings") }),
  success({
    action: z.literal("storage/listWordStats"),
    words: z.array(WordStatSummarySchema),
  }),
  success({
    action: z.literal("storage/matchVerifiedEdition"),
    edition: PredictionEditionSchema.nullable(),
  }),
]);
export type RuntimeSuccess = z.infer<typeof RuntimeSuccessSchema>;

export const RuntimeFailureReasonSchema = z.enum([
  "invalid-request",
  "storage-failure",
]);
export type RuntimeFailureReason = z.infer<typeof RuntimeFailureReasonSchema>;

export const RuntimeFailureSchema = z
  .object({
    requestId: RequestIdSchema,
    ok: z.literal(false),
    action: z.string().min(1).max(128),
    reason: RuntimeFailureReasonSchema,
  })
  .strict();
export type RuntimeFailure = z.infer<typeof RuntimeFailureSchema>;

export const RuntimeResponseSchema = z.union([
  RuntimeSuccessSchema,
  RuntimeFailureSchema,
]);
export type RuntimeResponse = z.infer<typeof RuntimeResponseSchema>;
