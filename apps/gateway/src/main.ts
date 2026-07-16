import { loadGatewayConfig } from "./config.js";
import { createGatewayServer } from "./server.js";

const config = loadGatewayConfig();
const app = await createGatewayServer(config);

const stop = async (signal: NodeJS.Signals): Promise<void> => {
  app.log.info({ signal }, "stopping PTE Pilot Gateway");
  await app.close();
  process.exit(0);
};

process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

await app.listen({ host: "127.0.0.1", port: config.port });
