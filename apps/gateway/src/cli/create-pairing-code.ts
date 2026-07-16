import { loadGatewayConfig } from "../config.js";
import { openGatewayDatabase } from "../db/database.js";
import { PairingService } from "../security/pairing-service.js";

const config = loadGatewayConfig();
const database = openGatewayDatabase(config.dbPath);

try {
  const pairing = new PairingService({
    database,
    now: config.now,
    pepper: config.tokenPepper,
    randomBytes: config.randomBytes,
    ttlMs: config.pairingCodeTtlMs,
  });
  process.stdout.write(`${pairing.createCode()}\n`);
} finally {
  database.close();
}
