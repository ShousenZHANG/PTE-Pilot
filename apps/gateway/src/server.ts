import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";
import { openGatewayDatabase } from "./db/database.js";
import {
  createHttpHermesClient,
  createOfflineHermesClient,
} from "./hermes/hermes-client.js";
import { MemorySyncCoordinator } from "./memory/memory-sync.js";
import { AttemptProjection } from "./projection/attempt-projection.js";
import { RankService } from "./ranking/rank-service.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerPairingRoutes } from "./routes/pairing.js";
import { registerRankRoute } from "./routes/rank.js";
import { registerOriginGuard } from "./security/origin-guard.js";
import { PairingService } from "./security/pairing-service.js";

export async function createGatewayServer(
  config: GatewayConfig,
): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 256 * 1024,
    logger: config.logger,
  });
  const database = openGatewayDatabase(config.dbPath);
  const projection = new AttemptProjection(database);
  const pairing = new PairingService({
    database,
    now: config.now,
    pepper: config.tokenPepper,
    randomBytes: config.randomBytes,
    ttlMs: config.pairingCodeTtlMs,
  });
  const hermes =
    config.hermesClient ??
    (config.hermesEnabled
      ? createHttpHermesClient({
          apiKey: config.hermesApiKey,
          baseUrl: config.hermesBaseUrl,
          configPath: config.hermesConfigPath,
          expectedModel: config.hermesExpectedModel,
          timeoutMs: config.hermesTimeoutMs,
        })
      : createOfflineHermesClient());
  const memory = new MemorySyncCoordinator(
    projection,
    hermes,
    config.memorySyncIntervalMs,
  );
  const ranking = new RankService(hermes);

  await registerOriginGuard(app, config.allowedExtensionOrigin);
  await registerHealthRoute(app, projection, hermes);
  await registerPairingRoutes(app, pairing);
  await registerEventRoutes(app, projection, pairing, () => memory.kick());
  await registerRankRoute(app, ranking, pairing);

  app.addHook("onClose", async () => {
    memory.stop();
    await memory.flush();
    database.close();
  });
  memory.start();
  await app.ready();
  return app;
}
