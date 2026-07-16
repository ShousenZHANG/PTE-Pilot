import { type GatewayHealth, GatewayHealthSchema } from "@pte-pilot/contracts";
import type { FastifyInstance } from "fastify";
import type { HermesClient } from "../hermes/hermes-client.js";
import type { AttemptProjection } from "../projection/attempt-projection.js";

export async function registerHealthRoute(
  app: FastifyInstance,
  projection: AttemptProjection,
  hermes: HermesClient,
): Promise<void> {
  app.get("/pte/v1/health", async (_request, reply) => {
    const audit = await hermes.audit().catch(() => ({
      enabledTools: [],
      model: null,
      status: "offline" as const,
      unexpectedTools: [],
    }));
    const identity = projection.getProjectionIdentity();
    const health: GatewayHealth = {
      capabilities: ["events:batchUpsert", "rank", "pair"],
      hermes: audit,
      profile: "pte-pilot",
      projectionInstanceId: identity.projectionInstanceId,
      projectionVersion: identity.projectionVersion,
      schemaVersion: 1,
      service: "pte-pilot",
      status: audit.status === "ready" ? "ready" : "degraded",
    };
    return reply.send(GatewayHealthSchema.parse(health));
  });
}
