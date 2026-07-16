import { RankRequestSchema, RankResponseSchema } from "@pte-pilot/contracts";
import type { FastifyInstance } from "fastify";
import type { RankService } from "../ranking/rank-service.js";
import { authenticateBearer } from "../security/authenticate.js";
import type { PairingService } from "../security/pairing-service.js";

export async function registerRankRoute(
  app: FastifyInstance,
  rankService: RankService,
  pairing: PairingService,
): Promise<void> {
  app.post(
    "/pte/v1/rank",
    { preHandler: authenticateBearer(pairing) },
    async (request, reply) => {
      const parsed = RankRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_rank_request" });
      }
      return reply.send(
        RankResponseSchema.parse(await rankService.rank(parsed.data)),
      );
    },
  );
}
