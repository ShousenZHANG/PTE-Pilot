import {
  BatchUpsertRequestSchema,
  BatchUpsertResponseSchema,
} from "@pte-pilot/contracts";
import type { FastifyInstance } from "fastify";
import {
  type AttemptProjection,
  ProjectionConflictError,
} from "../projection/attempt-projection.js";
import { authenticateBearer } from "../security/authenticate.js";
import type { PairingService } from "../security/pairing-service.js";

const MEBIBYTE = 1024 * 1024;
const MAX_GATEWAY_COMPLETED_AT_LENGTH = 64;

/*
 * Gateway-compatible upper bound for current event contracts:
 * 100 events * 512 errors * 2 text fields * 256 UTF-16 code units
 * * 6 worst-case JSON bytes, plus bounded question IDs/timestamps and an
 * 8 MiB reserve for UUIDs, error types, numeric scalars, keys, and punctuation.
 * The shared datetime validator permits unbounded fractional precision, so the
 * Gateway caps completedAt at 64 characters; extension ISO timestamps use 24.
 * Derived maximum: 165,758,208 bytes. Route limit: 167,772,160 bytes.
 */
export const EVENT_BATCH_BODY_LIMIT_BYTES = 160 * MEBIBYTE;

export async function registerEventRoutes(
  app: FastifyInstance,
  projection: AttemptProjection,
  pairing: PairingService,
  onProjected: () => void = () => undefined,
): Promise<void> {
  app.post(
    "/pte/v1/events:batchUpsert",
    {
      bodyLimit: EVENT_BATCH_BODY_LIMIT_BYTES,
      onRequest: authenticateBearer(pairing),
    },
    async (request, reply) => {
      const parsed = BatchUpsertRequestSchema.safeParse(request.body);
      if (
        !parsed.success ||
        request.headers["idempotency-key"] !== parsed.data.batchId ||
        parsed.data.events.some(
          ({ completedAt }) =>
            completedAt.length > MAX_GATEWAY_COMPLETED_AT_LENGTH,
        )
      ) {
        return reply.code(400).send({ error: "invalid_event_batch" });
      }
      try {
        const response = BatchUpsertResponseSchema.parse(
          projection.upsertBatch(parsed.data),
        );
        onProjected();
        return reply.send(response);
      } catch (error) {
        if (error instanceof ProjectionConflictError) {
          return reply.code(409).send({ error: "immutable_event_conflict" });
        }
        throw error;
      }
    },
  );
}
