import { z } from "zod";
import { QuestionIdSchema } from "./site";

export const AttemptErrorTypeSchema = z.enum([
  "missing",
  "extra",
  "spelling",
  "substitution",
  "order",
  "word_form",
]);
export type AttemptErrorType = z.infer<typeof AttemptErrorTypeSchema>;

export const AttemptErrorSchema = z
  .object({
    expected: z.string().max(256),
    actual: z.string().max(256),
    type: AttemptErrorTypeSchema,
  })
  .strict();
export type AttemptError = z.infer<typeof AttemptErrorSchema>;

export const AttemptEventSchema = z
  .object({
    attemptId: z.string().uuid(),
    questionId: QuestionIdSchema,
    accuracy: z.number().finite().min(0).max(1),
    durationMs: z.number().int().nonnegative(),
    replayCount: z.number().int().nonnegative(),
    errors: z.array(AttemptErrorSchema).max(512),
    completedAt: z.string().datetime(),
  })
  .strict();
export type AttemptEvent = z.infer<typeof AttemptEventSchema>;

export const BatchUpsertRequestSchema = z
  .object({
    batchId: z.string().uuid(),
    events: z.array(AttemptEventSchema).min(1).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.events.map((event) => event.attemptId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "attempt IDs must be unique within a batch",
        path: ["events"],
      });
    }
  });
export type BatchUpsertRequest = z.infer<typeof BatchUpsertRequestSchema>;

export const BatchUpsertResponseSchema = z
  .object({
    batchId: z.string().uuid(),
    ackedAttemptIds: z.array(z.string().uuid()).max(100),
    projectionInstanceId: z.string().uuid(),
    projectionVersion: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.ackedAttemptIds).size !== value.ackedAttemptIds.length) {
      context.addIssue({
        code: "custom",
        message: "acknowledged attempt IDs must be unique",
        path: ["ackedAttemptIds"],
      });
    }
  });
export type BatchUpsertResponse = z.infer<typeof BatchUpsertResponseSchema>;

export const RankCandidateSchema = z
  .object({
    questionId: QuestionIdSchema,
    dueScore: z.number().finite().min(0).max(1),
    weaknessScore: z.number().finite().min(0).max(1),
    noveltyScore: z.number().finite().min(0).max(1),
    marked: z.boolean(),
    attemptCount: z.number().int().nonnegative(),
    lastAttemptAt: z.string().datetime().nullable(),
  })
  .strict();
export type RankCandidate = z.infer<typeof RankCandidateSchema>;

export const CandidateSetHashSchema = z
  .string()
  .regex(/^sha256:[0-9a-f]{64}$/u);
export type CandidateSetHash = z.infer<typeof CandidateSetHashSchema>;

export const RankRequestSchema = z
  .object({
    decisionId: z.string().uuid(),
    candidateSetHash: CandidateSetHashSchema,
    learnerStateVersion: z.number().int().nonnegative(),
    candidates: z.array(RankCandidateSchema).min(1).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.candidates.map((candidate) => candidate.questionId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "candidate question IDs must be unique",
        path: ["candidates"],
      });
    }
  });
export type RankRequest = z.infer<typeof RankRequestSchema>;

export const RankResponseSchema = z
  .object({
    decisionId: z.string().uuid(),
    candidateSetHash: CandidateSetHashSchema,
    learnerStateVersion: z.number().int().nonnegative(),
    rankedQuestionIds: z.array(QuestionIdSchema).max(100),
  })
  .strict();
export type RankResponse = z.infer<typeof RankResponseSchema>;

export const GatewayCapabilitySchema = z.enum([
  "events:batchUpsert",
  "rank",
  "pair",
]);

export const GatewayHealthSchema = z
  .object({
    service: z.literal("pte-pilot"),
    status: z.enum(["ready", "degraded"]),
    profile: z.literal("pte-pilot"),
    schemaVersion: z.literal(1),
    projectionInstanceId: z.string().uuid(),
    projectionVersion: z.number().int().nonnegative(),
    capabilities: z.tuple([
      z.literal("events:batchUpsert"),
      z.literal("rank"),
      z.literal("pair"),
    ]),
    hermes: z
      .object({
        status: z.enum(["ready", "offline", "rejected"]),
        model: z.string().min(1).nullable(),
        enabledTools: z.array(z.string()),
        unexpectedTools: z.array(z.string()),
      })
      .strict(),
  })
  .strict();
export type GatewayHealth = z.infer<typeof GatewayHealthSchema>;

export const PairRequestSchema = z
  .object({
    pairingCode: z
      .string()
      .trim()
      .regex(/^[A-HJ-NP-Z2-9]{12}$/iu),
  })
  .strict();
export type PairRequest = z.infer<typeof PairRequestSchema>;

export const PairResponseSchema = z
  .object({
    token: z.string().min(32).max(512),
  })
  .strict();
export type PairResponse = z.infer<typeof PairResponseSchema>;
