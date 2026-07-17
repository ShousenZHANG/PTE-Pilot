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
