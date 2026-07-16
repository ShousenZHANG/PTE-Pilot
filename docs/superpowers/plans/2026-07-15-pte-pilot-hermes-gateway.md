# PTE Pilot Hermes Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a narrow loopback PTE Pilot Gateway that projects extension-owned learning events into idempotent SQLite state, safely brokers bounded Hermes memory/ranking, and keeps Chrome practice fully usable when Hermes is unavailable.

**Architecture:** `apps/gateway` is the only process allowed to call the private Hermes API. Chrome Service Worker talks only to three versioned PTE routes on `127.0.0.1:8642`; IndexedDB remains source of truth, SQLite remains rebuildable projection, and Hermes remains advisory. Every protected operation uses a paired bearer token; Origin/CORS checks are defense in depth only.

**Tech Stack:** Node.js 24.15.0, pnpm 11.7.0, TypeScript 6.0.3, Fastify 5.10.0, better-sqlite3 12.11.1, Zod 4.4.3, Vitest 4.1.10, Chrome Manifest V3, Windows Task Scheduler, local Hermes Agent.

## Global Constraints

- Use exactly `Node.js 24.15.0` and `pnpm 11.7.0`; fail the setup check on any other version.
- Use exact package versions: `fastify@5.10.0`, `better-sqlite3@12.11.1`, `zod@4.4.3`, `vitest@4.1.10`, `typescript@6.0.3`.
- Bind public Gateway only to `127.0.0.1:8642`; bind private Hermes API to `127.0.0.1:8643`.
- Export `createGatewayServer(config: GatewayConfig): Promise<FastifyInstance>` from `apps/gateway/src/server.ts`.
- Export `GatewayConfig` from `apps/gateway/src/config.ts`; all integration tests may set `dbPath: ":memory:"`.
- Define injectable `HermesClient` in `apps/gateway/src/hermes/hermes-client.ts`.
- Consume `@pte-pilot/contracts`; this plan must not duplicate or modify shared schemas.
- Treat the Cockpit plan's `apps/extension/src/background/start-cockpit-background.ts` as the sole database/runtime composition owner; do not create a second Service Worker root.
- Treat `apps/extension/entrypoints/background.ts` as the WXT entry and preserve the Firefly plan's `registerFireflyMediaObserver(browser)` composition when that plan has landed.
- Require the Cockpit repository invariants before Task 7: a 30-second `leaseExpiresAt`, expired-inflight recovery, projection-instance replay, and a monotonic learner-state version incremented by both a new attempt and an actual mark change.
- Require `apps/extension/package.json` to expose its Cockpit-plan `test` script and `apps/extension/wxt.config.ts` to grant only the approved loopback Gateway origin.
- Require the Cockpit plan's `.gitignore` entry `apps/gateway/dist/`; verify it with `git check-ignore --no-index` before the first Gateway build.
- IndexedDB is authoritative. SQLite is a rebuildable projection. Hermes output never acknowledges database writes.
- Correct answers, full sentences, audio URLs, drafts, cookies, Firefly responses, and upstream credentials never enter rank requests or logs.
- Permit Hermes `memory` only. Deny terminal, file, browser, web, skills, code execution, delegation, session search, cron, messaging, MCP, and any newly discovered tool.
- Validate request and response bodies with Zod at every process boundary.
- Keep event acknowledgement deterministic and transactional; keep memory refresh and rank advice best-effort.
- Every implementation task follows red-green-refactor order and ends with one commit.

## Required Shared Contract Surface

`packages/contracts` must already export these exact names before this plan starts:

```ts
export type AttemptError = {
  expected: string;
  actual: string;
  type: "missing" | "extra" | "spelling" | "substitution" | "order" | "word_form";
};

export type AttemptEvent = {
  attemptId: string;
  questionId: string;
  accuracy: number;
  durationMs: number;
  replayCount: number;
  errors: AttemptError[];
  completedAt: string;
};

export type BatchUpsertRequest = {
  batchId: string;
  events: AttemptEvent[];
};

export type BatchUpsertResponse = {
  batchId: string;
  ackedAttemptIds: string[];
  projectionInstanceId: string;
  projectionVersion: number;
};

export type RankCandidate = {
  questionId: string;
  dueScore: number;
  weaknessScore: number;
  noveltyScore: number;
  marked: boolean;
  attemptCount: number;
  lastAttemptAt: string | null;
};

export type RankRequest = {
  decisionId: string;
  candidateSetHash: `sha256:${string}`;
  learnerStateVersion: number;
  candidates: RankCandidate[];
};

export type RankResponse = {
  decisionId: string;
  candidateSetHash: `sha256:${string}`;
  learnerStateVersion: number;
  rankedQuestionIds: string[];
};

export type GatewayHealth = {
  service: "pte-pilot";
  status: "ready" | "degraded";
  profile: "pte-pilot";
  schemaVersion: 1;
  projectionInstanceId: string;
  projectionVersion: number;
  capabilities: readonly ["events:batchUpsert", "rank", "pair"];
  hermes: {
    status: "ready" | "offline" | "rejected";
    model: string | null;
    enabledTools: string[];
    unexpectedTools: string[];
  };
};

export {
  AttemptErrorSchema,
  AttemptEventSchema,
  BatchUpsertRequestSchema,
  BatchUpsertResponseSchema,
  RankCandidateSchema,
  RankRequestSchema,
  RankResponseSchema,
  GatewayHealthSchema,
};
```

## File Map

```text
apps/gateway/
  package.json                         exact dependencies and scripts
  tsconfig.json                        test/typecheck configuration
  tsconfig.build.json                  production build configuration
  vitest.config.ts                     deterministic Vitest settings
  src/config.ts                        environment parsing and GatewayConfig
  src/server.ts                        createGatewayServer factory
  src/main.ts                          production process entrypoint
  src/db/database.ts                   SQLite lifecycle and migrations
  src/projection/attempt-projection.ts immutable event projection and receipts
  src/security/secrets.ts              code/token generation and hashing
  src/security/pairing-service.ts      one-time pairing and token validation
  src/security/origin-guard.ts         defense-in-depth Origin handling
  src/routes/pairing.ts                public loopback pair route
  src/routes/events.ts                 protected batch upsert route
  src/hermes/hermes-client.ts          private Hermes interface and HTTP client
  src/routes/health.ts                 service/profile/capability identity
  src/ranking/rank-service.ts          strict ranking response validation
  src/routes/rank.ts                   protected rank endpoint
  src/memory/memory-sync.ts            best-effort compact memory refresh
  src/cli/create-pairing-code.ts       local one-time pairing command
  scripts/provision-hermes-profile.ps1 profile creation and tool deny policy
  scripts/install-login-tasks.ps1      Windows login startup
  scripts/audit-runtime.ps1            loopback/profile/tool audit
  README.md                             operator runbook
apps/extension/src/background/gateway/
  gateway-port.ts                      extension-side narrow interface
  gateway-settings.ts                  TRUSTED_CONTEXTS token storage
  gateway-client.ts                    authenticated fetch implementation
  cockpit-outbox-queue.ts              adapter over CockpitRepositories
  outbox-sync.ts                       at-least-once acknowledgement loop
  rank-coordinator.ts                  freshness validation and local fallback
  gateway-runtime.ts                   background-only orchestration
apps/extension/src/background/start-cockpit-background.ts
                                        sole DB owner and typed runtime router
apps/extension/entrypoints/options.html one-time pairing UI
apps/extension/entrypoints/options/main.ts
                                        pairing message sender
tests/integration/gateway-online-flow.test.ts
                                        real pair/outbox/SQLite ACK contract
```

---

### Task 1: Gateway Package, Configuration, and Server Factory

**Files:**
- Modify: `package.json`
- Modify: `apps/gateway/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/gateway/tsconfig.json`
- Create: `apps/gateway/tsconfig.build.json`
- Create: `apps/gateway/vitest.config.ts`
- Create: `apps/gateway/src/config.ts`
- Create: `apps/gateway/src/hermes/hermes-client.ts`
- Create: `apps/gateway/src/server.ts`
- Create: `apps/gateway/src/main.ts`
- Create: `apps/gateway/src/test/make-test-config.ts`
- Test: `apps/gateway/src/server.test.ts`

**Interfaces:**
- Consumes: `RankRequest` from `@pte-pilot/contracts`.
- Produces: `GatewayConfig`, `HermesClient`, `createGatewayServer(config: GatewayConfig): Promise<FastifyInstance>`.

- [ ] **Step 1: Write the failing server factory test**

```ts
// apps/gateway/src/server.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createGatewayServer } from "./server.js";
import { makeTestConfig } from "./test/make-test-config.js";

describe("createGatewayServer", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("creates an injectable Fastify server without listening", async () => {
    app = await createGatewayServer(makeTestConfig());
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/missing" });

    expect(response.statusCode).toBe(404);
    expect(app.server.address()).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run:

```powershell
pnpm exec vitest run --project unit apps/gateway/src/server.test.ts
```

Expected: FAIL containing `Cannot find module './server.js'`.

- [ ] **Step 3: Add exact package and TypeScript configuration**

Keep the root native-build allowlist exact so pnpm can build SQLite while still rejecting unreviewed install scripts:

```json
// package.json (relevant field)
{
  "pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild"] }
}
```

Replace the scaffold Gateway package with:

```json
// apps/gateway/package.json
{
  "name": "@pte-pilot/gateway",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.7.0",
  "engines": {
    "node": "24.15.0",
    "pnpm": "11.7.0"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/main.js",
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
    "pair:create": "node dist/cli/create-pairing-code.js"
  },
  "dependencies": {
    "@pte-pilot/contracts": "workspace:*",
    "better-sqlite3": "12.11.1",
    "fastify": "5.10.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@types/better-sqlite3": "7.6.13",
    "@types/node": "24.13.3",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  }
}
```

```json
// apps/gateway/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

```json
// apps/gateway/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/test/**"]
}
```

```ts
// apps/gateway/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 5_000,
  },
});
```

Run:

```powershell
node --version
corepack prepare pnpm@11.7.0 --activate
pnpm --version
git check-ignore --no-index apps/gateway/dist/main.js
pnpm install --frozen-lockfile=false
```

Expected: version output is exactly `v24.15.0` and `11.7.0`; `git check-ignore` exits 0 because the Cockpit plan already added `apps/gateway/dist/`; install exits 0; `@pte-pilot/gateway` resolves all five pinned core packages and updates `pnpm-lock.yaml`.

- [ ] **Step 4: Add configuration, injectable Hermes interface, and server entrypoints**

```ts
// apps/gateway/src/hermes/hermes-client.ts
import type { RankRequest } from "@pte-pilot/contracts";

export type HermesRuntimeAudit = {
  status: "ready" | "offline" | "rejected";
  model: string | null;
  enabledTools: string[];
  unexpectedTools: string[];
};

export type CompactLearningProfile = {
  projectionVersion: number;
  totalAttempts: number;
  meanAccuracy: number;
  meanReplayCount: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  weakWords: Array<{ word: string; count: number }>;
};

export interface HermesClient {
  audit(): Promise<HermesRuntimeAudit>;
  rank(request: RankRequest): Promise<unknown>;
  syncMemory(profile: CompactLearningProfile): Promise<void>;
}

export function createHttpHermesClient(): HermesClient {
  throw new Error("HTTP Hermes client is not registered yet");
}
```

```ts
// apps/gateway/src/config.ts
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { HermesClient } from "./hermes/hermes-client.js";

const EnvironmentSchema = z.object({
  PTE_GATEWAY_HOST: z.literal("127.0.0.1").default("127.0.0.1"),
  PTE_GATEWAY_PORT: z.coerce.number().int().min(1).max(65_535).default(8642),
  PTE_GATEWAY_DB_PATH: z.string().min(1),
  PTE_GATEWAY_ALLOWED_ORIGIN: z.string().regex(/^chrome-extension:\/\/[a-p]{32}$/),
  PTE_GATEWAY_TOKEN_PEPPER: z.string().min(32),
  HERMES_BASE_URL: z.string().url().refine(
    (value) => new URL(value).hostname === "127.0.0.1",
    "Hermes must use 127.0.0.1",
  ),
  HERMES_CONFIG_PATH: z.string().min(1),
  HERMES_API_KEY: z.string().min(32),
  HERMES_EXPECTED_MODEL: z.literal("pte-pilot").default("pte-pilot"),
  HERMES_TIMEOUT_MS: z.coerce.number().int().min(250).max(10_000).default(1_500),
});

export interface GatewayConfig {
  host: "127.0.0.1";
  port: number;
  dbPath: string;
  schemaVersion: 1;
  allowedExtensionOrigin: string;
  tokenPepper: string;
  pairingCodeTtlMs: number;
  hermesBaseUrl: string;
  hermesConfigPath: string;
  hermesApiKey: string;
  hermesExpectedModel: "pte-pilot";
  hermesTimeoutMs: number;
  memorySyncIntervalMs: number;
  logger: boolean;
  now: () => Date;
  randomBytes: (size: number) => Buffer;
  hermesClient?: HermesClient;
}

export function loadGatewayConfig(environment: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const parsed = EnvironmentSchema.parse(environment);
  return {
    host: parsed.PTE_GATEWAY_HOST,
    port: parsed.PTE_GATEWAY_PORT,
    dbPath: parsed.PTE_GATEWAY_DB_PATH,
    schemaVersion: 1,
    allowedExtensionOrigin: parsed.PTE_GATEWAY_ALLOWED_ORIGIN,
    tokenPepper: parsed.PTE_GATEWAY_TOKEN_PEPPER,
    pairingCodeTtlMs: 5 * 60_000,
    hermesBaseUrl: parsed.HERMES_BASE_URL.replace(/\/$/, ""),
    hermesConfigPath: parsed.HERMES_CONFIG_PATH,
    hermesApiKey: parsed.HERMES_API_KEY,
    hermesExpectedModel: parsed.HERMES_EXPECTED_MODEL,
    hermesTimeoutMs: parsed.HERMES_TIMEOUT_MS,
    memorySyncIntervalMs: 30_000,
    logger: true,
    now: () => new Date(),
    randomBytes,
  };
}
```

```ts
// apps/gateway/src/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";

export async function createGatewayServer(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });
  await app.ready();
  return app;
}
```

```ts
// apps/gateway/src/main.ts
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

await app.listen({ host: config.host, port: config.port });
```

```ts
// apps/gateway/src/test/make-test-config.ts
import type { GatewayConfig } from "../config.js";
import type { HermesClient } from "../hermes/hermes-client.js";

export const readyHermesClient: HermesClient = {
  audit: async () => ({
    status: "ready",
    model: "pte-pilot",
    enabledTools: ["memory"],
    unexpectedTools: [],
  }),
  rank: async (request) => ({
    decisionId: request.decisionId,
    candidateSetHash: request.candidateSetHash,
    learnerStateVersion: request.learnerStateVersion,
    rankedQuestionIds: request.candidates.map(({ questionId }) => questionId),
  }),
  syncMemory: async () => undefined,
};

export function makeTestConfig(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    host: "127.0.0.1",
    port: 8642,
    dbPath: ":memory:",
    schemaVersion: 1,
    allowedExtensionOrigin: "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    tokenPepper: "test-pepper-with-at-least-thirty-two-characters",
    pairingCodeTtlMs: 300_000,
    hermesBaseUrl: "http://127.0.0.1:8643",
    hermesConfigPath: ":test:",
    hermesApiKey: "test-hermes-key-with-at-least-thirty-two-characters",
    hermesExpectedModel: "pte-pilot",
    hermesTimeoutMs: 1_500,
    memorySyncIntervalMs: 30_000,
    logger: false,
    now: () => new Date("2026-07-15T00:00:00.000Z"),
    randomBytes: (size) => Buffer.alloc(size, 7),
    hermesClient: readyHermesClient,
    ...overrides,
  };
}
```

- [ ] **Step 5: Run test, typecheck, and build**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/server.test.ts
pnpm --filter @pte-pilot/gateway typecheck
pnpm --filter @pte-pilot/gateway build
```

Expected: one passing test; typecheck and build exit 0; `apps/gateway/dist/main.js` exists.

- [ ] **Step 6: Commit the server foundation**

```powershell
git add package.json apps/gateway pnpm-lock.yaml
git commit -m "chore(gateway): establish typed Fastify service"
```

Expected: one commit with no generated `dist` files staged.

---

### Task 2: Immutable SQLite Projection and Idempotent Receipts

**Files:**
- Create: `apps/gateway/src/db/database.ts`
- Create: `apps/gateway/src/projection/attempt-projection.ts`
- Test: `apps/gateway/src/projection/attempt-projection.test.ts`

**Interfaces:**
- Consumes: `AttemptEvent`, `BatchUpsertRequest`, `BatchUpsertResponse` from `@pte-pilot/contracts`.
- Produces: `openGatewayDatabase(dbPath, createProjectionInstanceId?)`, `AttemptProjection.upsertBatch(request)`, `getProjectionIdentity()`, `getProjectionVersion()`, `getCompactLearningProfile()`, `markMemorySynced(version)`.
- Projection identity contract: the UUID is created once per SQLite database and survives process restarts; deleting or replacing the database creates a new UUID so IndexedDB can replay all authoritative attempts.

- [ ] **Step 1: Write failing projection tests**

```ts
// apps/gateway/src/projection/attempt-projection.test.ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import type { BatchUpsertRequest } from "@pte-pilot/contracts";
import { openGatewayDatabase } from "../db/database.js";
import { AttemptProjection, ProjectionConflictError } from "./attempt-projection.js";

const request: BatchUpsertRequest = {
  batchId: "11111111-1111-4111-8111-111111111111",
  events: [
    {
      attemptId: "22222222-2222-4222-8222-222222222222",
      questionId: "131020",
      accuracy: 0.8,
      durationMs: 12_500,
      replayCount: 2,
      errors: [{ expected: "postponed", actual: "postpond", type: "spelling" }],
      completedAt: "2026-07-15T00:00:00.000Z",
    },
  ],
};

describe("AttemptProjection", () => {
  let database: Database.Database;
  let projection: AttemptProjection;

  beforeEach(() => {
    database = openGatewayDatabase(
      ":memory:",
      () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    projection = new AttemptProjection(database);
  });

  afterEach(() => database.close());

  it("stores one immutable attempt after one hundred retries", () => {
    const first = projection.upsertBatch(request);
    for (let index = 0; index < 99; index += 1) {
      expect(projection.upsertBatch(request)).toEqual(first);
    }

    const row = database.prepare("SELECT COUNT(*) AS count FROM attempt_events").get() as { count: number };
    expect(row.count).toBe(1);
    expect(first).toEqual({
      batchId: request.batchId,
      ackedAttemptIds: [request.events[0]!.attemptId],
      projectionInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      projectionVersion: 1,
    });
  });

  it("keeps one projection instance id across reopen and changes it for a new database", () => {
    const directory = mkdtempSync(join(tmpdir(), "pte-pilot-projection-"));
    const firstPath = join(directory, "first.sqlite");
    const secondPath = join(directory, "second.sqlite");
    try {
      const first = openGatewayDatabase(
        firstPath,
        () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      );
      const firstIdentity = new AttemptProjection(first).getProjectionIdentity();
      first.close();

      const reopened = openGatewayDatabase(
        firstPath,
        () => "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      );
      expect(new AttemptProjection(reopened).getProjectionIdentity()).toEqual(firstIdentity);
      reopened.close();

      const replacement = openGatewayDatabase(
        secondPath,
        () => "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      );
      expect(new AttemptProjection(replacement).getProjectionIdentity()).toMatchObject({
        projectionInstanceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        projectionVersion: 0,
      });
      replacement.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects reuse of an attempt id with different facts", () => {
    projection.upsertBatch(request);
    const changed: BatchUpsertRequest = {
      batchId: "33333333-3333-4333-8333-333333333333",
      events: [{ ...request.events[0]!, accuracy: 0.4 }],
    };

    expect(() => projection.upsertBatch(changed)).toThrow(ProjectionConflictError);
    expect(projection.getProjectionVersion()).toBe(1);
  });

  it("builds a bounded profile without full sentences or actual spellings", () => {
    projection.upsertBatch(request);

    expect(projection.getCompactLearningProfile()).toEqual({
      projectionVersion: 1,
      totalAttempts: 1,
      meanAccuracy: 0.8,
      meanReplayCount: 2,
      topErrorTypes: [{ type: "spelling", count: 1 }],
      weakWords: [{ word: "postponed", count: 1 }],
    });
  });
});
```

- [ ] **Step 2: Run projection tests and verify missing module failure**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/projection/attempt-projection.test.ts
```

Expected: FAIL containing `Cannot find module '../db/database.js'`.

- [ ] **Step 3: Add SQLite lifecycle and schema**

```ts
// apps/gateway/src/db/database.ts
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

const migration = `
CREATE TABLE IF NOT EXISTS projection_meta (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  projection_instance_id TEXT NOT NULL,
  projection_version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS attempt_events (
  attempt_id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  accuracy REAL NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  replay_count INTEGER NOT NULL CHECK (replay_count >= 0),
  completed_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempt_errors (
  attempt_id TEXT NOT NULL REFERENCES attempt_events(attempt_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  expected TEXT NOT NULL,
  actual TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('missing','extra','spelling','substitution','order','word_form')),
  PRIMARY KEY (attempt_id, ordinal)
);

CREATE TABLE IF NOT EXISTS batch_receipts (
  batch_id TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  response_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gateway_tokens (
  token_hash TEXT PRIMARY KEY,
  issued_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE IF NOT EXISTS memory_sync_state (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  target_version INTEGER NOT NULL,
  synced_version INTEGER NOT NULL,
  last_error TEXT
);
INSERT OR IGNORE INTO memory_sync_state(singleton, target_version, synced_version, last_error)
VALUES (1, 0, 0, NULL);
`;

export function openGatewayDatabase(
  dbPath: string,
  createProjectionInstanceId: () => string = randomUUID,
): Database.Database {
  const database = new Database(dbPath);
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  if (dbPath !== ":memory:") {
    database.pragma("journal_mode = WAL");
  }
  database.exec(migration);
  database.prepare(`
    INSERT OR IGNORE INTO projection_meta(
      singleton, projection_instance_id, projection_version
    ) VALUES (1, ?, 0)
  `).run(createProjectionInstanceId());
  return database;
}
```

- [ ] **Step 4: Add transactional immutable projection**

```ts
// apps/gateway/src/projection/attempt-projection.ts
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import {
  BatchUpsertResponseSchema,
  type AttemptEvent,
  type BatchUpsertRequest,
  type BatchUpsertResponse,
} from "@pte-pilot/contracts";
import type { CompactLearningProfile } from "../hermes/hermes-client.js";

export class ProjectionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectionConflictError";
  }
}

function canonicalAttempt(event: AttemptEvent): string {
  return JSON.stringify({
    attemptId: event.attemptId,
    questionId: event.questionId,
    accuracy: event.accuracy,
    durationMs: event.durationMs,
    replayCount: event.replayCount,
    errors: event.errors.map((error) => ({
      expected: error.expected,
      actual: error.actual,
      type: error.type,
    })),
    completedAt: event.completedAt,
  });
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export class AttemptProjection {
  constructor(private readonly database: Database.Database) {}

  upsertBatch(request: BatchUpsertRequest): BatchUpsertResponse {
    const requestHash = sha256(JSON.stringify(request));
    const transaction = this.database.transaction((): BatchUpsertResponse => {
      const receipt = this.database
        .prepare("SELECT request_hash, response_json FROM batch_receipts WHERE batch_id = ?")
        .get(request.batchId) as { request_hash: string; response_json: string } | undefined;

      if (receipt) {
        if (receipt.request_hash !== requestHash) {
          throw new ProjectionConflictError(`batch id collision: ${request.batchId}`);
        }
        return BatchUpsertResponseSchema.parse(JSON.parse(receipt.response_json));
      }

      const findAttempt = this.database.prepare(
        "SELECT payload_hash FROM attempt_events WHERE attempt_id = ?",
      );
      const insertAttempt = this.database.prepare(`
        INSERT INTO attempt_events(
          attempt_id, question_id, accuracy, duration_ms, replay_count,
          completed_at, payload_hash, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertError = this.database.prepare(`
        INSERT INTO attempt_errors(attempt_id, ordinal, expected, actual, error_type)
        VALUES (?, ?, ?, ?, ?)
      `);

      let insertedCount = 0;
      for (const event of request.events) {
        const payloadJson = canonicalAttempt(event);
        const payloadHash = sha256(payloadJson);
        const existing = findAttempt.get(event.attemptId) as { payload_hash: string } | undefined;
        if (existing) {
          if (existing.payload_hash !== payloadHash) {
            throw new ProjectionConflictError(`attempt id collision: ${event.attemptId}`);
          }
          continue;
        }

        insertAttempt.run(
          event.attemptId,
          event.questionId,
          event.accuracy,
          event.durationMs,
          event.replayCount,
          event.completedAt,
          payloadHash,
          payloadJson,
        );
        event.errors.forEach((error, ordinal) => {
          insertError.run(event.attemptId, ordinal, error.expected, error.actual, error.type);
        });
        insertedCount += 1;
      }

      if (insertedCount > 0) {
        this.database.prepare(
          "UPDATE projection_meta SET projection_version = projection_version + 1 WHERE singleton = 1",
        ).run();
      }

      const identity = this.getProjectionIdentity();
      const projectionVersion = identity.projectionVersion;
      if (insertedCount > 0) {
        this.database.prepare(`
          UPDATE memory_sync_state
          SET target_version = ?, last_error = NULL
          WHERE singleton = 1
        `).run(projectionVersion);
      }

      const response = BatchUpsertResponseSchema.parse({
        batchId: request.batchId,
        ackedAttemptIds: request.events.map(({ attemptId }) => attemptId),
        projectionInstanceId: identity.projectionInstanceId,
        projectionVersion,
      });
      this.database.prepare(`
        INSERT INTO batch_receipts(batch_id, request_hash, response_json)
        VALUES (?, ?, ?)
      `).run(request.batchId, requestHash, JSON.stringify(response));
      return response;
    });

    return transaction.immediate();
  }

  getProjectionVersion(): number {
    return this.getProjectionIdentity().projectionVersion;
  }

  getProjectionIdentity(): {
    projectionInstanceId: string;
    projectionVersion: number;
  } {
    return this.database.prepare(`
      SELECT projection_instance_id AS projectionInstanceId,
             projection_version AS projectionVersion
      FROM projection_meta
      WHERE singleton = 1
    `).get() as { projectionInstanceId: string; projectionVersion: number };
  }

  getMemorySyncState(): { targetVersion: number; syncedVersion: number } {
    const row = this.database.prepare(`
      SELECT target_version AS targetVersion, synced_version AS syncedVersion
      FROM memory_sync_state WHERE singleton = 1
    `).get() as { targetVersion: number; syncedVersion: number };
    return row;
  }

  markMemorySynced(version: number): void {
    this.database.prepare(`
      UPDATE memory_sync_state
      SET synced_version = MAX(synced_version, ?), last_error = NULL
      WHERE singleton = 1
    `).run(version);
  }

  markMemorySyncFailed(message: string): void {
    this.database.prepare(
      "UPDATE memory_sync_state SET last_error = ? WHERE singleton = 1",
    ).run(message.slice(0, 500));
  }

  getCompactLearningProfile(): CompactLearningProfile {
    const aggregate = this.database.prepare(`
      SELECT COUNT(*) AS totalAttempts,
             COALESCE(AVG(accuracy), 0) AS meanAccuracy,
             COALESCE(AVG(replay_count), 0) AS meanReplayCount
      FROM attempt_events
    `).get() as { totalAttempts: number; meanAccuracy: number; meanReplayCount: number };
    const topErrorTypes = this.database.prepare(`
      SELECT error_type AS type, COUNT(*) AS count
      FROM attempt_errors
      GROUP BY error_type
      ORDER BY count DESC, type ASC
      LIMIT 6
    `).all() as Array<{ type: string; count: number }>;
    const weakWords = this.database.prepare(`
      SELECT LOWER(expected) AS word, COUNT(*) AS count
      FROM attempt_errors
      WHERE expected <> ''
      GROUP BY LOWER(expected)
      ORDER BY count DESC, word ASC
      LIMIT 20
    `).all() as Array<{ word: string; count: number }>;

    return {
      projectionVersion: this.getProjectionVersion(),
      totalAttempts: aggregate.totalAttempts,
      meanAccuracy: Number(aggregate.meanAccuracy),
      meanReplayCount: Number(aggregate.meanReplayCount),
      topErrorTypes,
      weakWords,
    };
  }
}
```

- [ ] **Step 5: Run projection tests and full typecheck**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/projection/attempt-projection.test.ts
pnpm --filter @pte-pilot/gateway typecheck
```

Expected: four passing tests and no TypeScript errors. Reopening one SQLite file preserves its projection instance UUID; a replacement database receives another UUID; duplicate batches never advance the projection version.

- [ ] **Step 6: Commit SQLite projection**

```powershell
git add apps/gateway/src/db apps/gateway/src/projection
git commit -m "feat(gateway): add idempotent learning projection"
```

Expected: commit contains schema, immutable collision handling, receipts, and tests.

---

### Task 3: One-Time Pairing, Bearer Authentication, and Origin Defense

**Files:**
- Create: `apps/gateway/src/security/secrets.ts`
- Create: `apps/gateway/src/security/pairing-service.ts`
- Create: `apps/gateway/src/security/auth.ts`
- Create: `apps/gateway/src/security/origin-guard.ts`
- Create: `apps/gateway/src/routes/pairing.ts`
- Create: `apps/gateway/src/cli/create-pairing-code.ts`
- Modify: `apps/gateway/src/server.ts`
- Test: `apps/gateway/src/security/pairing-service.test.ts`
- Test: `apps/gateway/src/routes/pairing.test.ts`

**Interfaces:**
- Consumes: `GatewayConfig`, `openGatewayDatabase`.
- Produces: `PairingService.createCode()`, `PairingService.pair(code)`, `PairingService.isTokenActive(token)`, `authenticateBearer`, `registerPairingRoutes`, `registerOriginGuard`.

- [ ] **Step 1: Write failing pairing and route tests**

```ts
// apps/gateway/src/security/pairing-service.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { openGatewayDatabase } from "../db/database.js";
import { PairingError, PairingService } from "./pairing-service.js";

describe("PairingService", () => {
  let database: Database.Database;
  let service: PairingService;

  beforeEach(() => {
    database = openGatewayDatabase(":memory:");
    service = new PairingService({
      database,
      pepper: "test-pepper-with-at-least-thirty-two-characters",
      ttlMs: 300_000,
      now: () => new Date("2026-07-15T00:00:00.000Z"),
      randomBytes: (size) => Buffer.alloc(size, 3),
    });
  });

  afterEach(() => database.close());

  it("exchanges a one-time code for one active high-entropy token", () => {
    const code = service.createCode();
    const token = service.pair(code);

    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{12}$/);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(service.isTokenActive(token)).toBe(true);
    expect(() => service.pair(code)).toThrow(PairingError);
  });

  it("rejects an expired code", () => {
    const code = service.createCode();
    service.setClockForTest(() => new Date("2026-07-15T00:06:00.000Z"));

    expect(() => service.pair(code)).toThrowError("pairing code expired");
  });
});
```

```ts
// apps/gateway/src/routes/pairing.test.ts
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { openGatewayDatabase } from "../db/database.js";
import { registerPairingRoutes } from "./pairing.js";
import { PairingService } from "../security/pairing-service.js";

describe("POST /pte/v1/pair", () => {
  let app: FastifyInstance;
  let database: Database.Database;
  let pairing: PairingService;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    database = openGatewayDatabase(":memory:");
    pairing = new PairingService({
      database,
      pepper: "test-pepper-with-at-least-thirty-two-characters",
      ttlMs: 300_000,
      now: () => new Date("2026-07-15T00:00:00.000Z"),
      randomBytes: (size) => Buffer.alloc(size, 4),
    });
    await registerPairingRoutes(app, pairing);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    database.close();
  });

  it("returns the long-term token exactly once", async () => {
    const code = pairing.createCode();
    const first = await app.inject({
      method: "POST",
      url: "/pte/v1/pair",
      payload: { code, client: "pte-pilot-extension" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/pte/v1/pair",
      payload: { code, client: "pte-pilot-extension" },
    });

    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ tokenType: "Bearer" });
    expect(second.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests and verify missing security modules**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/security/pairing-service.test.ts src/routes/pairing.test.ts
```

Expected: FAIL containing `Cannot find module './pairing-service.js'`.

- [ ] **Step 3: Implement secret generation and one-time pairing**

```ts
// apps/gateway/src/security/secrets.ts
import { createHash } from "node:crypto";

const PAIRING_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generatePairingCode(random: (size: number) => Buffer): string {
  const bytes = random(12);
  return Array.from(bytes, (value) => PAIRING_ALPHABET[value % PAIRING_ALPHABET.length]).join("");
}

export function generateBearerToken(random: (size: number) => Buffer): string {
  return random(32).toString("base64url");
}

export function hashSecret(value: string, pepper: string): string {
  return createHash("sha256").update(pepper, "utf8").update("\0").update(value, "utf8").digest("hex");
}
```

```ts
// apps/gateway/src/security/pairing-service.ts
import type Database from "better-sqlite3";
import { generateBearerToken, generatePairingCode, hashSecret } from "./secrets.js";

type PairingServiceOptions = {
  database: Database.Database;
  pepper: string;
  ttlMs: number;
  now: () => Date;
  randomBytes: (size: number) => Buffer;
};

export class PairingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PairingError";
  }
}

export class PairingService {
  private clock: () => Date;

  constructor(private readonly options: PairingServiceOptions) {
    this.clock = options.now;
  }

  setClockForTest(clock: () => Date): void {
    this.clock = clock;
  }

  createCode(): string {
    const code = generatePairingCode(this.options.randomBytes);
    const codeHash = hashSecret(code, this.options.pepper);
    const expiresAt = new Date(this.clock().getTime() + this.options.ttlMs).toISOString();
    this.options.database.prepare(
      "INSERT INTO pairing_codes(code_hash, expires_at, consumed_at) VALUES (?, ?, NULL)",
    ).run(codeHash, expiresAt);
    return code;
  }

  pair(code: string): string {
    const transaction = this.options.database.transaction((): string => {
      const now = this.clock();
      const codeHash = hashSecret(code, this.options.pepper);
      const row = this.options.database.prepare(`
        SELECT expires_at AS expiresAt, consumed_at AS consumedAt
        FROM pairing_codes WHERE code_hash = ?
      `).get(codeHash) as { expiresAt: string; consumedAt: string | null } | undefined;

      if (!row || row.consumedAt) {
        throw new PairingError("pairing code invalid or already consumed");
      }
      if (Date.parse(row.expiresAt) <= now.getTime()) {
        throw new PairingError("pairing code expired");
      }

      const token = generateBearerToken(this.options.randomBytes);
      const tokenHash = hashSecret(token, this.options.pepper);
      this.options.database.prepare(
        "UPDATE pairing_codes SET consumed_at = ? WHERE code_hash = ? AND consumed_at IS NULL",
      ).run(now.toISOString(), codeHash);
      this.options.database.prepare(
        "INSERT INTO gateway_tokens(token_hash, issued_at, revoked_at) VALUES (?, ?, NULL)",
      ).run(tokenHash, now.toISOString());
      return token;
    });
    return transaction.immediate();
  }

  isTokenActive(token: string): boolean {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return false;
    }
    const tokenHash = hashSecret(token, this.options.pepper);
    const row = this.options.database.prepare(
      "SELECT 1 AS active FROM gateway_tokens WHERE token_hash = ? AND revoked_at IS NULL",
    ).get(tokenHash) as { active: 1 } | undefined;
    return row?.active === 1;
  }
}
```

- [ ] **Step 4: Implement auth, Origin guard, pairing route, and CLI**

```ts
// apps/gateway/src/security/auth.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import type { PairingService } from "./pairing-service.js";

export function authenticateBearer(pairing: PairingService) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> => {
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
    if (!match || !pairing.isTokenActive(match[1]!)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  };
}
```

```ts
// apps/gateway/src/security/origin-guard.ts
import type { FastifyInstance } from "fastify";

export async function registerOriginGuard(
  app: FastifyInstance,
  allowedOrigin: string,
): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && origin !== allowedOrigin) {
      await reply.code(403).send({ error: "origin_rejected" });
      return;
    }
    if (origin === allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
      reply.header("Access-Control-Allow-Headers", "authorization,content-type,idempotency-key");
      reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      reply.header("Vary", "Origin");
    }
    if (request.method === "OPTIONS") {
      await reply.code(204).send();
    }
  });
}
```

```ts
// apps/gateway/src/routes/pairing.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PairingError, type PairingService } from "../security/pairing-service.js";

const PairRequestSchema = z.object({
  code: z.string().regex(/^[2-9A-HJ-NP-Z]{12}$/),
  client: z.literal("pte-pilot-extension"),
});

export async function registerPairingRoutes(
  app: FastifyInstance,
  pairing: PairingService,
): Promise<void> {
  app.post("/pte/v1/pair", async (request, reply) => {
    const parsed = PairRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_pair_request" });
    }
    try {
      const token = pairing.pair(parsed.data.code);
      return reply.send({
        token,
        tokenType: "Bearer",
        issuedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof PairingError) {
        return reply.code(401).send({ error: "pairing_rejected" });
      }
      throw error;
    }
  });
}
```

```ts
// apps/gateway/src/cli/create-pairing-code.ts
import { loadGatewayConfig } from "../config.js";
import { openGatewayDatabase } from "../db/database.js";
import { PairingService } from "../security/pairing-service.js";

const config = loadGatewayConfig();
const database = openGatewayDatabase(config.dbPath);
try {
  const pairing = new PairingService({
    database,
    pepper: config.tokenPepper,
    ttlMs: config.pairingCodeTtlMs,
    now: config.now,
    randomBytes: config.randomBytes,
  });
  process.stdout.write(`${pairing.createCode()}\n`);
} finally {
  database.close();
}
```

- [ ] **Step 5: Wire security into the server factory**

```ts
// apps/gateway/src/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";
import { openGatewayDatabase } from "./db/database.js";
import { registerPairingRoutes } from "./routes/pairing.js";
import { registerOriginGuard } from "./security/origin-guard.js";
import { PairingService } from "./security/pairing-service.js";

export async function createGatewayServer(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });
  const database = openGatewayDatabase(config.dbPath);
  const pairing = new PairingService({
    database,
    pepper: config.tokenPepper,
    ttlMs: config.pairingCodeTtlMs,
    now: config.now,
    randomBytes: config.randomBytes,
  });

  await registerOriginGuard(app, config.allowedExtensionOrigin);
  await registerPairingRoutes(app, pairing);
  app.addHook("onClose", async () => database.close());
  await app.ready();
  return app;
}
```

- [ ] **Step 6: Run pairing, security, and server tests**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/security/pairing-service.test.ts src/routes/pairing.test.ts src/server.test.ts
pnpm --filter @pte-pilot/gateway typecheck
```

Expected: four passing tests; wrong or reused codes rejected; server remains injectable.

- [ ] **Step 7: Commit pairing boundary**

```powershell
git add apps/gateway/src/security apps/gateway/src/routes/pairing.ts apps/gateway/src/cli apps/gateway/src/server.ts
git commit -m "feat(gateway): add one-time extension pairing"
```

Expected: one commit with no token, pairing code, or `.env` file staged.

---

### Task 4: Authenticated Batch Upsert Endpoint

**Files:**
- Create: `apps/gateway/src/routes/events.ts`
- Modify: `apps/gateway/src/server.ts`
- Test: `apps/gateway/src/routes/events.test.ts`

**Interfaces:**
- Consumes: `BatchUpsertRequestSchema`, `BatchUpsertResponseSchema`, `AttemptProjection`, `authenticateBearer`.
- Produces: `POST /pte/v1/events:batchUpsert` with durable receipt semantics.

- [ ] **Step 1: Write failing route tests**

```ts
// apps/gateway/src/routes/events.test.ts
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import type { BatchUpsertRequest } from "@pte-pilot/contracts";
import { openGatewayDatabase } from "../db/database.js";
import { AttemptProjection } from "../projection/attempt-projection.js";
import { PairingService } from "../security/pairing-service.js";
import { registerEventRoutes } from "./events.js";

const body: BatchUpsertRequest = {
  batchId: "11111111-1111-4111-8111-111111111111",
  events: [{
    attemptId: "22222222-2222-4222-8222-222222222222",
    questionId: "131020",
    accuracy: 0.8,
    durationMs: 12_500,
    replayCount: 2,
    errors: [{ expected: "postponed", actual: "postpond", type: "spelling" }],
    completedAt: "2026-07-15T00:00:00.000Z",
  }],
};

describe("POST /pte/v1/events:batchUpsert", () => {
  let app: ReturnType<typeof Fastify>;
  let database: Database.Database;
  let token: string;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    database = openGatewayDatabase(":memory:");
    const pairing = new PairingService({
      database,
      pepper: "test-pepper-with-at-least-thirty-two-characters",
      ttlMs: 300_000,
      now: () => new Date("2026-07-15T00:00:00.000Z"),
      randomBytes: (size) => Buffer.alloc(size, 5),
    });
    token = pairing.pair(pairing.createCode());
    await registerEventRoutes(app, new AttemptProjection(database), pairing);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    database.close();
  });

  it("requires bearer auth and matching Idempotency-Key", async () => {
    const unauthenticated = await app.inject({
      method: "POST",
      url: "/pte/v1/events:batchUpsert",
      headers: { "idempotency-key": body.batchId },
      payload: body,
    });
    const wrongKey = await app.inject({
      method: "POST",
      url: "/pte/v1/events:batchUpsert",
      headers: { authorization: `Bearer ${token}`, "idempotency-key": "wrong" },
      payload: body,
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(wrongKey.statusCode).toBe(400);
  });

  it("returns the same receipt across one hundred retries", async () => {
    const receipts = [];
    for (let index = 0; index < 100; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/pte/v1/events:batchUpsert",
        headers: { authorization: `Bearer ${token}`, "idempotency-key": body.batchId },
        payload: body,
      });
      expect(response.statusCode).toBe(200);
      receipts.push(response.json());
    }
    expect(new Set(receipts.map(JSON.stringify)).size).toBe(1);
    expect(receipts[0]).toMatchObject({ projectionInstanceId: expect.any(String) });
  });
});
```

- [ ] **Step 2: Run route tests and verify missing route module**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/routes/events.test.ts
```

Expected: FAIL containing `Cannot find module './events.js'`.

- [ ] **Step 3: Implement strict authenticated event route**

```ts
// apps/gateway/src/routes/events.ts
import type { FastifyInstance } from "fastify";
import { BatchUpsertRequestSchema, BatchUpsertResponseSchema } from "@pte-pilot/contracts";
import { ProjectionConflictError, type AttemptProjection } from "../projection/attempt-projection.js";
import { authenticateBearer } from "../security/auth.js";
import type { PairingService } from "../security/pairing-service.js";

export async function registerEventRoutes(
  app: FastifyInstance,
  projection: AttemptProjection,
  pairing: PairingService,
  onCommitted: () => void = () => undefined,
): Promise<void> {
  app.post(
    "/pte/v1/events:batchUpsert",
    { preHandler: authenticateBearer(pairing) },
    async (request, reply) => {
      const parsed = BatchUpsertRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_batch" });
      }
      if (request.headers["idempotency-key"] !== parsed.data.batchId) {
        return reply.code(400).send({ error: "idempotency_key_mismatch" });
      }
      try {
        const response = BatchUpsertResponseSchema.parse(projection.upsertBatch(parsed.data));
        onCommitted();
        return reply.send(response);
      } catch (error) {
        if (error instanceof ProjectionConflictError) {
          return reply.code(409).send({ error: "immutable_event_conflict" });
        }
        throw error;
      }
    },
  );
}
```

- [ ] **Step 4: Register projection and event route in server factory**

Replace `apps/gateway/src/server.ts` with:

```ts
import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";
import { openGatewayDatabase } from "./db/database.js";
import { AttemptProjection } from "./projection/attempt-projection.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerPairingRoutes } from "./routes/pairing.js";
import { registerOriginGuard } from "./security/origin-guard.js";
import { PairingService } from "./security/pairing-service.js";

export async function createGatewayServer(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });
  const database = openGatewayDatabase(config.dbPath);
  const projection = new AttemptProjection(database);
  const pairing = new PairingService({
    database,
    pepper: config.tokenPepper,
    ttlMs: config.pairingCodeTtlMs,
    now: config.now,
    randomBytes: config.randomBytes,
  });

  await registerOriginGuard(app, config.allowedExtensionOrigin);
  await registerPairingRoutes(app, pairing);
  await registerEventRoutes(app, projection, pairing);
  app.addHook("onClose", async () => database.close());
  await app.ready();
  return app;
}
```

- [ ] **Step 5: Run endpoint, projection, and type tests**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/routes/events.test.ts src/projection/attempt-projection.test.ts
pnpm --filter @pte-pilot/gateway typecheck
```

Expected: five passing tests; 100 retries produce one immutable row and one stable receipt carrying the database's projection instance UUID.

- [ ] **Step 6: Commit deterministic event ingestion**

```powershell
git add apps/gateway/src/routes/events.ts apps/gateway/src/routes/events.test.ts apps/gateway/src/server.ts
git commit -m "feat(gateway): expose transactional event ingestion"
```

Expected: one commit; event response comes only from SQLite transaction result.

---

### Task 5: Private Hermes Client and Runtime Identity Health

**Files:**
- Modify: `apps/gateway/src/hermes/hermes-client.ts`
- Create: `apps/gateway/src/routes/health.ts`
- Modify: `apps/gateway/src/server.ts`
- Test: `apps/gateway/src/hermes/hermes-client.test.ts`
- Test: `apps/gateway/src/routes/health.test.ts`

**Interfaces:**
- Consumes: `GatewayConfig`, `GatewayHealthSchema`, `AttemptProjection`.
- Produces: `createHttpHermesClient(options): HermesClient`, `GET /pte/v1/health`, strict `HermesRuntimeAudit`.

- [ ] **Step 1: Write failing Hermes client and health tests**

```ts
// apps/gateway/src/hermes/hermes-client.test.ts
import { describe, expect, it, vi } from "vitest";
import { createHttpHermesClient } from "./hermes-client.js";

const jsonResponse = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

describe("HttpHermesClient.audit", () => {
  it("accepts only pte-pilot with exactly the memory tool", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "pte-pilot" }] }))
      .mockResolvedValueOnce(jsonResponse({
        object: "list",
        platform: "api_server",
        data: [{ name: "memory", enabled: true, configured: true, tools: ["memory"] }],
      }));
    const client = createHttpHermesClient({
      baseUrl: "http://127.0.0.1:8643",
      apiKey: "test-hermes-key-with-at-least-thirty-two-characters",
      expectedModel: "pte-pilot",
      timeoutMs: 1_500,
      configPath: ":test:",
      fetchImplementation,
      readToolPolicy: async () => ["memory", "no_mcp"],
    });

    await expect(client.audit()).resolves.toEqual({
      status: "ready",
      model: "pte-pilot",
      enabledTools: ["memory"],
      unexpectedTools: [],
    });
  });

  it("rejects any extra enabled tool", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "pte-pilot" }] }))
      .mockResolvedValueOnce(jsonResponse({
        object: "list",
        platform: "api_server",
        data: [
          { name: "memory", enabled: true, configured: true, tools: ["memory"] },
          { name: "terminal", enabled: true, configured: true, tools: ["terminal", "process"] },
        ],
      }));
    const client = createHttpHermesClient({
      baseUrl: "http://127.0.0.1:8643",
      apiKey: "test-hermes-key-with-at-least-thirty-two-characters",
      expectedModel: "pte-pilot",
      timeoutMs: 1_500,
      configPath: ":test:",
      fetchImplementation,
      readToolPolicy: async () => ["memory", "no_mcp"],
    });

    await expect(client.audit()).resolves.toMatchObject({
      status: "rejected",
      unexpectedTools: ["process", "terminal"],
    });
  });

  it("rejects missing no_mcp even when /v1/toolsets reports memory only", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "pte-pilot" }] }))
      .mockResolvedValueOnce(jsonResponse({
        object: "list",
        platform: "api_server",
        data: [{ name: "memory", enabled: true, configured: true, tools: ["memory"] }],
      }));
    const client = createHttpHermesClient({
      baseUrl: "http://127.0.0.1:8643",
      apiKey: "test-hermes-key-with-at-least-thirty-two-characters",
      expectedModel: "pte-pilot",
      timeoutMs: 1_500,
      configPath: ":test:",
      fetchImplementation,
      readToolPolicy: async () => ["memory"],
    });

    await expect(client.audit()).resolves.toMatchObject({
      status: "rejected",
      unexpectedTools: ["mcp-policy"],
    });
  });
});
```

```ts
// apps/gateway/src/routes/health.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createGatewayServer } from "../server.js";
import { makeTestConfig, readyHermesClient } from "../test/make-test-config.js";

describe("GET /pte/v1/health", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => app?.close());

  it("identifies the exact ready service and profile", async () => {
    app = await createGatewayServer(makeTestConfig({ hermesClient: readyHermesClient }));
    const response = await app.inject({ method: "GET", url: "/pte/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: "pte-pilot",
      status: "ready",
      profile: "pte-pilot",
      schemaVersion: 1,
      projectionInstanceId: expect.any(String),
      projectionVersion: 0,
      capabilities: ["events:batchUpsert", "rank", "pair"],
      hermes: {
        status: "ready",
        model: "pte-pilot",
        enabledTools: ["memory"],
        unexpectedTools: [],
      },
    });
  });

  it("stays alive but degraded when Hermes is offline", async () => {
    app = await createGatewayServer(makeTestConfig({
      hermesClient: {
        ...readyHermesClient,
        audit: async () => ({
          status: "offline",
          model: null,
          enabledTools: [],
          unexpectedTools: [],
        }),
      },
    }));
    const response = await app.inject({ method: "GET", url: "/pte/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "degraded", hermes: { status: "offline" } });
  });
});
```

- [ ] **Step 2: Run tests and verify missing audit implementation and route**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/hermes/hermes-client.test.ts src/routes/health.test.ts
```

Expected: FAIL because `createHttpHermesClient` throws and health route returns 404.

- [ ] **Step 3: Implement private loopback Hermes client**

Replace `apps/gateway/src/hermes/hermes-client.ts` with:

```ts
import { readFile } from "node:fs/promises";
import type { RankRequest } from "@pte-pilot/contracts";
import { z } from "zod";

export type HermesRuntimeAudit = {
  status: "ready" | "offline" | "rejected";
  model: string | null;
  enabledTools: string[];
  unexpectedTools: string[];
};

export type CompactLearningProfile = {
  projectionVersion: number;
  totalAttempts: number;
  meanAccuracy: number;
  meanReplayCount: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  weakWords: Array<{ word: string; count: number }>;
};

export interface HermesClient {
  audit(): Promise<HermesRuntimeAudit>;
  rank(request: RankRequest): Promise<unknown>;
  syncMemory(profile: CompactLearningProfile): Promise<void>;
}

type HttpHermesClientOptions = {
  baseUrl: string;
  apiKey: string;
  expectedModel: "pte-pilot";
  timeoutMs: number;
  fetchImplementation?: typeof fetch;
  configPath: string;
  readToolPolicy?: () => Promise<readonly string[]>;
};

const ModelsSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});
const ToolsetsSchema = z.object({
  object: z.literal("list"),
  platform: z.literal("api_server"),
  data: z.array(z.object({
    name: z.string(),
    enabled: z.boolean(),
    configured: z.boolean(),
    tools: z.array(z.string()),
  })),
});
const ResponsesSchema = z.object({
  output: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  }).passthrough()),
});

function extractOutputText(value: unknown): string {
  const response = ResponsesSchema.parse(value);
  const parts = response.output.flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text!);
  if (parts.length !== 1) {
    throw new Error("Hermes returned an ambiguous text response");
  }
  return parts[0]!;
}

export function parseHermesApiToolPolicy(source: string): string[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const roots = lines.flatMap((line, index) => line === "platform_toolsets:" ? [index] : []);
  if (roots.length !== 1) throw new Error("Hermes platform_toolsets must appear exactly once");
  const root = roots[0]!;
  let end = root + 1;
  while (end < lines.length && (lines[end] === "" || /^\s/.test(lines[end]!))) end += 1;
  const block = lines.slice(root + 1, end);
  const apiIndexes = block.flatMap((line, index) => line === "  api_server:" ? [index] : []);
  if (apiIndexes.length !== 1) throw new Error("Hermes api_server tool policy must appear exactly once");
  const values: string[] = [];
  for (const line of block.slice(apiIndexes[0]! + 1)) {
    if (line === "" || /^ {4}- /.test(line)) {
      const match = /^ {4}- ([a-z0-9_-]+)$/.exec(line);
      if (match) values.push(match[1]!);
      continue;
    }
    if (/^ {2}\S/.test(line)) break;
    throw new Error("Hermes api_server policy uses an unsupported YAML shape");
  }
  return values;
}

export async function readHermesApiToolPolicy(configPath: string): Promise<string[]> {
  return parseHermesApiToolPolicy(await readFile(configPath, "utf8"));
}

export function createHttpHermesClient(options: HttpHermesClientOptions): HermesClient {
  const request = options.fetchImplementation ?? fetch;
  const headers = {
    Authorization: `Bearer ${options.apiKey}`,
    "Content-Type": "application/json",
    "X-Hermes-Session-Key": "pte-pilot:local:v1",
  };

  const getJson = async (path: string): Promise<unknown> => {
    const response = await request(`${options.baseUrl}${path}`, {
      headers,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Hermes ${path} failed with ${response.status}`);
    }
    return response.json();
  };

  const postResponse = async (instructions: string, input: unknown): Promise<unknown> => {
    const response = await request(`${options.baseUrl}/v1/responses`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(options.timeoutMs),
      body: JSON.stringify({
        model: options.expectedModel,
        store: false,
        instructions,
        input: JSON.stringify(input),
      }),
    });
    if (!response.ok) {
      throw new Error(`Hermes response failed with ${response.status}`);
    }
    return response.json();
  };

  return {
    async audit(): Promise<HermesRuntimeAudit> {
      try {
        const [modelsValue, toolsetsValue] = await Promise.all([
          getJson("/v1/models"),
          getJson("/v1/toolsets"),
        ]);
        const models = ModelsSchema.parse(modelsValue);
        const toolsets = ToolsetsSchema.parse(toolsetsValue).data;
        const configuredPolicy = [...await (
          options.readToolPolicy ?? (() => readHermesApiToolPolicy(options.configPath))
        )()].sort();
        const model = models.data[0]?.id ?? null;
        const enabledTools = [...new Set(
          toolsets.filter(({ enabled, configured }) => enabled && configured)
            .flatMap(({ tools }) => tools),
        )].sort();
        const unexpectedTools = [
          ...enabledTools.filter((tool) => tool !== "memory"),
          ...(configuredPolicy.length === 2 && configuredPolicy[0] === "memory" && configuredPolicy[1] === "no_mcp"
            ? []
            : ["mcp-policy"]),
        ].sort();
        const ready = model === options.expectedModel
          && enabledTools.length === 1
          && enabledTools[0] === "memory"
          && unexpectedTools.length === 0;
        return {
          status: ready ? "ready" : "rejected",
          model,
          enabledTools,
          unexpectedTools,
        };
      } catch {
        return {
          status: "offline",
          model: null,
          enabledTools: [],
          unexpectedTools: [],
        };
      }
    },

    async rank(rankRequest: RankRequest): Promise<unknown> {
      const value = await postResponse(
        "Return exactly one JSON object matching the supplied decision fields. Do not call tools. Do not add prose. Rank only supplied questionId values.",
        rankRequest,
      );
      return JSON.parse(extractOutputText(value));
    },

    async syncMemory(profile: CompactLearningProfile): Promise<void> {
      const value = await postResponse(
        "Use only the memory tool. Maintain exactly one memory entry beginning PTE_PILOT_PROFILE_V1. Replace the old entry with a compressed profile derived only from supplied aggregates. Never save full sentences, actual spellings, audio URLs, credentials, or raw events. End with MEMORY_SYNCED.",
        profile,
      );
      if (extractOutputText(value).trim() !== "MEMORY_SYNCED") {
        throw new Error("Hermes did not confirm bounded memory refresh");
      }
    },
  };
}
```

- [ ] **Step 4: Implement public identity health route**

```ts
// apps/gateway/src/routes/health.ts
import type { FastifyInstance } from "fastify";
import { GatewayHealthSchema, type GatewayHealth } from "@pte-pilot/contracts";
import type { HermesClient } from "../hermes/hermes-client.js";
import type { AttemptProjection } from "../projection/attempt-projection.js";

export async function registerHealthRoute(
  app: FastifyInstance,
  projection: AttemptProjection,
  hermes: HermesClient,
): Promise<void> {
  app.get("/pte/v1/health", async (_request, reply) => {
    const audit = await hermes.audit();
    const identity = projection.getProjectionIdentity();
    const health: GatewayHealth = {
      service: "pte-pilot",
      status: audit.status === "ready" ? "ready" : "degraded",
      profile: "pte-pilot",
      schemaVersion: 1,
      projectionInstanceId: identity.projectionInstanceId,
      projectionVersion: identity.projectionVersion,
      capabilities: ["events:batchUpsert", "rank", "pair"],
      hermes: audit,
    };
    return reply.send(GatewayHealthSchema.parse(health));
  });
}
```

- [ ] **Step 5: Wire injected or HTTP Hermes client into server**

Replace `apps/gateway/src/server.ts` with:

```ts
import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";
import { openGatewayDatabase } from "./db/database.js";
import { createHttpHermesClient } from "./hermes/hermes-client.js";
import { AttemptProjection } from "./projection/attempt-projection.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerPairingRoutes } from "./routes/pairing.js";
import { registerOriginGuard } from "./security/origin-guard.js";
import { PairingService } from "./security/pairing-service.js";

export async function createGatewayServer(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });
  const database = openGatewayDatabase(config.dbPath);
  const projection = new AttemptProjection(database);
  const pairing = new PairingService({
    database,
    pepper: config.tokenPepper,
    ttlMs: config.pairingCodeTtlMs,
    now: config.now,
    randomBytes: config.randomBytes,
  });
  const hermes = config.hermesClient ?? createHttpHermesClient({
    baseUrl: config.hermesBaseUrl,
    apiKey: config.hermesApiKey,
    expectedModel: config.hermesExpectedModel,
    timeoutMs: config.hermesTimeoutMs,
    configPath: config.hermesConfigPath,
  });

  await registerOriginGuard(app, config.allowedExtensionOrigin);
  await registerPairingRoutes(app, pairing);
  await registerEventRoutes(app, projection, pairing);
  await registerHealthRoute(app, projection, hermes);
  app.addHook("onClose", async () => database.close());
  await app.ready();
  return app;
}
```

- [ ] **Step 6: Run identity, route, and type tests**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/hermes/hermes-client.test.ts src/routes/health.test.ts
pnpm --filter @pte-pilot/gateway typecheck
```

Expected: five passing tests. The real Hermes `{ object, platform, data }` toolset envelope parses; wrong model, missing `no_mcp`, or any tool beyond `memory` yields `status: "degraded"` and `hermes.status: "rejected"`.

- [ ] **Step 7: Commit private Hermes identity boundary**

```powershell
git add apps/gateway/src/hermes apps/gateway/src/routes/health.ts apps/gateway/src/routes/health.test.ts apps/gateway/src/server.ts
git commit -m "feat(gateway): audit private Hermes identity"
```

Expected: one commit; Hermes key remains server-only and health reveals no credentials.

---

### Task 6: Versioned Ranking and Best-Effort Bounded Memory

**Files:**
- Create: `apps/gateway/src/ranking/rank-service.ts`
- Create: `apps/gateway/src/routes/rank.ts`
- Create: `apps/gateway/src/memory/memory-sync.ts`
- Modify: `apps/gateway/src/server.ts`
- Test: `apps/gateway/src/ranking/rank-service.test.ts`
- Test: `apps/gateway/src/memory/memory-sync.test.ts`

**Interfaces:**
- Consumes: `RankRequestSchema`, `RankResponseSchema`, `HermesClient`, `AttemptProjection`, bearer auth.
- Produces: `RankService.rank(request): Promise<RankResponse>`, `POST /pte/v1/rank`, `MemorySyncCoordinator.start()`, `kick()`, `stop()`, `flush()`.

- [ ] **Step 1: Write failing rank freshness and memory isolation tests**

```ts
// apps/gateway/src/ranking/rank-service.test.ts
import { describe, expect, it } from "vitest";
import type { RankRequest } from "@pte-pilot/contracts";
import type { HermesClient } from "../hermes/hermes-client.js";
import { RankResponseRejectedError, RankService } from "./rank-service.js";

const request: RankRequest = {
  decisionId: "11111111-1111-4111-8111-111111111111",
  candidateSetHash: `sha256:${"a".repeat(64)}`,
  learnerStateVersion: 42,
  candidates: [
    {
      questionId: "131020",
      dueScore: 0.9,
      weaknessScore: 0.8,
      noveltyScore: 0.1,
      marked: false,
      attemptCount: 3,
      lastAttemptAt: "2026-07-14T00:00:00.000Z",
    },
    {
      questionId: "131021",
      dueScore: 0.5,
      weaknessScore: 0.4,
      noveltyScore: 0.7,
      marked: true,
      attemptCount: 1,
      lastAttemptAt: null,
    },
  ],
};

const clientWith = (response: unknown): HermesClient => ({
  audit: async () => ({
    status: "ready",
    model: "pte-pilot",
    enabledTools: ["memory"],
    unexpectedTools: [],
  }),
  rank: async () => response,
  syncMemory: async () => undefined,
});

describe("RankService", () => {
  it("accepts a full permutation with exact freshness echoes", async () => {
    const service = new RankService(clientWith({
      decisionId: request.decisionId,
      candidateSetHash: request.candidateSetHash,
      learnerStateVersion: request.learnerStateVersion,
      rankedQuestionIds: ["131021", "131020"],
    }));

    await expect(service.rank(request)).resolves.toMatchObject({
      rankedQuestionIds: ["131021", "131020"],
    });
  });

  it.each([
    { decisionId: "22222222-2222-4222-8222-222222222222" },
    { candidateSetHash: `sha256:${"b".repeat(64)}` },
    { learnerStateVersion: 41 },
    { rankedQuestionIds: ["131020", "999999"] },
    { rankedQuestionIds: ["131020", "131020"] },
  ])("rejects stale or non-permutation output %#", async (change) => {
    const service = new RankService(clientWith({
      decisionId: request.decisionId,
      candidateSetHash: request.candidateSetHash,
      learnerStateVersion: request.learnerStateVersion,
      rankedQuestionIds: ["131021", "131020"],
      ...change,
    }));

    await expect(service.rank(request)).rejects.toBeInstanceOf(RankResponseRejectedError);
  });
});
```

```ts
// apps/gateway/src/memory/memory-sync.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import type { BatchUpsertRequest } from "@pte-pilot/contracts";
import { openGatewayDatabase } from "../db/database.js";
import type { HermesClient } from "../hermes/hermes-client.js";
import { AttemptProjection } from "../projection/attempt-projection.js";
import { MemorySyncCoordinator } from "./memory-sync.js";

const request: BatchUpsertRequest = {
  batchId: "11111111-1111-4111-8111-111111111111",
  events: [{
    attemptId: "22222222-2222-4222-8222-222222222222",
    questionId: "131020",
    accuracy: 0.8,
    durationMs: 12_500,
    replayCount: 2,
    errors: [{ expected: "postponed", actual: "postpond", type: "spelling" }],
    completedAt: "2026-07-15T00:00:00.000Z",
  }],
};

describe("MemorySyncCoordinator", () => {
  let database: Database.Database;
  let projection: AttemptProjection;

  beforeEach(() => {
    database = openGatewayDatabase(":memory:");
    projection = new AttemptProjection(database);
    projection.upsertBatch(request);
  });

  afterEach(() => database.close());

  it("advances memory state only after successful bounded sync", async () => {
    const syncMemory = vi.fn().mockResolvedValue(undefined);
    const client: HermesClient = {
      audit: async () => ({ status: "ready", model: "pte-pilot", enabledTools: ["memory"], unexpectedTools: [] }),
      rank: async () => ({}),
      syncMemory,
    };
    const coordinator = new MemorySyncCoordinator(projection, client, 30_000);

    await coordinator.flush();

    expect(syncMemory).toHaveBeenCalledWith({
      projectionVersion: 1,
      totalAttempts: 1,
      meanAccuracy: 0.8,
      meanReplayCount: 2,
      topErrorTypes: [{ type: "spelling", count: 1 }],
      weakWords: [{ word: "postponed", count: 1 }],
    });
    expect(projection.getMemorySyncState()).toEqual({ targetVersion: 1, syncedVersion: 1 });
  });

  it("leaves projection acknowledgement intact when Hermes fails", async () => {
    const client: HermesClient = {
      audit: async () => ({ status: "offline", model: null, enabledTools: [], unexpectedTools: [] }),
      rank: async () => ({}),
      syncMemory: async () => { throw new Error("offline"); },
    };
    const coordinator = new MemorySyncCoordinator(projection, client, 30_000);

    await coordinator.flush();

    expect(projection.getProjectionVersion()).toBe(1);
    expect(projection.getMemorySyncState()).toEqual({ targetVersion: 1, syncedVersion: 0 });
  });
});
```

- [ ] **Step 2: Run tests and verify missing rank and memory modules**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/ranking/rank-service.test.ts src/memory/memory-sync.test.ts
```

Expected: FAIL containing `Cannot find module './rank-service.js'`.

- [ ] **Step 3: Implement strict rank service and protected route**

```ts
// apps/gateway/src/ranking/rank-service.ts
import {
  RankResponseSchema,
  type RankRequest,
  type RankResponse,
} from "@pte-pilot/contracts";
import type { HermesClient } from "../hermes/hermes-client.js";

export class HermesUnavailableError extends Error {
  constructor() {
    super("Hermes is not ready");
    this.name = "HermesUnavailableError";
  }
}

export class RankResponseRejectedError extends Error {
  constructor() {
    super("Hermes ranking response rejected");
    this.name = "RankResponseRejectedError";
  }
}

export class RankService {
  constructor(private readonly hermes: HermesClient) {}

  async rank(request: RankRequest): Promise<RankResponse> {
    const audit = await this.hermes.audit().catch(() => ({
      status: "offline" as const,
      model: null,
      enabledTools: [],
      unexpectedTools: [],
    }));
    if (audit.status !== "ready") {
      throw new HermesUnavailableError();
    }
    const parsed = RankResponseSchema.safeParse(await this.hermes.rank(request));
    if (!parsed.success) {
      throw new RankResponseRejectedError();
    }
    const response = parsed.data;
    const candidateIds = request.candidates.map(({ questionId }) => questionId);
    const candidateSet = new Set(candidateIds);
    const rankedSet = new Set(response.rankedQuestionIds);
    const valid = response.decisionId === request.decisionId
      && response.candidateSetHash === request.candidateSetHash
      && response.learnerStateVersion === request.learnerStateVersion
      && response.rankedQuestionIds.length === candidateIds.length
      && rankedSet.size === candidateSet.size
      && response.rankedQuestionIds.every((questionId) => candidateSet.has(questionId));
    if (!valid) {
      throw new RankResponseRejectedError();
    }
    return response;
  }
}
```

```ts
// apps/gateway/src/routes/rank.ts
import type { FastifyInstance } from "fastify";
import { RankRequestSchema } from "@pte-pilot/contracts";
import {
  HermesUnavailableError,
  RankResponseRejectedError,
  type RankService,
} from "../ranking/rank-service.js";
import { authenticateBearer } from "../security/auth.js";
import type { PairingService } from "../security/pairing-service.js";

export async function registerRankRoute(
  app: FastifyInstance,
  ranking: RankService,
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
      try {
        return reply.send(await ranking.rank(parsed.data));
      } catch (error) {
        if (error instanceof HermesUnavailableError) {
          return reply.code(503).send({ error: "hermes_unavailable" });
        }
        if (error instanceof RankResponseRejectedError) {
          return reply.code(502).send({ error: "rank_response_rejected" });
        }
        throw error;
      }
    },
  );
}
```

- [ ] **Step 4: Implement non-blocking memory coordinator**

```ts
// apps/gateway/src/memory/memory-sync.ts
import type { HermesClient } from "../hermes/hermes-client.js";
import type { AttemptProjection } from "../projection/attempt-projection.js";

export class MemorySyncCoordinator {
  private timer: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;

  constructor(
    private readonly projection: AttemptProjection,
    private readonly hermes: HermesClient,
    private readonly intervalMs: number,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.kick(), this.intervalMs);
    this.timer.unref();
  }

  kick(): void {
    if (this.running) return;
    this.running = this.flush()
      .catch((error) => {
        const message = error instanceof Error ? error.message : "unknown memory sync error";
        this.projection.markMemorySyncFailed(message);
      })
      .finally(() => {
        this.running = undefined;
      });
  }

  async flush(): Promise<void> {
    const state = this.projection.getMemorySyncState();
    if (state.targetVersion <= state.syncedVersion) return;
    const audit = await this.hermes.audit();
    if (audit.status !== "ready") {
      this.projection.markMemorySyncFailed(`Hermes ${audit.status}`);
      return;
    }
    const profile = this.projection.getCompactLearningProfile();
    try {
      await this.hermes.syncMemory(profile);
      this.projection.markMemorySynced(profile.projectionVersion);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown memory sync error";
      this.projection.markMemorySyncFailed(message);
    }
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.running;
  }
}
```

- [ ] **Step 5: Wire rank and memory without coupling them to event acknowledgements**

Replace `apps/gateway/src/server.ts` with:

```ts
import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./config.js";
import { openGatewayDatabase } from "./db/database.js";
import { createHttpHermesClient } from "./hermes/hermes-client.js";
import { MemorySyncCoordinator } from "./memory/memory-sync.js";
import { AttemptProjection } from "./projection/attempt-projection.js";
import { RankService } from "./ranking/rank-service.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerPairingRoutes } from "./routes/pairing.js";
import { registerRankRoute } from "./routes/rank.js";
import { registerOriginGuard } from "./security/origin-guard.js";
import { PairingService } from "./security/pairing-service.js";

export async function createGatewayServer(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.logger });
  const database = openGatewayDatabase(config.dbPath);
  const projection = new AttemptProjection(database);
  const pairing = new PairingService({
    database,
    pepper: config.tokenPepper,
    ttlMs: config.pairingCodeTtlMs,
    now: config.now,
    randomBytes: config.randomBytes,
  });
  const hermes = config.hermesClient ?? createHttpHermesClient({
    baseUrl: config.hermesBaseUrl,
    apiKey: config.hermesApiKey,
    expectedModel: config.hermesExpectedModel,
    timeoutMs: config.hermesTimeoutMs,
    configPath: config.hermesConfigPath,
  });
  const memory = new MemorySyncCoordinator(projection, hermes, config.memorySyncIntervalMs);
  const ranking = new RankService(hermes);

  await registerOriginGuard(app, config.allowedExtensionOrigin);
  await registerPairingRoutes(app, pairing);
  await registerEventRoutes(app, projection, pairing, () => memory.kick());
  await registerHealthRoute(app, projection, hermes);
  await registerRankRoute(app, ranking, pairing);
  memory.start();
  app.addHook("onClose", async () => {
    await memory.stop();
    database.close();
  });
  await app.ready();
  return app;
}
```

- [ ] **Step 6: Run rank, memory, route, and type tests**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/ranking/rank-service.test.ts src/memory/memory-sync.test.ts src/routes/events.test.ts
pnpm --filter @pte-pilot/gateway typecheck
```

Expected: all listed rank, memory, and event-receipt cases pass; event receipt remains valid when Hermes is offline.

- [ ] **Step 7: Commit advisory Hermes behavior**

```powershell
git add apps/gateway/src/ranking apps/gateway/src/routes/rank.ts apps/gateway/src/memory apps/gateway/src/server.ts
git commit -m "feat(gateway): add bounded memory and safe ranking"
```

Expected: one commit; rank can fail without affecting SQLite or event acknowledgement.

---

### Task 7: Extension GatewayPort, Pairing, and Trusted Token Storage

**Files:**
- Create: `apps/extension/src/background/gateway/gateway-port.ts`
- Create: `apps/extension/src/background/gateway/gateway-settings.ts`
- Create: `apps/extension/src/background/gateway/gateway-client.ts`
- Test: `apps/extension/src/background/gateway/gateway-client.test.ts`

**Interfaces:**
- Consumes: all eight schemas/types exported by `@pte-pilot/contracts`; Chrome `storage` permission.
- Produces: exact public `GatewayPort`, background-only `GatewayPairingPort` and `EventProjectionClient`, `GatewaySettingsRepository`, `HttpGatewayClient`, `initializeTrustedGatewayStorage()`.

- [ ] **Step 1: Write failing Service Worker client tests**

```ts
// apps/extension/src/background/gateway/gateway-client.test.ts
import { describe, expect, it, vi } from "vitest";
import type { RankRequest } from "@pte-pilot/contracts";
import { HttpGatewayClient } from "./gateway-client.js";
import {
  GatewaySettingsRepository,
  initializeTrustedGatewayStorage,
  type TrustedStorageArea,
} from "./gateway-settings.js";

function createStorage(): TrustedStorageArea & { values: Record<string, unknown> } {
  const values: Record<string, unknown> = {};
  return {
    values,
    get: vi.fn(async (key: string) => ({ [key]: values[key] })),
    set: vi.fn(async (items: Record<string, unknown>) => Object.assign(values, items)),
    remove: vi.fn(async (key: string) => { delete values[key]; }),
    setAccessLevel: vi.fn(async () => undefined),
  };
}

const response = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

const validEvent = {
  attemptId: "22222222-2222-4222-8222-222222222222",
  questionId: "131020",
  accuracy: 0.8,
  durationMs: 12_500,
  replayCount: 2,
  errors: [{ expected: "postponed", actual: "postpond", type: "spelling" as const }],
  completedAt: "2026-07-15T00:00:00.000Z",
};

describe("HttpGatewayClient", () => {
  it("sets TRUSTED_CONTEXTS before storing a paired token", async () => {
    const storage = createStorage();
    await initializeTrustedGatewayStorage(storage);
    const settings = new GatewaySettingsRepository(storage);
    const fetchImplementation = vi.fn().mockResolvedValue(response({
      token: "a".repeat(43),
      tokenType: "Bearer",
      issuedAt: "2026-07-15T00:00:00.000Z",
    }));
    const client = new HttpGatewayClient(settings, fetchImplementation);

    await client.pair("23456789ABCD");

    expect(storage.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
    await expect(settings.load()).resolves.toMatchObject({ token: "a".repeat(43) });
  });

  it("uses bearer auth and Idempotency-Key only from Service Worker settings", async () => {
    const storage = createStorage();
    const settings = new GatewaySettingsRepository(storage);
    await settings.saveToken("b".repeat(43), "2026-07-15T00:00:00.000Z");
    const fetchImplementation = vi.fn().mockResolvedValue(response({
      batchId: "11111111-1111-4111-8111-111111111111",
      ackedAttemptIds: [validEvent.attemptId],
      projectionInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      projectionVersion: 1,
    }));
    const client = new HttpGatewayClient(settings, fetchImplementation);

    await client.batchUpsert({
      batchId: "11111111-1111-4111-8111-111111111111",
      events: [validEvent],
    });

    const init = fetchImplementation.mock.calls[0]![1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${"b".repeat(43)}`,
      "Idempotency-Key": "11111111-1111-4111-8111-111111111111",
    });
  });

  it("rejects a rank body that does not match shared schema", async () => {
    const storage = createStorage();
    const settings = new GatewaySettingsRepository(storage);
    await settings.saveToken("c".repeat(43), "2026-07-15T00:00:00.000Z");
    const fetchImplementation = vi.fn().mockResolvedValue(response({ rankedQuestionIds: ["131020"] }));
    const client = new HttpGatewayClient(settings, fetchImplementation);
    const rankRequest: RankRequest = {
      decisionId: "11111111-1111-4111-8111-111111111111",
      candidateSetHash: `sha256:${"a".repeat(64)}`,
      learnerStateVersion: 1,
      candidates: [{
        questionId: "131020",
        dueScore: 1,
        weaknessScore: 1,
        noveltyScore: 0,
        marked: false,
        attemptCount: 1,
        lastAttemptAt: null,
      }],
    };

    await expect(client.rank(rankRequest)).rejects.toThrow("invalid gateway response");
  });
});
```

- [ ] **Step 2: Run extension test and verify missing modules**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/gateway/gateway-client.test.ts
```

Expected: FAIL containing `Cannot find module './gateway-client.js'`.

- [ ] **Step 3: Define narrow port and trusted settings repository**

```ts
// apps/extension/src/background/gateway/gateway-port.ts
import type {
  BatchUpsertRequest,
  BatchUpsertResponse,
  GatewayHealth,
  RankRequest,
  RankResponse,
} from "@pte-pilot/contracts";

export interface GatewayPort {
  health(signal?: AbortSignal): Promise<GatewayHealth>;
  rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse>;
}

export interface GatewayPairingPort {
  pair(code: string, signal?: AbortSignal): Promise<void>;
}

export interface EventProjectionClient {
  batchUpsert(
    request: BatchUpsertRequest,
    signal?: AbortSignal,
  ): Promise<BatchUpsertResponse>;
}
```

```ts
// apps/extension/src/background/gateway/gateway-settings.ts
import { z } from "zod";

const SETTINGS_KEY = "pte.gateway.settings.v1";
const SettingsSchema = z.object({
  baseUrl: z.literal("http://127.0.0.1:8642"),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
  pairedAt: z.string().datetime().optional(),
});

export type GatewaySettings = z.infer<typeof SettingsSchema>;

export interface TrustedStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
  setAccessLevel(options: { accessLevel: "TRUSTED_CONTEXTS" }): Promise<void>;
}

export async function initializeTrustedGatewayStorage(
  storage: TrustedStorageArea = chrome.storage.local,
): Promise<void> {
  await storage.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
}

export class GatewaySettingsRepository {
  constructor(private readonly storage: TrustedStorageArea = chrome.storage.local) {}

  async load(): Promise<GatewaySettings> {
    const result = await this.storage.get(SETTINGS_KEY);
    return SettingsSchema.parse(result[SETTINGS_KEY] ?? {
      baseUrl: "http://127.0.0.1:8642",
    });
  }

  async saveToken(token: string, pairedAt: string): Promise<void> {
    const settings = SettingsSchema.parse({
      baseUrl: "http://127.0.0.1:8642",
      token,
      pairedAt,
    });
    await this.storage.set({ [SETTINGS_KEY]: settings });
  }

  async clearToken(): Promise<void> {
    await this.storage.set({
      [SETTINGS_KEY]: { baseUrl: "http://127.0.0.1:8642" },
    });
  }
}
```

- [ ] **Step 4: Implement schema-validated HTTP client**

```ts
// apps/extension/src/background/gateway/gateway-client.ts
import {
  BatchUpsertResponseSchema,
  BatchUpsertRequestSchema,
  GatewayHealthSchema,
  RankRequestSchema,
  RankResponseSchema,
  type BatchUpsertRequest,
  type BatchUpsertResponse,
  type GatewayHealth,
  type RankRequest,
  type RankResponse,
} from "@pte-pilot/contracts";
import { z } from "zod";
import type {
  EventProjectionClient,
  GatewayPairingPort,
  GatewayPort,
} from "./gateway-port.js";
import type { GatewaySettingsRepository } from "./gateway-settings.js";

const PairResponseSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  tokenType: z.literal("Bearer"),
  issuedAt: z.string().datetime(),
});

export class GatewayHttpError extends Error {
  constructor(readonly status: number) {
    super(`gateway request failed with ${status}`);
    this.name = "GatewayHttpError";
  }
}

export class HttpGatewayClient implements GatewayPort, GatewayPairingPort, EventProjectionClient {
  constructor(
    private readonly settings: GatewaySettingsRepository,
    private readonly request: typeof fetch = fetch,
  ) {}

  private async send(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    externalSignal?: AbortSignal,
  ): Promise<unknown> {
    const { baseUrl } = await this.settings.load();
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const response = await this.request(`${baseUrl}${path}`, {
      ...init,
      signal: externalSignal
        ? AbortSignal.any([externalSignal, timeoutSignal])
        : timeoutSignal,
    });
    if (!response.ok) throw new GatewayHttpError(response.status);
    return response.json();
  }

  private async authorization(): Promise<string> {
    const { token } = await this.settings.load();
    if (!token) throw new GatewayHttpError(401);
    return `Bearer ${token}`;
  }

  async health(signal?: AbortSignal): Promise<GatewayHealth> {
    const parsed = GatewayHealthSchema.safeParse(await this.send(
      "/pte/v1/health",
      { method: "GET" },
      2_500,
      signal,
    ));
    if (!parsed.success) throw new Error("invalid gateway response");
    return parsed.data;
  }

  async pair(code: string, signal?: AbortSignal): Promise<void> {
    const parsed = PairResponseSchema.safeParse(await this.send(
      "/pte/v1/pair",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, client: "pte-pilot-extension" }),
      },
      1_500,
      signal,
    ));
    if (!parsed.success) throw new Error("invalid gateway response");
    await this.settings.saveToken(parsed.data.token, parsed.data.issuedAt);
  }

  async batchUpsert(
    request: BatchUpsertRequest,
    signal?: AbortSignal,
  ): Promise<BatchUpsertResponse> {
    const validatedRequest = BatchUpsertRequestSchema.parse(request);
    const parsed = BatchUpsertResponseSchema.safeParse(await this.send(
      "/pte/v1/events:batchUpsert",
      {
        method: "POST",
        headers: {
          Authorization: await this.authorization(),
          "Content-Type": "application/json",
          "Idempotency-Key": validatedRequest.batchId,
        },
        body: JSON.stringify(validatedRequest),
      },
      2_000,
      signal,
    ));
    if (!parsed.success) throw new Error("invalid gateway response");
    return parsed.data;
  }

  async rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse> {
    const validatedRequest = RankRequestSchema.parse(request);
    const parsed = RankResponseSchema.safeParse(await this.send(
      "/pte/v1/rank",
      {
        method: "POST",
        headers: {
          Authorization: await this.authorization(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedRequest),
      },
      3_500,
      signal,
    ));
    if (!parsed.success) throw new Error("invalid gateway response");
    return parsed.data;
  }
}
```

- [ ] **Step 5: Run extension unit and type tests**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/gateway/gateway-client.test.ts
pnpm --filter @pte-pilot/extension typecheck
```

Expected: three passing tests; token never appears in a content-script module or test log.

- [ ] **Step 6: Commit Service Worker GatewayPort**

```powershell
git add apps/extension/src/background/gateway/gateway-port.ts apps/extension/src/background/gateway/gateway-settings.ts apps/extension/src/background/gateway/gateway-client.ts apps/extension/src/background/gateway/gateway-client.test.ts
git commit -m "feat(extension): add trusted GatewayPort client"
```

Expected: one commit; imports are reachable only from the background Service Worker graph.

---

### Task 8: Durable Outbox Synchronization and Rank Freshness Fallback

**Files:**
- Modify: `apps/extension/src/background/storage/repositories.ts`
- Modify: `apps/extension/src/background/storage/repositories.test.ts`
- Create: `apps/extension/src/background/gateway/cockpit-outbox-queue.ts`
- Create: `apps/extension/src/background/gateway/outbox-sync.ts`
- Create: `apps/extension/src/background/gateway/rank-coordinator.ts`
- Test: `apps/extension/src/background/gateway/cockpit-outbox-queue.test.ts`
- Test: `apps/extension/src/background/gateway/outbox-sync.test.ts`
- Test: `apps/extension/src/background/gateway/rank-coordinator.test.ts`

**Interfaces:**
- Consumes: Cockpit's authoritative `CockpitRepositories`, its 30-second inflight lease recovery and `requeueAllAttemptsForProjection()`, background-only `EventProjectionClient`, public `GatewayPort`, and an asynchronous current-version getter.
- Produces: `CockpitOutboxQueue`, `OutboxSyncCoordinator.runOnce(now)`, `RankCoordinator.rankOrFallback(request, localOrder)`, and `CockpitRepositories.getLearnerStateVersion()`.
- Crash/rebuild contract: ACK deletes only the exact acknowledged outbox rows; facts remain in IndexedDB. A health or ACK projection UUID change atomically requeues every immutable attempt. An expired inflight lease is eligible again after Service Worker termination.
- Freshness contract: `commitAttempt()` and an actual `setMarked()` change increment the Cockpit plan's monotonic meta counter; a no-op mark does not. Rank adoption awaits that current counter after the network response.

- [ ] **Step 1: Write failing outbox and stale-rank tests**

```ts
// apps/extension/src/background/gateway/outbox-sync.test.ts
import { describe, expect, it, vi } from "vitest";
import type { EventProjectionClient, GatewayPort } from "./gateway-port.js";
import { OutboxSyncCoordinator, type OutboxQueuePort } from "./outbox-sync.js";

const event = {
  attemptId: "22222222-2222-4222-8222-222222222222",
  questionId: "131020",
  accuracy: 0.8,
  durationMs: 12_500,
  replayCount: 2,
  errors: [{ expected: "postponed", actual: "postpond", type: "spelling" as const }],
  completedAt: "2026-07-15T00:00:00.000Z",
};

describe("OutboxSyncCoordinator", () => {
  const firstProjection = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const replacementProjection = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("prepares the projection and deletes only an exact acknowledgement", async () => {
    const queue: OutboxQueuePort = {
      prepareProjection: vi.fn().mockResolvedValue(undefined),
      leaseDueBatch: vi.fn().mockResolvedValue({
        batchId: "11111111-1111-4111-8111-111111111111",
        events: [event],
      }),
      acknowledge: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
    const gateway = {
      health: vi.fn().mockResolvedValue({
        service: "pte-pilot",
        status: "ready",
        profile: "pte-pilot",
        schemaVersion: 1,
        projectionInstanceId: firstProjection,
        projectionVersion: 0,
        capabilities: ["events:batchUpsert", "rank", "pair"],
        hermes: { status: "ready", model: "pte-pilot", enabledTools: ["memory"], unexpectedTools: [] },
      }),
      batchUpsert: vi.fn().mockResolvedValue({
        batchId: "11111111-1111-4111-8111-111111111111",
        ackedAttemptIds: [event.attemptId],
        projectionInstanceId: firstProjection,
        projectionVersion: 1,
      }),
    } as GatewayPort & EventProjectionClient;

    await new OutboxSyncCoordinator(queue, gateway).runOnce(new Date("2026-07-15T00:00:00.000Z"));

    expect(queue.prepareProjection).toHaveBeenCalledWith(
      firstProjection,
      "2026-07-15T00:00:00.000Z",
    );
    expect(queue.acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      batchId: "11111111-1111-4111-8111-111111111111",
      ackedAttemptIds: [event.attemptId],
      projectionInstanceId: firstProjection,
    }));
    expect(queue.release).not.toHaveBeenCalled();
  });

  it("replays facts if the database is replaced between health and ACK", async () => {
    const queue: OutboxQueuePort = {
      prepareProjection: vi.fn().mockResolvedValue(undefined),
      leaseDueBatch: vi.fn().mockResolvedValue({
        batchId: "11111111-1111-4111-8111-111111111111",
        events: [event],
      }),
      acknowledge: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
    const gateway = {
      health: vi.fn().mockResolvedValue({ projectionInstanceId: firstProjection }),
      batchUpsert: vi.fn().mockResolvedValue({
        batchId: "11111111-1111-4111-8111-111111111111",
        ackedAttemptIds: [event.attemptId],
        projectionInstanceId: replacementProjection,
        projectionVersion: 1,
      }),
    } as unknown as GatewayPort & EventProjectionClient;

    await new OutboxSyncCoordinator(queue, gateway).runOnce(new Date("2026-07-15T00:00:00.000Z"));

    expect(queue.prepareProjection).toHaveBeenNthCalledWith(
      1,
      firstProjection,
      "2026-07-15T00:00:00.000Z",
    );
    expect(queue.prepareProjection).toHaveBeenNthCalledWith(
      2,
      replacementProjection,
      "2026-07-15T00:00:00.000Z",
    );
  });

  it("releases the durable lease on request failure", async () => {
    const queue: OutboxQueuePort = {
      prepareProjection: vi.fn().mockResolvedValue(undefined),
      leaseDueBatch: vi.fn().mockResolvedValue({
        batchId: "11111111-1111-4111-8111-111111111111",
        events: [event],
      }),
      acknowledge: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
    const gateway = {
      health: vi.fn().mockResolvedValue({ projectionInstanceId: firstProjection }),
      batchUpsert: vi.fn().mockRejectedValue(new Error("offline")),
    } as unknown as GatewayPort & EventProjectionClient;

    await new OutboxSyncCoordinator(queue, gateway).runOnce(new Date("2026-07-15T00:00:00.000Z"));

    expect(queue.release).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "2026-07-15T00:00:00.000Z",
      "offline",
    );
  });
});
```

```ts
// apps/extension/src/background/gateway/cockpit-outbox-queue.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AttemptEvent } from "@pte-pilot/contracts";
import { createPtePilotDb, type PtePilotDb } from "../storage/db.js";
import { CockpitRepositories } from "../storage/repositories.js";
import { CockpitOutboxQueue } from "./cockpit-outbox-queue.js";

const event: AttemptEvent = {
  attemptId: "22222222-2222-4222-8222-222222222222",
  questionId: "131020",
  accuracy: 0.8,
  durationMs: 12_500,
  replayCount: 2,
  errors: [{ expected: "postponed", actual: "postpond", type: "spelling" }],
  completedAt: "2026-07-15T00:00:00.000Z",
};

describe("CockpitOutboxQueue", () => {
  let db: PtePilotDb;
  let repositories: CockpitRepositories;

  beforeEach(() => {
    db = createPtePilotDb(`gateway-outbox-${crypto.randomUUID()}`);
    repositories = new CockpitRepositories(db);
  });

  afterEach(async () => db.delete());

  it("reclaims an expired Service Worker lease", async () => {
    const batchIds = [
      "11111111-1111-4111-8111-111111111111",
      "33333333-3333-4333-8333-333333333333",
    ];
    const queue = new CockpitOutboxQueue(repositories, () => batchIds.shift()!);
    await repositories.commitAttempt("yc-2026-w29", event);

    await queue.leaseDueBatch(50, "2026-07-15T00:01:00.000Z");
    await expect(queue.leaseDueBatch(50, "2026-07-15T00:01:31.000Z"))
      .resolves.toMatchObject({ events: [event] });
  });

  it("replays every fact once when the projection instance changes", async () => {
    const queue = new CockpitOutboxQueue(
      repositories,
      () => "11111111-1111-4111-8111-111111111111",
    );
    const firstProjection = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const replacementProjection = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    await repositories.commitAttempt("yc-2026-w29", event);
    await queue.prepareProjection(firstProjection, "2026-07-15T00:01:00.000Z");
    const first = await queue.leaseDueBatch(50, "2026-07-15T00:01:00.000Z");
    await queue.acknowledge({
      batchId: first!.batchId,
      ackedAttemptIds: [event.attemptId],
      projectionInstanceId: firstProjection,
      projectionVersion: 1,
    });

    await queue.prepareProjection(firstProjection, "2026-07-15T00:02:00.000Z");
    expect(await db.outbox.count()).toBe(0);
    await queue.prepareProjection(replacementProjection, "2026-07-15T00:02:00.000Z");
    expect(await db.outbox.count()).toBe(1);
  });
});
```

```ts
// apps/extension/src/background/gateway/rank-coordinator.test.ts
import { describe, expect, it } from "vitest";
import type { GatewayPort } from "./gateway-port.js";
import { RankCoordinator } from "./rank-coordinator.js";

const request = {
  decisionId: "11111111-1111-4111-8111-111111111111",
  candidateSetHash: `sha256:${"a".repeat(64)}` as const,
  learnerStateVersion: 42,
  candidates: [
    { questionId: "131020", dueScore: 1, weaknessScore: 0.8, noveltyScore: 0, marked: false, attemptCount: 3, lastAttemptAt: null },
    { questionId: "131021", dueScore: 0.5, weaknessScore: 0.4, noveltyScore: 1, marked: true, attemptCount: 0, lastAttemptAt: null },
  ],
};

describe("RankCoordinator", () => {
  it("discards a response when local learning version changed while waiting", async () => {
    let version = 42;
    const gateway = {
      rank: async () => {
        version = 43;
        return {
          decisionId: request.decisionId,
          candidateSetHash: request.candidateSetHash,
          learnerStateVersion: 42,
          rankedQuestionIds: ["131021", "131020"],
        };
      },
    } as unknown as GatewayPort;
    const coordinator = new RankCoordinator(gateway, async () => version);

    await expect(coordinator.rankOrFallback(request, ["131020", "131021"]))
      .resolves.toEqual(["131020", "131021"]);
  });

  it("uses local order when Gateway is offline", async () => {
    const gateway = { rank: async () => { throw new Error("offline"); } } as unknown as GatewayPort;
    const coordinator = new RankCoordinator(gateway, async () => 42);

    await expect(coordinator.rankOrFallback(request, ["131020", "131021"]))
      .resolves.toEqual(["131020", "131021"]);
  });
});
```

Extend the Cockpit repository test's existing `increments learnerStateVersion for attempts and actual mark changes` case with the direct getter contract used by the Gateway runtime:

```ts
// apps/extension/src/background/storage/repositories.test.ts (inside the existing test)
expect(await repository.getLearnerStateVersion()).toBe(afterMark.learnerStateVersion);
```

- [ ] **Step 2: Run tests and verify missing coordinator modules**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/gateway/cockpit-outbox-queue.test.ts src/background/gateway/outbox-sync.test.ts src/background/gateway/rank-coordinator.test.ts
```

Expected: FAIL containing missing `./cockpit-outbox-queue.js` and `./outbox-sync.js`; the existing repository tests remain green because the Cockpit plan already supplies lease expiry, replay, and mark-version invariants.

- [ ] **Step 3: Implement durable outbox lease protocol**

Add this method beside `getRankCandidates()`; it reads the same meta row that `commitAttempt()` and an actual `setMarked()` increment transactionally:

```ts
// apps/extension/src/background/storage/repositories.ts (inside CockpitRepositories)
async getLearnerStateVersion(): Promise<number> {
  return (await this.db.meta.get("learner-state-version"))?.numberValue ?? 0;
}
```

```ts
// apps/extension/src/background/gateway/cockpit-outbox-queue.ts
import type { BatchUpsertResponse } from "@pte-pilot/contracts";
import type { CockpitRepositories } from "../storage/repositories.js";
import type { OutboxQueuePort } from "./outbox-sync.js";

export class CockpitOutboxQueue implements OutboxQueuePort {
  constructor(
    private readonly repositories: CockpitRepositories,
    private readonly createBatchId: () => string = crypto.randomUUID,
  ) {}

  prepareProjection(projectionInstanceId: string, now: string): Promise<void> {
    return this.repositories.requeueAllAttemptsForProjection(projectionInstanceId, now);
  }

  leaseDueBatch(limit: number, now: string) {
    return this.repositories.leaseOutbox(this.createBatchId(), limit, now);
  }

  acknowledge(response: BatchUpsertResponse): Promise<void> {
    return this.repositories.ackOutbox(response);
  }

  release(batchId: string, now: string, _reason: string): Promise<void> {
    return this.repositories.releaseOutbox(batchId, now);
  }
}
```

```ts
// apps/extension/src/background/gateway/outbox-sync.ts
import type { BatchUpsertRequest, BatchUpsertResponse } from "@pte-pilot/contracts";
import type { EventProjectionClient, GatewayPort } from "./gateway-port.js";

export interface OutboxQueuePort {
  prepareProjection(projectionInstanceId: string, now: string): Promise<void>;
  leaseDueBatch(limit: number, now: string): Promise<BatchUpsertRequest | null>;
  acknowledge(response: BatchUpsertResponse): Promise<void>;
  release(batchId: string, now: string, reason: string): Promise<void>;
}

export class OutboxSyncCoordinator {
  private running = false;

  constructor(
    private readonly queue: OutboxQueuePort,
    private readonly gateway: GatewayPort & EventProjectionClient,
  ) {}

  async runOnce(now: Date): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const nowIso = now.toISOString();
      const health = await this.gateway.health().catch(() => null);
      if (!health) return;
      await this.queue.prepareProjection(health.projectionInstanceId, nowIso);
      const lease = await this.queue.leaseDueBatch(50, nowIso);
      if (!lease) return;
      try {
        const response = await this.gateway.batchUpsert(lease);
        const sentIds = new Set(lease.events.map(({ attemptId }) => attemptId));
        const acknowledged = response.ackedAttemptIds;
        const invalid = response.batchId !== lease.batchId
          || new Set(acknowledged).size !== acknowledged.length
          || acknowledged.some((attemptId) => !sentIds.has(attemptId));
        if (invalid) throw new Error("invalid acknowledgement");
        if (response.projectionInstanceId !== health.projectionInstanceId) {
          await this.queue.prepareProjection(response.projectionInstanceId, nowIso);
        }
        if (acknowledged.length > 0) await this.queue.acknowledge(response);
        if (acknowledged.length !== lease.events.length) {
          await this.queue.release(lease.batchId, nowIso, "partial acknowledgement");
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : "gateway failure";
        await this.queue.release(lease.batchId, nowIso, reason.slice(0, 200));
      }
    } finally {
      this.running = false;
    }
  }
}
```

- [ ] **Step 4: Implement rank freshness validation and deterministic fallback**

```ts
// apps/extension/src/background/gateway/rank-coordinator.ts
import type { RankRequest } from "@pte-pilot/contracts";
import type { GatewayPort } from "./gateway-port.js";

export class RankCoordinator {
  constructor(
    private readonly gateway: GatewayPort,
    private readonly currentLearnerStateVersion: () => Promise<number>,
  ) {}

  async rankOrFallback(request: RankRequest, localOrder: string[]): Promise<string[]> {
    try {
      const response = await this.gateway.rank(request);
      const candidateIds = request.candidates.map(({ questionId }) => questionId);
      const candidateSet = new Set(candidateIds);
      const rankedSet = new Set(response.rankedQuestionIds);
      const currentVersion = await this.currentLearnerStateVersion();
      const valid = response.decisionId === request.decisionId
        && response.candidateSetHash === request.candidateSetHash
        && response.learnerStateVersion === request.learnerStateVersion
        && currentVersion === request.learnerStateVersion
        && response.rankedQuestionIds.length === candidateIds.length
        && rankedSet.size === candidateSet.size
        && response.rankedQuestionIds.every((questionId) => candidateSet.has(questionId));
      return valid ? response.rankedQuestionIds : localOrder;
    } catch {
      return localOrder;
    }
  }
}
```

- [ ] **Step 5: Run coordinator and extension type tests**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/storage/repositories.test.ts src/background/gateway/cockpit-outbox-queue.test.ts src/background/gateway/outbox-sync.test.ts src/background/gateway/rank-coordinator.test.ts
pnpm --filter @pte-pilot/extension typecheck
```

Expected: repository plus Gateway tests pass. Evidence includes expired inflight lease reclamation, same-instance no-op, replacement-instance replay, exact ACK deletion, async rank-version rejection after a mark mutation, and local fallback. No Chrome alarm permission is added; startup and post-attempt kicks are enough because `nextAttemptAt` and `leaseExpiresAt` are durable.

- [ ] **Step 6: Commit outbox and fallback logic**

```powershell
git add apps/extension/src/background/storage/repositories.ts apps/extension/src/background/storage/repositories.test.ts apps/extension/src/background/gateway/cockpit-outbox-queue.ts apps/extension/src/background/gateway/cockpit-outbox-queue.test.ts apps/extension/src/background/gateway/outbox-sync.ts apps/extension/src/background/gateway/outbox-sync.test.ts apps/extension/src/background/gateway/rank-coordinator.ts apps/extension/src/background/gateway/rank-coordinator.test.ts
git commit -m "feat(extension): sync outbox with local fallback"
```

Expected: one commit; no Gateway or Hermes failure can block local practice, Service Worker termination cannot strand inflight rows, and SQLite replacement is recoverable from IndexedDB facts.

---

### Task 9: Service Worker Runtime Composition

**Files:**
- Create: `apps/extension/src/background/gateway/gateway-runtime.ts`
- Create: `apps/extension/src/background/gateway/gateway-admin-message.ts`
- Modify: `apps/extension/src/background/start-cockpit-background.ts`
- Modify: `apps/extension/entrypoints/background.ts`
- Create: `apps/extension/entrypoints/options.html`
- Create: `apps/extension/entrypoints/options/main.ts`
- Modify: `apps/extension/wxt.config.ts`
- Test: `apps/extension/src/background/gateway/gateway-runtime.test.ts`
- Test: `apps/extension/src/background/gateway/manifest-permissions.test.ts`
- Test: `tests/integration/gateway-online-flow.test.ts`

**Interfaces:**
- Consumes: `CockpitOutboxQueue`, `GatewaySettingsRepository`, `HttpGatewayClient`, `CockpitRepositories.getLearnerStateVersion()`, `RuntimeRequestSchema`, and WXT manifest config.
- Produces: `createGatewayRuntime(dependencies)` with `onStartup`, `onAttemptCommitted`, `health`, `pair`, and `rank`; the real `startCockpitBackground()` composition; a trusted extension-options pairing message; and a pair -> attempt -> IndexedDB outbox -> authenticated Gateway -> SQLite -> exact ACK integration contract.
- Sender rule: Firefly content may use only the existing shared runtime actions. Only `browser.runtime.getURL("options.html")` may send `gateway/pair`; the response never contains the bearer token.

- [ ] **Step 1: Write failing runtime and permission tests**

```ts
// apps/extension/src/background/gateway/gateway-runtime.test.ts
import { describe, expect, it, vi } from "vitest";
import type {
  EventProjectionClient,
  GatewayPairingPort,
  GatewayPort,
} from "./gateway-port.js";
import { createGatewayRuntime } from "./gateway-runtime.js";
import type { TrustedStorageArea } from "./gateway-settings.js";
import type { OutboxQueuePort } from "./outbox-sync.js";

describe("GatewayRuntime", () => {
  it("restricts storage before health or outbox work", async () => {
    const order: string[] = [];
    const storage: TrustedStorageArea = {
      get: async () => ({
        "pte.gateway.settings.v1": {
          baseUrl: "http://127.0.0.1:8642",
          token: "a".repeat(43),
          pairedAt: "2026-07-15T00:00:00.000Z",
        },
      }),
      set: async () => undefined,
      remove: async () => undefined,
      setAccessLevel: async () => { order.push("trusted"); },
    };
    const queue: OutboxQueuePort = {
      prepareProjection: async () => { order.push("projection"); },
      leaseDueBatch: async () => { order.push("outbox"); return null; },
      acknowledge: async () => undefined,
      release: async () => undefined,
    };
    const gateway = {
      health: async () => {
        order.push("health");
        return {
          service: "pte-pilot",
          status: "ready",
          profile: "pte-pilot",
          schemaVersion: 1,
          projectionInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          projectionVersion: 0,
          capabilities: ["events:batchUpsert", "rank", "pair"],
          hermes: { status: "ready", model: "pte-pilot", enabledTools: ["memory"], unexpectedTools: [] },
        } as const;
      },
      pair: async () => undefined,
      batchUpsert: async (request) => ({
        batchId: request.batchId,
        ackedAttemptIds: request.events.map(({ attemptId }) => attemptId),
        projectionInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        projectionVersion: 0,
      }),
      rank: async (request) => ({
        decisionId: request.decisionId,
        candidateSetHash: request.candidateSetHash,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: request.candidates.map(({ questionId }) => questionId),
      }),
    } satisfies GatewayPort & GatewayPairingPort & EventProjectionClient;
    const runtime = createGatewayRuntime({
      storage,
      queue,
      gateway,
      now: () => new Date("2026-07-15T00:00:00.000Z"),
      currentLearnerStateVersion: async () => 0,
    });

    await runtime.onStartup();

    expect(order[0]).toBe("trusted");
    expect(order).toContain("health");
    expect(order).toContain("outbox");
  });

  it("never exposes a generic prompt or URL method", () => {
    const runtime = createGatewayRuntime({
      storage: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), setAccessLevel: vi.fn() },
      queue: { prepareProjection: vi.fn(), leaseDueBatch: vi.fn(), acknowledge: vi.fn(), release: vi.fn() },
      gateway: {} as GatewayPort & GatewayPairingPort & EventProjectionClient,
      now: () => new Date(),
      currentLearnerStateVersion: async () => 0,
    });

    expect(Object.keys(runtime).sort()).toEqual([
      "health",
      "onAttemptCommitted",
      "onStartup",
      "pair",
      "rank",
    ]);
  });
});
```

```ts
// apps/extension/src/background/gateway/manifest-permissions.test.ts
import { describe, expect, it } from "vitest";
import { extensionManifest } from "../../../wxt.config.js";

describe("Gateway WXT manifest boundary", () => {
  it("grants only the approved loopback Gateway origin", () => {
    expect(extensionManifest.permissions).toEqual(expect.arrayContaining(["storage", "webRequest"]));
    expect(extensionManifest.host_permissions).toContain("http://127.0.0.1:8642/*");
    expect(extensionManifest.host_permissions).not.toContain("http://127.0.0.1:8643/*");
    expect(extensionManifest.host_permissions).not.toContain("<all_urls>");
  });
});
```

```ts
// tests/integration/gateway-online-flow.test.ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AttemptEvent, RankRequest } from "../../packages/contracts/src/index.js";
import { openGatewayDatabase } from "../../apps/gateway/src/db/database.js";
import { AttemptProjection } from "../../apps/gateway/src/projection/attempt-projection.js";
import { PairingService } from "../../apps/gateway/src/security/pairing-service.js";
import { createGatewayServer } from "../../apps/gateway/src/server.js";
import { makeTestConfig } from "../../apps/gateway/src/test/make-test-config.js";
import { createPtePilotDb, type PtePilotDb } from "../../apps/extension/src/background/storage/db.js";
import { CockpitRepositories } from "../../apps/extension/src/background/storage/repositories.js";
import { CockpitOutboxQueue } from "../../apps/extension/src/background/gateway/cockpit-outbox-queue.js";
import { HttpGatewayClient } from "../../apps/extension/src/background/gateway/gateway-client.js";
import {
  GatewaySettingsRepository,
  initializeTrustedGatewayStorage,
  type TrustedStorageArea,
} from "../../apps/extension/src/background/gateway/gateway-settings.js";
import { OutboxSyncCoordinator } from "../../apps/extension/src/background/gateway/outbox-sync.js";

type GatewayServer = Awaited<ReturnType<typeof createGatewayServer>>;

const origin = "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const event: AttemptEvent = {
  attemptId: "22222222-2222-4222-8222-222222222222",
  questionId: "131020",
  accuracy: 0.8,
  durationMs: 12_500,
  replayCount: 2,
  errors: [{ expected: "postponed", actual: "postpond", type: "spelling" }],
  completedAt: "2026-07-15T00:00:00.000Z",
};

function createStorage(): TrustedStorageArea & { values: Record<string, unknown> } {
  const values: Record<string, unknown> = {};
  return {
    values,
    get: async (key) => ({ [key]: values[key] }),
    set: async (items) => { Object.assign(values, items); },
    remove: async (key) => { delete values[key]; },
    setAccessLevel: async () => undefined,
  };
}

function injectFetch(app: GatewayServer): typeof fetch {
  return async (input, init = {}) => {
    const url = input instanceof URL
      ? input
      : new URL(typeof input === "string" ? input : input.url);
    const headers = new Headers(init.headers);
    headers.set("origin", origin);
    const response = await app.inject({
      method: (init.method ?? "GET") as "GET" | "POST",
      url: `${url.pathname}${url.search}`,
      headers: Object.fromEntries(headers.entries()),
      payload: init.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(response.body, {
      status: response.statusCode,
      headers: { "content-type": String(response.headers["content-type"] ?? "application/json") },
    });
  };
}

describe("online Gateway contract", () => {
  let app: GatewayServer | undefined;
  let extensionDb: PtePilotDb | undefined;
  let directory: string | undefined;

  afterEach(async () => {
    await app?.close();
    await extensionDb?.delete();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it("pairs, ranks, projects one IndexedDB outbox event, and ACKs it", async () => {
    directory = mkdtempSync(join(tmpdir(), "pte-pilot-online-"));
    const dbPath = join(directory, "gateway.sqlite");
    const config = makeTestConfig({ dbPath, allowedExtensionOrigin: origin });
    app = await createGatewayServer(config);

    const provisioningDb = openGatewayDatabase(dbPath);
    const pairing = new PairingService({
      database: provisioningDb,
      pepper: config.tokenPepper,
      ttlMs: config.pairingCodeTtlMs,
      now: config.now,
      randomBytes: config.randomBytes,
    });
    const code = pairing.createCode();
    provisioningDb.close();

    const storage = createStorage();
    await initializeTrustedGatewayStorage(storage);
    const client = new HttpGatewayClient(new GatewaySettingsRepository(storage), injectFetch(app));
    await client.pair(code);

    extensionDb = createPtePilotDb(`online-${crypto.randomUUID()}`);
    const repositories = new CockpitRepositories(extensionDb);
    await repositories.commitAttempt("yc-2026-w29", event);
    const queue = new CockpitOutboxQueue(
      repositories,
      () => "11111111-1111-4111-8111-111111111111",
    );
    await new OutboxSyncCoordinator(queue, client).runOnce(
      new Date("2026-07-15T00:01:00.000Z"),
    );

    expect(await extensionDb.outbox.count()).toBe(0);
    const inspectionDb = openGatewayDatabase(dbPath);
    expect(
      (inspectionDb.prepare("SELECT COUNT(*) AS count FROM attempt_events").get() as { count: number }).count,
    ).toBe(1);
    const identity = new AttemptProjection(inspectionDb).getProjectionIdentity();
    inspectionDb.close();
    expect((await client.health()).projectionInstanceId).toBe(identity.projectionInstanceId);

    const snapshot = await repositories.getRankCandidates("yc-2026-w29", [event.questionId]);
    const rankRequest: RankRequest = {
      decisionId: "33333333-3333-4333-8333-333333333333",
      candidateSetHash: `sha256:${"a".repeat(64)}`,
      learnerStateVersion: snapshot.learnerStateVersion,
      candidates: snapshot.candidates,
    };
    await expect(client.rank(rankRequest)).resolves.toMatchObject({
      rankedQuestionIds: [event.questionId],
    });
  });
});
```

- [ ] **Step 2: Run tests and verify missing runtime module**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/gateway/gateway-runtime.test.ts src/background/gateway/manifest-permissions.test.ts
pnpm exec vitest run --project unit tests/integration/gateway-online-flow.test.ts
```

Expected: runtime test FAIL containing `Cannot find module './gateway-runtime.js'`; online test FAIL containing missing Gateway runtime/outbox adapter modules; the WXT-config test does not read a nonexistent hand-written `manifest.json`.

- [ ] **Step 3: Implement background-only runtime composition**

```ts
// apps/extension/src/background/gateway/gateway-runtime.ts
import type { GatewayHealth, RankRequest, RankResponse } from "@pte-pilot/contracts";
import { rankLocally } from "../../learning/local-ranking.js";
import type {
  EventProjectionClient,
  GatewayPairingPort,
  GatewayPort,
} from "./gateway-port.js";
import {
  GatewaySettingsRepository,
  initializeTrustedGatewayStorage,
  type TrustedStorageArea,
} from "./gateway-settings.js";
import { HttpGatewayClient } from "./gateway-client.js";
import { OutboxSyncCoordinator, type OutboxQueuePort } from "./outbox-sync.js";
import { RankCoordinator } from "./rank-coordinator.js";

type GatewayRuntimeDependencies = {
  storage: TrustedStorageArea;
  queue: OutboxQueuePort;
  currentLearnerStateVersion: () => Promise<number>;
  now?: () => Date;
  gateway?: GatewayPort & GatewayPairingPort & EventProjectionClient;
};

export type GatewayRuntime = {
  onStartup(): Promise<void>;
  onAttemptCommitted(): Promise<void>;
  health(): Promise<GatewayHealth>;
  pair(code: string): Promise<void>;
  rank(request: RankRequest): Promise<RankResponse>;
};

export function createGatewayRuntime(dependencies: GatewayRuntimeDependencies): GatewayRuntime {
  const settings = new GatewaySettingsRepository(dependencies.storage);
  const gateway = dependencies.gateway ?? new HttpGatewayClient(settings);
  const outbox = new OutboxSyncCoordinator(dependencies.queue, gateway);
  const ranking = new RankCoordinator(gateway, dependencies.currentLearnerStateVersion);
  const now = dependencies.now ?? (() => new Date());
  let trustedStorage: Promise<void> | undefined;
  const ensureTrustedStorage = (): Promise<void> => {
    trustedStorage ??= initializeTrustedGatewayStorage(dependencies.storage);
    return trustedStorage;
  };
  const syncIfPaired = async (): Promise<void> => {
    if (!(await settings.load()).token) return;
    await outbox.runOnce(now()).catch(() => undefined);
  };

  return {
    async onStartup(): Promise<void> {
      await ensureTrustedStorage();
      await syncIfPaired();
    },

    async onAttemptCommitted(): Promise<void> {
      await ensureTrustedStorage();
      await syncIfPaired();
    },

    async health(): Promise<GatewayHealth> {
      await ensureTrustedStorage();
      return gateway.health();
    },

    async pair(code: string): Promise<void> {
      await ensureTrustedStorage();
      await gateway.pair(code);
      await syncIfPaired();
    },

    async rank(request: RankRequest): Promise<RankResponse> {
      const localOrder = rankLocally(request.candidates);
      const rankedQuestionIds = await ranking.rankOrFallback(request, localOrder);
      return {
        decisionId: request.decisionId,
        candidateSetHash: request.candidateSetHash,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds,
      };
    },
  };
}
```

```ts
// apps/extension/src/background/gateway/gateway-admin-message.ts
import { z } from "zod";

export const GatewayPairRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.literal("gateway/pair"),
  code: z.string().regex(/^[2-9A-HJ-NP-Z]{12}$/),
});

export const GatewayPairResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    requestId: z.string().uuid(),
    action: z.literal("gateway/pair"),
    ok: z.literal(true),
  }),
  z.object({
    requestId: z.string().uuid(),
    action: z.literal("gateway/pair"),
    ok: z.literal(false),
    reason: z.enum(["invalid-code", "offline", "unauthorized"]),
  }),
]);

export type GatewayPairResponse = z.infer<typeof GatewayPairResponseSchema>;
```

- [ ] **Step 4: Wire runtime from the existing Service Worker composition root**

Replace the Cockpit plan's offline placeholder in its real database owner. Keep every existing storage case; add only the narrow Gateway cases and options-only pairing branch:

```ts
// apps/extension/src/background/start-cockpit-background.ts
import {
  RuntimeRequestSchema,
  type RuntimeFailure,
  type RuntimeResponse,
} from "@pte-pilot/contracts";
import { CockpitOutboxQueue } from "./gateway/cockpit-outbox-queue.js";
import {
  GatewayPairRequestSchema,
  type GatewayPairResponse,
} from "./gateway/gateway-admin-message.js";
import { GatewayHttpError } from "./gateway/gateway-client.js";
import { createGatewayRuntime } from "./gateway/gateway-runtime.js";
import type { TrustedStorageArea } from "./gateway/gateway-settings.js";
import { createPtePilotDb } from "./storage/db.js";
import { CockpitRepositories } from "./storage/repositories.js";

interface MessageSender { id?: string; url?: string; tab?: { url?: string } }
type MessageListener = (message: unknown, sender: MessageSender) => Promise<unknown> | undefined;
interface RuntimeListener { addListener(listener: MessageListener): void; removeListener(listener: MessageListener): void }
interface VoidListener { addListener(listener: () => void): void; removeListener(listener: () => void): void }

export interface CockpitBackgroundApi {
  runtime: {
    id: string;
    getURL(path: string): string;
    onMessage: RuntimeListener;
    onStartup: VoidListener;
  };
  storage: { local: TrustedStorageArea };
}

const allowedPracticeSender = (api: CockpitBackgroundApi, sender: MessageSender): boolean => {
  const url = sender.url ?? sender.tab?.url ?? "";
  return sender.id === api.runtime.id
    && url.startsWith("https://www.fireflyau.com/ptehome/exercise");
};

const allowedOptionsSender = (api: CockpitBackgroundApi, sender: MessageSender): boolean =>
  sender.id === api.runtime.id && sender.url === api.runtime.getURL("options.html");

const runtimeFailure = (
  requestId: string,
  action: string,
  reason: RuntimeFailure["reason"],
): RuntimeFailure => ({ requestId, ok: false, action, reason });

export function startCockpitBackground(api: CockpitBackgroundApi): () => void {
  const db = createPtePilotDb();
  const repository = new CockpitRepositories(db);
  const gateway = createGatewayRuntime({
    storage: api.storage.local,
    queue: new CockpitOutboxQueue(repository),
    currentLearnerStateVersion: () => repository.getLearnerStateVersion(),
  });

  const listener: MessageListener = async (raw, sender) => {
    const pairRequest = GatewayPairRequestSchema.safeParse(raw);
    if (pairRequest.success) {
      if (!allowedOptionsSender(api, sender)) return undefined;
      const { requestId, action, code } = pairRequest.data;
      try {
        await gateway.pair(code);
        return { requestId, action, ok: true } satisfies GatewayPairResponse;
      } catch (error) {
        const reason = error instanceof GatewayHttpError
          ? error.status === 400 ? "invalid-code" : error.status === 401 ? "unauthorized" : "offline"
          : "offline";
        return { requestId, action, ok: false, reason } satisfies GatewayPairResponse;
      }
    }

    if (!allowedPracticeSender(api, sender)) return undefined;
    const parsed = RuntimeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return runtimeFailure(crypto.randomUUID(), "unknown", "invalid-request");
    }
    const request = parsed.data;
    try {
      switch (request.action) {
        case "storage/loadDraft":
          return { requestId: request.requestId, ok: true, action: request.action, draft: (await repository.loadDraft(request.predictionEdition, request.questionId)) ?? null } satisfies RuntimeResponse;
        case "storage/saveDraft":
          await repository.saveDraft(request.draft);
          return { requestId: request.requestId, ok: true, action: request.action } satisfies RuntimeResponse;
        case "storage/commitAttempt":
          await repository.commitAttempt(request.predictionEdition, request.attempt);
          void gateway.onAttemptCommitted();
          return { requestId: request.requestId, ok: true, action: request.action } satisfies RuntimeResponse;
        case "storage/setMarked":
          await repository.setMarked(request.predictionEdition, request.questionId, request.marked);
          return { requestId: request.requestId, ok: true, action: request.action } satisfies RuntimeResponse;
        case "storage/getRankCandidates":
          return { requestId: request.requestId, ok: true, action: request.action, snapshot: await repository.getRankCandidates(request.predictionEdition, request.questionIds) } satisfies RuntimeResponse;
        case "storage/restoreSession":
          return { requestId: request.requestId, ok: true, action: request.action, session: await repository.restoreSession() } satisfies RuntimeResponse;
        case "storage/loadIndexSnapshot": {
          const loaded = await repository.loadIndexSnapshot(request.predictionEdition);
          return { requestId: request.requestId, ok: true, action: request.action, ...loaded } satisfies RuntimeResponse;
        }
        case "storage/saveIndexSnapshot":
          await repository.saveIndexSnapshot(request.snapshot, request.questions);
          return { requestId: request.requestId, ok: true, action: request.action } satisfies RuntimeResponse;
        case "storage/loadSettings":
          return { requestId: request.requestId, ok: true, action: request.action, settings: (await repository.loadSettings()) ?? null } satisfies RuntimeResponse;
        case "storage/saveSettings":
          await repository.saveSettings(request.settings);
          return { requestId: request.requestId, ok: true, action: request.action } satisfies RuntimeResponse;
        case "storage/listWordStats":
          return { requestId: request.requestId, ok: true, action: request.action, words: await repository.listWordStats(request.limit) } satisfies RuntimeResponse;
        case "gateway/health":
          return { requestId: request.requestId, ok: true, action: request.action, health: await gateway.health() } satisfies RuntimeResponse;
        case "gateway/rank":
          return { requestId: request.requestId, ok: true, action: request.action, response: await gateway.rank(request.request) } satisfies RuntimeResponse;
      }
    } catch {
      const reason = request.action.startsWith("gateway/") ? "offline" : "storage-failure";
      return runtimeFailure(request.requestId, request.action, reason);
    }
  };

  const onStartup = (): void => { void gateway.onStartup(); };
  api.runtime.onMessage.addListener(listener);
  api.runtime.onStartup.addListener(onStartup);
  void gateway.onStartup();
  return () => {
    api.runtime.onStartup.removeListener(onStartup);
    api.runtime.onMessage.removeListener(listener);
    db.close();
  };
}
```

Keep the WXT composition path exact. If the Firefly media plan has landed, the final entry must retain both owners:

```ts
// apps/extension/entrypoints/background.ts
import { browser } from "wxt/browser";
import { registerFireflyMediaObserver } from "../src/background/media/register-firefly-media";
import { startCockpitBackground } from "../src/background/start-cockpit-background";

export default defineBackground(() => {
  const stopCockpit = startCockpitBackground(browser);
  const stopMedia = registerFireflyMediaObserver(browser);
  return () => {
    stopMedia();
    stopCockpit();
  };
});
```

If Gateway is implemented before the Firefly media task, keep the Cockpit entry unchanged (`startCockpitBackground(browser)` only); the Firefly task later produces the exact merged entry above. Never create `src/background/service-worker.ts`.

Expected composition rule: attempt commit returns after the atomic IndexedDB transaction and only kicks Gateway fire-and-forget. Content scripts cannot request pairing, arbitrary Gateway paths, Hermes prompts, Authorization headers, or URLs.

- [ ] **Step 5: Add the one-time trusted options pairing surface and export WXT manifest config**

```html
<!-- apps/extension/entrypoints/options.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PTE Pilot Gateway</title>
  </head>
  <body>
    <main>
      <h1>Pair local Gateway</h1>
      <form id="pair-form">
        <label for="pair-code">One-time 12-character code</label>
        <input id="pair-code" name="code" required minlength="12" maxlength="12" autocomplete="one-time-code" />
        <button type="submit">Pair</button>
      </form>
      <p id="status" role="status" aria-live="polite"></p>
    </main>
    <script type="module" src="./options/main.ts"></script>
  </body>
</html>
```

```ts
// apps/extension/entrypoints/options/main.ts
import { browser } from "wxt/browser";
import { GatewayPairResponseSchema } from "../../src/background/gateway/gateway-admin-message.js";

const form = document.querySelector<HTMLFormElement>("#pair-form");
const input = document.querySelector<HTMLInputElement>("#pair-code");
const status = document.querySelector<HTMLElement>("#status");
if (!form || !input || !status) throw new Error("pairing UI is incomplete");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const requestId = crypto.randomUUID();
  const code = input.value.trim().toUpperCase();
  status.textContent = "Pairing...";
  void browser.runtime.sendMessage({ requestId, action: "gateway/pair", code })
    .then((raw) => GatewayPairResponseSchema.parse(raw))
    .then((response) => {
      status.textContent = response.ok ? "Paired." : `Pairing failed: ${response.reason}.`;
      if (response.ok) input.value = "";
    })
    .catch(() => { status.textContent = "Pairing failed: offline or invalid code."; });
});
```

Refactor the Cockpit WXT config to export the object that tests inspect; do not create a hand-written manifest:

```ts
// apps/extension/wxt.config.ts
import { defineConfig } from "wxt";

export const extensionManifest = {
  name: "PTE Pilot",
  version: "0.1.0",
  minimum_chrome_version: "120",
  permissions: ["storage", "webRequest"],
  host_permissions: [
    "https://www.fireflyau.com/*",
    "https://upload.fireflyau.com/*",
    "http://127.0.0.1:8642/*",
  ],
};

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: extensionManifest,
});
```

- [ ] **Step 6: Run all extension Gateway tests, the real online contract, build, and typecheck**

Run:

```powershell
pnpm --filter @pte-pilot/extension test -- src/background/gateway
pnpm --filter @pte-pilot/extension typecheck
pnpm --filter @pte-pilot/extension build
pnpm exec vitest run --project unit tests/integration/gateway-online-flow.test.ts
```

Expected: all Gateway tests and the online contract pass; pairing stores a token only in trusted background storage; one committed IndexedDB attempt reaches one SQLite row and is ACK-deleted from outbox; online rank returns a valid permutation; generated `.output/chrome-mv3/manifest.json` grants `8642` but not private Hermes `8643` or `<all_urls>`.

- [ ] **Step 7: Commit Service Worker composition**

```powershell
git add apps/extension/src/background/gateway apps/extension/src/background/start-cockpit-background.ts apps/extension/entrypoints/background.ts apps/extension/entrypoints/options.html apps/extension/entrypoints/options/main.ts apps/extension/wxt.config.ts tests/integration/gateway-online-flow.test.ts
git commit -m "feat(extension): activate secure Gateway runtime"
```

Expected: one commit; the real WXT background owner wires startup, attempt commit, options-only pairing, projection replay, and rank fallback without `alarms`, broad host permissions, or a second database owner.

---

### Task 10: Windows Provisioning, Login Startup, and Runtime Audit

**Files:**
- Create: `apps/gateway/scripts/provision-hermes-profile.ps1`
- Create: `apps/gateway/scripts/install-login-tasks.ps1`
- Create: `apps/gateway/scripts/audit-runtime.ps1`
- Create: `apps/gateway/src/operations/windows-assets.test.ts`
- Create: `apps/gateway/README.md`

**Interfaces:**
- Consumes: built Gateway `dist/main.js`, built pairing CLI, installed `hermes.exe`, generated `pte-pilot` profile command.
- Produces: `%LOCALAPPDATA%\PTEPilot\gateway.env`, private Hermes `127.0.0.1:8643`, `PTEPilot-Hermes` and `PTEPilot-Gateway` scheduled tasks, repeatable runtime audit.

- [ ] **Step 1: Write failing PowerShell asset tests**

```ts
// apps/gateway/src/operations/windows-assets.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const scripts = [
  "scripts/provision-hermes-profile.ps1",
  "scripts/install-login-tasks.ps1",
  "scripts/audit-runtime.ps1",
];

describe("Windows runtime assets", () => {
  it.each(scripts)("parses %s with Windows PowerShell", (relativePath) => {
    const path = resolve(process.cwd(), relativePath);
    const escaped = path.replaceAll("'", "''");
    const command = [
      "$tokens=$null",
      "$errors=$null",
      `[System.Management.Automation.Language.Parser]::ParseFile('${escaped}',[ref]$tokens,[ref]$errors)>$null`,
      "if($errors.Count -gt 0){$errors|ForEach-Object{Write-Error $_};exit 1}",
    ].join(";");
    const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], { encoding: "utf8" });

    expect(result.status, result.stderr).toBe(0);
  });

  it("never configures a non-loopback listener or wildcard CORS", () => {
    const content = scripts.map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");

    expect(content).not.toContain("0.0.0.0");
    expect(content).not.toContain("API_SERVER_CORS_ORIGINS=*");
    expect(content).toContain("Set-DotEnvValue $HermesEnvPath 'API_SERVER_CORS_ORIGINS' ''");
    expect(content).toContain("127.0.0.1");
    expect(content).toContain("PTEPilot-Hermes");
    expect(content).toContain("PTEPilot-Gateway");
    expect(content).toContain('platform_toolsets["api_server"] = ["memory", "no_mcp"]');
    expect(content).toContain("include_default_mcp_servers=True");
    expect(content).toContain("$toolsets.data");
    expect(content).not.toContain("tools disable --platform api_server");
  });
});
```

- [ ] **Step 2: Run asset tests and verify missing files**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test -- src/operations/windows-assets.test.ts
```

Expected: FAIL because all three PowerShell files are absent.

- [ ] **Step 3: Add deterministic Hermes profile provisioning**

```powershell
# apps/gateway/scripts/provision-hermes-profile.ps1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$HermesExe,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-p]{32}$')]
  [string]$ExtensionId,

  [string]$GatewayEnvPath = "$env:LOCALAPPDATA\PTEPilot\gateway.env",
  [string]$GatewayDbPath = "$env:LOCALAPPDATA\PTEPilot\pte-pilot.sqlite",
  [switch]$RotateSecrets
)

$ErrorActionPreference = 'Stop'
$ProfileName = 'pte-pilot'

function New-HighEntropySecret {
  $bytes = New-Object byte[] 32
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Get-DotEnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^$([regex]::Escape($Key))=" } | Select-Object -Last 1
  if (-not $line) { return $null }
  return ($line.Substring($line.IndexOf('=') + 1)).Trim().Trim('"')
}

function Set-DotEnvValue([string]$Path, [string]$Key, [string]$Value) {
  $directory = Split-Path -Parent $Path
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $escapedValue = $Value.Replace('"', '\"')
  $replacement = "$Key=`"$escapedValue`""
  $lines = if (Test-Path -LiteralPath $Path) { @(Get-Content -LiteralPath $Path) } else { @() }
  $matched = $false
  $updated = foreach ($line in $lines) {
    if ($line -match "^$([regex]::Escape($Key))=") {
      $matched = $true
      $replacement
    } else {
      $line
    }
  }
  if (-not $matched) { $updated = @($updated) + $replacement }
  [System.IO.File]::WriteAllLines($Path, [string[]]$updated, (New-Object System.Text.UTF8Encoding($false)))
}

function Set-HermesApiToolPolicy([string]$PythonExe, [string]$Path) {
  $script = @'
import os
import sys
from pathlib import Path

import yaml

class IndentDumper(yaml.SafeDumper):
    def increase_indent(self, flow=False, indentless=False):
        return super().increase_indent(flow, False)

path = Path(sys.argv[1])
data = yaml.safe_load(path.read_text(encoding="utf-8")) if path.exists() else {}
if data is None:
    data = {}
if not isinstance(data, dict):
    raise SystemExit("Hermes config root must be a mapping")
platform_toolsets = data.setdefault("platform_toolsets", {})
if not isinstance(platform_toolsets, dict):
    raise SystemExit("platform_toolsets must be a mapping")
platform_toolsets["api_server"] = ["memory", "no_mcp"]
temporary = path.with_suffix(path.suffix + ".tmp")
temporary.write_text(
    yaml.dump(data, Dumper=IndentDumper, sort_keys=False),
    encoding="utf-8",
)
os.replace(temporary, path)
'@
  $script | & $PythonExe - $Path
  if ($LASTEXITCODE -ne 0) { throw 'Failed to write exact Hermes api_server policy.' }
}

if (-not (Test-Path -LiteralPath $HermesExe -PathType Leaf)) {
  throw "Hermes executable not found: $HermesExe"
}
$HermesPython = Join-Path (Split-Path -Parent $HermesExe) 'python.exe'
if (-not (Test-Path -LiteralPath $HermesPython -PathType Leaf)) {
  throw "Hermes Python runtime not found: $HermesPython"
}

& $HermesExe profile show $ProfileName *> $null
if ($LASTEXITCODE -ne 0) {
  & $HermesExe profile create $ProfileName --no-skills --description 'PTE WFD memory and candidate ranking only.'
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create pte-pilot Hermes profile.' }
}

$profileCommandInfo = Get-Command $ProfileName -ErrorAction Stop
$ProfileCommand = $profileCommandInfo.Source
$HermesConfigPath = (& $ProfileCommand config path | Select-Object -Last 1).Trim()
$HermesEnvPath = (& $ProfileCommand config env-path | Select-Object -Last 1).Trim()
& $ProfileCommand tools enable --platform api_server memory
if ($LASTEXITCODE -ne 0) { throw 'Failed to enable bounded Hermes memory.' }
Set-HermesApiToolPolicy $HermesPython $HermesConfigPath

$HermesApiKey = Get-DotEnvValue $HermesEnvPath 'API_SERVER_KEY'
$GatewayPepper = Get-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_TOKEN_PEPPER'
if ($RotateSecrets -or -not $HermesApiKey) { $HermesApiKey = New-HighEntropySecret }
if ($RotateSecrets -or -not $GatewayPepper) { $GatewayPepper = New-HighEntropySecret }

Set-DotEnvValue $HermesEnvPath 'API_SERVER_ENABLED' 'true'
Set-DotEnvValue $HermesEnvPath 'API_SERVER_HOST' '127.0.0.1'
Set-DotEnvValue $HermesEnvPath 'API_SERVER_PORT' '8643'
Set-DotEnvValue $HermesEnvPath 'API_SERVER_KEY' $HermesApiKey
Set-DotEnvValue $HermesEnvPath 'API_SERVER_MODEL_NAME' 'pte-pilot'
Set-DotEnvValue $HermesEnvPath 'API_SERVER_CORS_ORIGINS' ''

Set-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_HOST' '127.0.0.1'
Set-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_PORT' '8642'
Set-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_DB_PATH' $GatewayDbPath
Set-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_ALLOWED_ORIGIN' "chrome-extension://$ExtensionId"
Set-DotEnvValue $GatewayEnvPath 'PTE_GATEWAY_TOKEN_PEPPER' $GatewayPepper
Set-DotEnvValue $GatewayEnvPath 'HERMES_BASE_URL' 'http://127.0.0.1:8643'
Set-DotEnvValue $GatewayEnvPath 'HERMES_CONFIG_PATH' $HermesConfigPath
Set-DotEnvValue $GatewayEnvPath 'HERMES_PYTHON_PATH' $HermesPython
Set-DotEnvValue $GatewayEnvPath 'HERMES_API_KEY' $HermesApiKey
Set-DotEnvValue $GatewayEnvPath 'HERMES_EXPECTED_MODEL' 'pte-pilot'
Set-DotEnvValue $GatewayEnvPath 'HERMES_TIMEOUT_MS' '1500'

Write-Output "Hermes profile command: $ProfileCommand"
Write-Output "Gateway environment: $GatewayEnvPath"
Write-Output 'Secrets generated or reused without printing their values.'
```

- [ ] **Step 4: Add Windows login task installer**

```powershell
# apps/gateway/scripts/install-login-tasks.ps1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$NodeExe,

  [Parameter(Mandatory = $true)]
  [string]$GatewayEntryPath,

  [Parameter(Mandatory = $true)]
  [string]$GatewayEnvPath,

  [Parameter(Mandatory = $true)]
  [string]$HermesProfileCommand
)

$ErrorActionPreference = 'Stop'

foreach ($path in @($NodeExe, $GatewayEntryPath, $GatewayEnvPath, $HermesProfileCommand)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Required file not found: $path"
  }
}

$gatewayWorkingDirectory = Split-Path -Parent $GatewayEntryPath
$hermesCommand = "& '$($HermesProfileCommand.Replace("'", "''"))' gateway run --replace --quiet"
$hermesAction = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -Command `"$hermesCommand`""
$gatewayAction = New-ScheduledTaskAction `
  -Execute $NodeExe `
  -Argument "--env-file=`"$GatewayEnvPath`" `"$GatewayEntryPath`"" `
  -WorkingDirectory $gatewayWorkingDirectory
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
  -RestartCount 5 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal `
  -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName 'PTEPilot-Hermes' `
  -Action $hermesAction `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description 'Private pte-pilot Hermes API on 127.0.0.1:8643.' `
  -Force | Out-Null

Register-ScheduledTask `
  -TaskName 'PTEPilot-Gateway' `
  -Action $gatewayAction `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description 'PTE Pilot extension Gateway on 127.0.0.1:8642.' `
  -Force | Out-Null

Write-Output 'Installed PTEPilot-Hermes and PTEPilot-Gateway login tasks.'
```

- [ ] **Step 5: Add runtime identity and tool audit**

```powershell
# apps/gateway/scripts/audit-runtime.ps1
[CmdletBinding()]
param(
  [string]$GatewayUrl = 'http://127.0.0.1:8642',
  [string]$GatewayEnvPath = "$env:LOCALAPPDATA\PTEPilot\gateway.env"
)

$ErrorActionPreference = 'Stop'

function Get-DotEnvValue([string]$Path, [string]$Key) {
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^$([regex]::Escape($Key))=" } | Select-Object -Last 1
  if (-not $line) { throw "Missing $Key in $Path" }
  return ($line.Substring($line.IndexOf('=') + 1)).Trim().Trim('"')
}

function Get-HermesApiToolPolicy([string]$Path) {
  $lines = @(Get-Content -LiteralPath $Path)
  $rootCount = @($lines | Where-Object { $_ -match '^platform_toolsets:\s*$' }).Count
  if ($rootCount -ne 1) { throw 'Hermes platform_toolsets must appear exactly once.' }
  $insideRoot = $false
  $insideApi = $false
  $apiCount = 0
  $values = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines) {
    if ($line -match '^platform_toolsets:\s*$') { $insideRoot = $true; continue }
    if ($insideRoot -and $line -match '^\S') { $insideRoot = $false; $insideApi = $false }
    if (-not $insideRoot) { continue }
    if ($line -match '^  api_server:\s*$') { $insideApi = $true; $apiCount += 1; continue }
    if ($insideApi -and $line -match '^  \S') { $insideApi = $false }
    if ($insideApi -and $line -match '^    - ([a-z0-9_-]+)\s*$') { $values.Add($Matches[1]) }
  }
  if ($apiCount -ne 1) { throw 'Hermes api_server tool policy must appear exactly once.' }
  return @($values)
}

$health = Invoke-RestMethod -Method Get -Uri "$GatewayUrl/pte/v1/health" -TimeoutSec 3
if ($health.service -ne 'pte-pilot') { throw 'Wrong service on Gateway port.' }
if ($health.profile -ne 'pte-pilot') { throw 'Wrong Hermes profile reported by Gateway.' }
if ($health.schemaVersion -ne 1) { throw 'Unexpected Gateway schema version.' }
$projectionGuid = [guid]::Empty
if (-not [guid]::TryParse([string]$health.projectionInstanceId, [ref]$projectionGuid)) {
  throw 'Gateway projection instance id is not a UUID.'
}
$expectedCapabilities = 'events:batchUpsert,pair,rank'
$actualCapabilities = (@($health.capabilities) | Sort-Object) -join ','
if ($actualCapabilities -ne $expectedCapabilities) { throw "Unexpected Gateway capabilities: $actualCapabilities" }

$hermesBaseUrl = Get-DotEnvValue $GatewayEnvPath 'HERMES_BASE_URL'
$hermesConfigPath = Get-DotEnvValue $GatewayEnvPath 'HERMES_CONFIG_PATH'
$hermesPython = Get-DotEnvValue $GatewayEnvPath 'HERMES_PYTHON_PATH'
$hermesKey = Get-DotEnvValue $GatewayEnvPath 'HERMES_API_KEY'
$configuredPolicy = (Get-HermesApiToolPolicy $hermesConfigPath | Sort-Object) -join ','
if ($configuredPolicy -ne 'memory,no_mcp') {
  throw "Hermes MCP/tool policy drift: $configuredPolicy"
}
$effectivePolicyScript = @'
from hermes_cli.config import load_config
from hermes_cli.tools_config import _get_platform_tools

effective = sorted(_get_platform_tools(
    load_config(),
    "api_server",
    include_default_mcp_servers=True,
))
print(",".join(effective))
'@
$previousHermesHome = $env:HERMES_HOME
$env:HERMES_HOME = Split-Path -Parent $hermesConfigPath
try {
  $effectivePolicy = (($effectivePolicyScript | & $hermesPython -) | Select-Object -Last 1).Trim()
} finally {
  $env:HERMES_HOME = $previousHermesHome
}
if ($LASTEXITCODE -ne 0 -or $effectivePolicy -ne 'memory') {
  throw "Hermes effective tool policy includes non-memory or MCP tools: $effectivePolicy"
}
$headers = @{ Authorization = "Bearer $hermesKey" }
$models = Invoke-RestMethod -Method Get -Uri "$hermesBaseUrl/v1/models" -Headers $headers -TimeoutSec 3
if (@($models.data).Count -ne 1 -or $models.data[0].id -ne 'pte-pilot') {
  throw 'Private Hermes model identity mismatch.'
}
$toolsets = Invoke-RestMethod -Method Get -Uri "$hermesBaseUrl/v1/toolsets" -Headers $headers -TimeoutSec 3
if ($toolsets.object -ne 'list' -or $toolsets.platform -ne 'api_server' -or $null -eq $toolsets.data) {
  throw 'Unexpected Hermes /v1/toolsets envelope.'
}
$enabledTools = @(
  $toolsets.data |
    Where-Object { $_.enabled -and $_.configured } |
    ForEach-Object { $_.tools } |
    Sort-Object -Unique
)
if ($enabledTools.Count -ne 1 -or $enabledTools[0] -ne 'memory') {
  throw "Hermes tool policy drift: $($enabledTools -join ',')"
}

foreach ($taskName in @('PTEPilot-Hermes', 'PTEPilot-Gateway')) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
  if ($task.State -eq 'Disabled') { throw "$taskName is disabled." }
}

Write-Output 'PASS Gateway identity: pte-pilot schema 1.'
Write-Output 'PASS Hermes identity: pte-pilot on private loopback.'
Write-Output 'PASS Hermes tools: memory only.'
Write-Output 'PASS Windows login tasks installed and enabled.'
```

- [ ] **Step 6: Add exact operator runbook**

````markdown
<!-- apps/gateway/README.md -->
# PTE Pilot Gateway

Private Windows service boundary between Chrome Extension and local Hermes Agent.

## Build

```powershell
node --version
corepack prepare pnpm@11.7.0 --activate
pnpm --version
pnpm --filter @pte-pilot/gateway test
pnpm --filter @pte-pilot/gateway typecheck
pnpm --filter @pte-pilot/gateway build
```

Expected: versions are exactly `v24.15.0` and `11.7.0`; tests pass; `apps/gateway/dist/main.js` and `dist/cli/create-pairing-code.js` exist.

## Create and configure Hermes profile

```powershell
$HermesExe = 'C:\Users\18066\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe'
& $HermesExe profile create pte-pilot --no-skills --description 'PTE WFD memory and candidate ranking only.'
pte-pilot setup --portal
```

If profile already exists, keep it and run only `pte-pilot setup --portal` when its model provider is not configured.

Load unpacked extension once, copy its 32-character ID from `chrome://extensions`, then run:

```powershell
$ExtensionId = Read-Host 'Paste the 32-character Chrome extension ID'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\provision-hermes-profile.ps1 `
  -HermesExe $HermesExe `
  -ExtensionId $ExtensionId
```

Script rejects invalid ID format and never prints generated secrets.

## Install login startup

```powershell
$NodeExe = (Get-Command node.exe).Source
$ProfileCommand = (Get-Command pte-pilot).Source
$GatewayEntry = (Resolve-Path .\apps\gateway\dist\main.js).Path
$GatewayEnv = "$env:LOCALAPPDATA\PTEPilot\gateway.env"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\install-login-tasks.ps1 `
  -NodeExe $NodeExe `
  -GatewayEntryPath $GatewayEntry `
  -GatewayEnvPath $GatewayEnv `
  -HermesProfileCommand $ProfileCommand
Start-ScheduledTask -TaskName PTEPilot-Hermes
Start-ScheduledTask -TaskName PTEPilot-Gateway
```

Expected: Hermes listens only on `127.0.0.1:8643`; Gateway listens only on `127.0.0.1:8642`.

## Pair extension

```powershell
node.exe --env-file="$env:LOCALAPPDATA\PTEPilot\gateway.env" .\apps\gateway\dist\cli\create-pairing-code.js
```

Expected: one 12-character code. Within five minutes, open the extension's **Options** page, paste the code, and submit. The options page receives only success/failure; the Service Worker stores the Gateway bearer token under `TRUSTED_CONTEXTS` and never returns it or the Hermes API key to the page.

## Audit

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\audit-runtime.ps1
```

Expected: four `PASS` lines. Any wrong service, wrong profile, non-memory tool, or missing login task causes nonzero exit.

## Rotate local secrets

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\provision-hermes-profile.ps1 `
  -HermesExe $HermesExe `
  -ExtensionId $ExtensionId `
  -RotateSecrets
Restart-ScheduledTask -TaskName PTEPilot-Hermes
Restart-ScheduledTask -TaskName PTEPilot-Gateway
```

Old extension Gateway tokens become invalid after pepper rotation. Generate a new one-time pairing code and pair again.
````

- [ ] **Step 7: Run syntax, unit, build, and integrated acceptance checks**

Run:

```powershell
pnpm --filter @pte-pilot/gateway test
pnpm --filter @pte-pilot/gateway typecheck
pnpm --filter @pte-pilot/gateway build
pnpm --filter @pte-pilot/extension test -- src/background/gateway
pnpm --filter @pte-pilot/extension typecheck
pnpm --filter @pte-pilot/extension build
pnpm exec vitest run --project unit tests/integration/gateway-online-flow.test.ts
git check-ignore --no-index apps/gateway/dist/main.js
```

Expected:

```text
Gateway tests: PASS
Extension Gateway tests: PASS
TypeScript typechecks: PASS
Gateway production build: PASS
Online pair -> outbox -> SQLite -> ACK contract: PASS
100 duplicate event deliveries: one SQLite attempt row
Replacement projection replay: every IndexedDB attempt exactly once by attemptId
Expired Service Worker lease: reclaimed after 30 seconds
Stale rank responses adopted: zero
Hermes-offline local practice blocker: zero
Gateway dist ignored: PASS
```

Then run the real local audit after provisioning:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\audit-runtime.ps1
```

Expected: four `PASS` lines and exit code 0.

- [ ] **Step 8: Commit Windows operations and final verification assets**

```powershell
git add apps/gateway/scripts apps/gateway/src/operations apps/gateway/README.md
git commit -m "ops(gateway): provision and audit local runtime"
```

Expected: tenth task commit contains scripts, tests, and runbook; generated `.env`, SQLite, token, and profile data remain untracked.

---

## Cross-Plan Coordination Gates

- [ ] Cockpit shared contracts land first with `projectionInstanceId: z.string().uuid()` in both `BatchUpsertResponseSchema` and `GatewayHealthSchema`, plus `events: z.array(AttemptEventSchema).min(1)`.
- [ ] Cockpit storage lands first with `leaseExpiresAt`, expired-inflight recovery, `requeueAllAttemptsForProjection()`, and the monotonic learner-state meta row updated by new attempts and actual mark changes.
- [ ] Cockpit runtime messages keep `storage/getRankCandidates(predictionEdition, questionIds)`; Gateway composition passes both arguments and adds pairing only through its local options-only schema.
- [ ] Firefly media work preserves the final `entrypoints/background.ts` composition with both `startCockpitBackground(browser)` and `registerFireflyMediaObserver(browser)`; neither plan creates another Service Worker root.
- [ ] Integration hardening adds `pnpm --filter @pte-pilot/gateway test` and `pnpm exec vitest run --project unit tests/integration/gateway-online-flow.test.ts` to the repository-level `verify` command. A root verify that exercises only extension/unit projects is not a final gate.
- [ ] Cockpit `.gitignore` keeps `apps/gateway/dist/`; `git check-ignore --no-index apps/gateway/dist/main.js` must pass before either Gateway commit stages `apps/gateway` recursively.

## Execution Order and Final Gate

Execute tasks in listed order after the Cockpit gates above. Before daily use, Gateway package tests, extension Gateway tests, the online pair/outbox/SQLite ACK contract, generated-manifest audit, and real `audit-runtime.ps1` must all pass. If Hermes identity, the real `/v1/toolsets` envelope, or the exact `[memory, no_mcp]` config policy is degraded, Gateway may continue deterministic event projection but `/pte/v1/rank` must fail closed; Extension must retain local ordering and uninterrupted practice.
