import { PairRequestSchema, PairResponseSchema } from "@pte-pilot/contracts";
import type { FastifyInstance } from "fastify";
import {
  PairingError,
  type PairingService,
} from "../security/pairing-service.js";

export async function registerPairingRoutes(
  app: FastifyInstance,
  pairing: PairingService,
): Promise<void> {
  app.post("/pte/v1/pair", async (request, reply) => {
    const parsed = PairRequestSchema.safeParse(request.body);
    if (
      !parsed.success ||
      !/^[A-HJ-NP-Z2-9]{12}$/i.test(parsed.data.pairingCode)
    ) {
      return reply.code(400).send({ error: "invalid_pair_request" });
    }
    try {
      return reply.send(
        PairResponseSchema.parse({
          token: pairing.pair(parsed.data.pairingCode),
        }),
      );
    } catch (error) {
      if (error instanceof PairingError) {
        return reply.code(401).send({ error: "pairing_rejected" });
      }
      throw error;
    }
  });
}
