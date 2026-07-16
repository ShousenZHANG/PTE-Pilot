import { AudioBindingKeySchema } from "@pte-pilot/contracts";
import { z } from "zod";

export const AudioCaptureRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      requestId: z.string().uuid(),
      action: z.literal("audio/captureBegin"),
      binding: AudioBindingKeySchema,
      armedAt: z.number().finite(),
    })
    .strict(),
  z
    .object({
      requestId: z.string().uuid(),
      action: z.literal("audio/captureCancel"),
      binding: AudioBindingKeySchema,
    })
    .strict(),
]);
export type AudioCaptureRequest = z.infer<typeof AudioCaptureRequestSchema>;

export const AudioCaptureResponseSchema = z
  .object({
    requestId: z.string().uuid(),
    ok: z.boolean(),
    action: z.enum(["audio/captureBegin", "audio/captureCancel"]),
    reason: z.string().optional(),
  })
  .strict();

const AudioCaptureEventBaseSchema = z.object({
  action: z.literal("audio/captureResult"),
  binding: AudioBindingKeySchema,
  armedAt: z.number().finite(),
});

export const AudioCaptureEventSchema = z.discriminatedUnion("status", [
  AudioCaptureEventBaseSchema.extend({
    status: z.literal("unique"),
    candidateCount: z.literal(1),
    startedAt: z.number().finite(),
  }).strict(),
  AudioCaptureEventBaseSchema.extend({
    status: z.literal("ambiguous"),
    candidateCount: z.number().int().min(2),
    startedAt: z.number().finite(),
  }).strict(),
  AudioCaptureEventBaseSchema.extend({
    status: z.literal("missing"),
    candidateCount: z.literal(0),
    startedAt: z.null(),
  }).strict(),
]);
export type AudioCaptureEvent = z.infer<typeof AudioCaptureEventSchema>;

export interface AudioCaptureHandle {
  armedAt: number;
  observation: Promise<AudioCaptureEvent>;
}
