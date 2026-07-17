import { z } from "zod";
import { NavigationEpochSchema, QuestionRefSchema } from "./site";

export const AttemptEpochSchema = z
  .number()
  .int()
  .nonnegative()
  .brand<"AttemptEpoch">();
export type AttemptEpoch = z.infer<typeof AttemptEpochSchema>;

export const SubmissionTokenSchema = z
  .string()
  .uuid()
  .brand<"SubmissionToken">();
export type SubmissionToken = z.infer<typeof SubmissionTokenSchema>;

export const RuntimeFaultCodeSchema = z.enum([
  "AUTH_REQUIRED",
  "SITE_CHANGED",
  "DESYNC",
  "AUDIO_ERROR",
  "INDEX_PARTIAL",
  "STORAGE_ERROR",
]);
export type RuntimeFaultCode = z.infer<typeof RuntimeFaultCodeSchema>;

export const RuntimeFaultSchema = z
  .object({
    code: RuntimeFaultCodeSchema,
    message: z.string().trim().min(1).max(1_024),
    recoverable: z.boolean(),
    details: z
      .record(
        z.string(),
        z.union([z.string(), z.number().finite(), z.boolean(), z.null()]),
      )
      .optional(),
  })
  .strict();
export type RuntimeFault = z.infer<typeof RuntimeFaultSchema>;

export const MainPhaseSchema = z.enum([
  "AUTH_REQUIRED",
  "PROBING",
  "READY",
  "ANSWERING",
  "COMMAND",
  "SUBMITTING",
  "REVIEW",
  "NAVIGATING",
  "RESETTING",
  "PAUSED",
]);
export type MainPhase = z.infer<typeof MainPhaseSchema>;

export const AudioStatusSchema = z.enum([
  "EMPTY",
  "READY",
  "PLAYING",
  "PAUSED",
  "ENDED",
]);
export type AudioStatus = z.infer<typeof AudioStatusSchema>;

export const IndexStatusSchema = z.enum([
  "IDLE",
  "DISCOVERING",
  "INDEXING",
  "COMPLETE",
  "PARTIAL",
  "PAUSED",
  "FAILED",
]);
export type IndexStatus = z.infer<typeof IndexStatusSchema>;

export const PracticeStateSchema = z
  .object({
    phase: MainPhaseSchema,
    question: QuestionRefSchema.nullable(),
    navigationEpoch: NavigationEpochSchema,
    attemptEpoch: AttemptEpochSchema,
    audioStatus: AudioStatusSchema,
    indexStatus: IndexStatusSchema,
    fault: RuntimeFaultSchema.nullable(),
  })
  .strict();
export type PracticeState = z.infer<typeof PracticeStateSchema>;
