import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { HermesClient } from "./hermes/hermes-client.js";

const BaseEnvironmentSchema = z.object({
  PTE_GATEWAY_ALLOWED_ORIGIN: z
    .string()
    .regex(/^chrome-extension:\/\/[a-p]{32}$/),
  PTE_GATEWAY_DB_PATH: z.string().min(1),
  PTE_GATEWAY_HOST: z.literal("127.0.0.1").default("127.0.0.1"),
  PTE_GATEWAY_PORT: z.coerce.number().int().min(1).max(65_535).default(8642),
  PTE_GATEWAY_TOKEN_PEPPER: z.string().min(32),
});

const HermesEnvironmentSchema = z.object({
  HERMES_API_KEY: z.string().min(32),
  HERMES_BASE_URL: z
    .string()
    .url()
    .refine((value) => new URL(value).hostname === "127.0.0.1", {
      message: "Hermes must use 127.0.0.1",
    }),
  HERMES_CONFIG_PATH: z.string().min(1),
  HERMES_EXPECTED_MODEL: z.literal("pte-pilot").default("pte-pilot"),
  HERMES_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(250)
    .max(10_000)
    .default(1_500),
});

export interface GatewayConfig {
  allowedExtensionOrigin: string;
  dbPath: string;
  hermesApiKey: string;
  hermesBaseUrl: string;
  hermesClient?: HermesClient;
  hermesConfigPath: string;
  hermesEnabled: boolean;
  hermesExpectedModel: "pte-pilot";
  hermesTimeoutMs: number;
  host: "127.0.0.1";
  logger: boolean;
  memorySyncIntervalMs: number;
  now: () => Date;
  pairingCodeTtlMs: number;
  port: number;
  randomBytes: (size: number) => Buffer;
  schemaVersion: 1;
  tokenPepper: string;
}

export function loadGatewayConfig(
  environment: NodeJS.ProcessEnv = process.env,
): GatewayConfig {
  const base = BaseEnvironmentSchema.parse(environment);
  const hermesKeys = [
    environment.HERMES_BASE_URL,
    environment.HERMES_CONFIG_PATH,
    environment.HERMES_API_KEY,
  ];
  const configuredHermesValues = hermesKeys.filter(
    (value) => typeof value === "string" && value.length > 0,
  ).length;
  if (
    configuredHermesValues !== 0 &&
    configuredHermesValues !== hermesKeys.length
  ) {
    throw new Error(
      "HERMES_BASE_URL, HERMES_CONFIG_PATH, and HERMES_API_KEY must be configured together",
    );
  }

  const hermes =
    configuredHermesValues === hermesKeys.length
      ? HermesEnvironmentSchema.parse(environment)
      : null;

  return {
    allowedExtensionOrigin: base.PTE_GATEWAY_ALLOWED_ORIGIN,
    dbPath: base.PTE_GATEWAY_DB_PATH,
    hermesApiKey: hermes?.HERMES_API_KEY ?? "",
    hermesBaseUrl:
      hermes?.HERMES_BASE_URL.replace(/\/$/, "") ?? "http://127.0.0.1:8643",
    hermesConfigPath: hermes?.HERMES_CONFIG_PATH ?? "",
    hermesEnabled: hermes !== null,
    hermesExpectedModel: hermes?.HERMES_EXPECTED_MODEL ?? "pte-pilot",
    hermesTimeoutMs: hermes?.HERMES_TIMEOUT_MS ?? 1_500,
    host: base.PTE_GATEWAY_HOST,
    logger: true,
    memorySyncIntervalMs: 30_000,
    now: () => new Date(),
    pairingCodeTtlMs: 5 * 60_000,
    port: base.PTE_GATEWAY_PORT,
    randomBytes,
    schemaVersion: 1,
    tokenPepper: base.PTE_GATEWAY_TOKEN_PEPPER,
  };
}
