import type { FastifyReply, FastifyRequest } from "fastify";
import type { PairingService } from "./pairing-service.js";

export function authenticateBearer(pairing: PairingService) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(
      request.headers.authorization ?? "",
    );
    if (!match || !pairing.isTokenActive(match[1] ?? "")) {
      await reply.code(401).send({ error: "unauthorized" });
    }
  };
}
