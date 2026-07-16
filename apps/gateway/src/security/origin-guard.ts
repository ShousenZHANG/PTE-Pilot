import type { FastifyInstance } from "fastify";

export async function registerOriginGuard(
  app: FastifyInstance,
  allowedOrigin: string,
): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin !== undefined && origin !== allowedOrigin) {
      await reply.code(403).send({ error: "origin_rejected" });
    }
  });
  app.addHook("onSend", async (request, reply, payload) => {
    if (request.headers.origin === allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
      reply.header("Vary", "Origin");
    }
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    return payload;
  });
}
