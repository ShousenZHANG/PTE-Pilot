import { z } from "zod";

export const QuestionIdSchema = z.string().trim().min(1).max(128);
export const PredictionEditionSchema = z.string().trim().min(1).max(128);

export const QuestionRefSchema = z
  .object({
    questionId: QuestionIdSchema,
    position: z.number().int().positive(),
    total: z.number().int().positive(),
    predictionEdition: PredictionEditionSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.position > value.total) {
      context.addIssue({
        code: "custom",
        message: "position exceeds total",
        path: ["position"],
      });
    }
  });
export type QuestionRef = z.infer<typeof QuestionRefSchema>;

export const NavigationEpochSchema = z
  .number()
  .int()
  .nonnegative()
  .brand<"NavigationEpoch">();
export type NavigationEpoch = z.infer<typeof NavigationEpochSchema>;

export const IndexedQuestionSchema = z
  .object({
    predictionEdition: PredictionEditionSchema,
    questionId: QuestionIdSchema,
    sitePosition: z.number().int().positive(),
    siteTotal: z.number().int().positive(),
    tags: z.array(z.string().trim().min(1).max(128)).max(64),
    mediaLocator: z.string().trim().min(1).max(2_048).optional(),
    discoveredAt: z.string().datetime(),
    schemaVersion: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sitePosition > value.siteTotal) {
      context.addIssue({
        code: "custom",
        message: "sitePosition exceeds siteTotal",
        path: ["sitePosition"],
      });
    }
  });
export type IndexedQuestion = z.infer<typeof IndexedQuestionSchema>;

export const IndexSnapshotSchema = z
  .object({
    predictionEdition: PredictionEditionSchema,
    orderedQuestionIds: z.array(QuestionIdSchema),
    siteTotal: z.number().int().positive(),
    completeness: z.enum(["complete", "partial"]),
    checkpointPosition: z.number().int().positive().optional(),
    schemaVersion: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.orderedQuestionIds).size !== value.orderedQuestionIds.length
    ) {
      context.addIssue({
        code: "custom",
        message: "question IDs must be unique",
        path: ["orderedQuestionIds"],
      });
    }
    if (value.orderedQuestionIds.length > value.siteTotal) {
      context.addIssue({
        code: "custom",
        message: "snapshot exceeds site total",
        path: ["orderedQuestionIds"],
      });
    }
    if (
      value.completeness === "complete" &&
      value.orderedQuestionIds.length !== value.siteTotal
    ) {
      context.addIssue({
        code: "custom",
        message: "complete snapshot must cover 1..N",
        path: ["orderedQuestionIds"],
      });
    }
    if (
      value.checkpointPosition !== undefined &&
      value.checkpointPosition > value.siteTotal
    ) {
      context.addIssue({
        code: "custom",
        message: "checkpointPosition exceeds siteTotal",
        path: ["checkpointPosition"],
      });
    }
  });
export type IndexSnapshot = z.infer<typeof IndexSnapshotSchema>;
