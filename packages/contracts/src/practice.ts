import { z } from "zod";

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
