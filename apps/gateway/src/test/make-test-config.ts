import type { GatewayConfig } from "../config.js";
import type { HermesClient } from "../hermes/hermes-client.js";

export const readyHermesClient: HermesClient = {
  audit: async () => ({
    enabledTools: ["memory"],
    model: "pte-pilot",
    status: "ready",
    unexpectedTools: [],
  }),
  rank: async (request) => ({
    candidateSetHash: request.candidateSetHash,
    decisionId: request.decisionId,
    learnerStateVersion: request.learnerStateVersion,
    rankedQuestionIds: request.candidates.map(({ questionId }) => questionId),
  }),
  syncMemory: async () => undefined,
};

export function makeTestConfig(
  overrides: Partial<GatewayConfig> = {},
): GatewayConfig {
  return {
    allowedExtensionOrigin:
      "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    dbPath: ":memory:",
    hermesApiKey: "test-hermes-key-with-at-least-thirty-two-characters",
    hermesBaseUrl: "http://127.0.0.1:8643",
    hermesClient: readyHermesClient,
    hermesConfigPath: ":test:",
    hermesEnabled: true,
    hermesExpectedModel: "pte-pilot",
    hermesTimeoutMs: 1_500,
    host: "127.0.0.1",
    logger: false,
    memorySyncIntervalMs: 30_000,
    now: () => new Date("2026-07-15T00:00:00.000Z"),
    pairingCodeTtlMs: 300_000,
    port: 8642,
    randomBytes: (size) => Buffer.alloc(size, 7),
    schemaVersion: 1,
    tokenPepper: "test-pepper-with-at-least-thirty-two-characters",
    ...overrides,
  };
}
