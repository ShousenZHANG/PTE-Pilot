# PTE Pilot Cockpit and Local Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the keyboard-first WFD cockpit, deterministic local learning engine, extension-origin fact store, and offline-resilient Gateway boundary that remain fully usable when Hermes is offline.

**Architecture:** `apps/extension` mounts a WXT React UI in an isolated Shadow DOM, while a pure reducer and `PracticeController` own every practice transition and physical-key release gate. The content script talks through typed ports; only the Manifest V3 Service Worker opens Dexie, atomically records attempts/statistics/outbox facts, and calls the loopback Gateway. `packages/contracts` is the single schema package consumed by Firefly, Gateway, and integration plans.

**Tech Stack:** Node 24.15.0, pnpm 11.7.0, WXT 0.20.27, `@wxt-dev/module-react` 1.2.2, React 19.2.7, Dexie 4.4.4, Zod 4.4.3, Vitest 4.1.10, TypeScript 6.0.3, Biome 2.5.4, Playwright 1.61.1.

## Global Constraints

- Use exactly Node `24.15.0` and pnpm `11.7.0`.
- Pin `wxt@0.20.27`, `@wxt-dev/module-react@1.2.2`, `react@19.2.7`, `react-dom@19.2.7`, `dexie@4.4.4`, `zod@4.4.3`, `vitest@4.1.10`, `typescript@6.0.3`, and `@biomejs/biome@2.5.4` without ranges.
- Keep root workspaces exactly under `apps/extension`, `apps/gateway`, `packages/contracts`, and `tests/e2e`.
- Keep `packages/contracts/src/{practice,site,gateway,messages}.ts` as shared schema ownership; other workspaces consume, never duplicate, those schemas.
- Export `transition(state, event)` from `apps/extension/src/practice/practice-machine.ts`.
- Export `PracticeController` and `createPracticeController(deps)` from `apps/extension/src/practice/practice-controller.ts`.
- Export `mountCockpit(args): Promise<() => void>` from `apps/extension/src/app/mount-cockpit.tsx`.
- Export `startCockpitBackground(api): () => void` from `apps/extension/src/background/start-cockpit-background.ts`.
- Keep WXT entries at `apps/extension/entrypoints/firefly.content.tsx` and `apps/extension/entrypoints/background.ts`.
- Open Dexie only inside extension-origin Service Worker modules under `apps/extension/src/background/storage`; content code must never call page-origin `window.indexedDB`.
- Treat IndexedDB as sole fact source. Commit attempt, local statistics, and outbox row in one Dexie transaction or roll back all three.
- Keep Hermes/Gateway outside input, playback, scoring, and navigation critical paths. Offline or invalid Gateway output always falls back to deterministic local order.
- Never store or message correct answers before a verified submission. Never persist audio blobs or full answer sentences.
- `PracticeController` must depend on `SubmissionGatePort`, `NavigationPort`, and `IndexPort`; it must never receive the raw answer-reading methods on `FireflySitePort`.
- `AnswerGate` is the only module allowed to read plaintext correct answers. It returns only deterministic accuracy/error facts and overwrites its local plaintext reference before resolving.
- `NavigationCoordinator` is the only module allowed to invoke raw previous/next/select/redo controls; redo succeeds only after it proves the old answer hidden and the site input empty. Every extension and site-observed transition carries one monotonic `navigationEpoch`.
- Use an uncontrolled native `<textarea>`; `setDraft` updates a ref and schedules persistence without causing React render per keystroke.
- Keep Enter submission latch inside `PracticeController`: review navigation requires physical `keyup`, then a fresh non-repeat `keydown`; 400ms is secondary protection only.
- `PracticeController.dispose()` clears only controller timers and subscriptions. The composition runtime owns injected ports and disposes each exactly once after the controller stops observing them.
- Required stable UI selectors: `pte-pilot-root`, `answer-input`, `practice-state`, `question-position`, `review-result`, `hermes-status`, `recovery-retry`, `recovery-original-site`, and `command-layer`.
- Every implementation task follows red-green-refactor order and ends with one commit.

---

## File Map

```text
package.json                                  root commands and exact tool pins
pnpm-workspace.yaml                           workspace/catalog ownership
tsconfig.base.json                            strict shared TypeScript policy
biome.json                                    formatter/linter policy
vitest.config.ts                              Node unit projects
playwright.config.ts                          one browser/E2E configuration
apps/extension/package.json                   WXT/React/Dexie workspace
apps/extension/wxt.config.ts                  MV3 manifest and React module
apps/extension/entrypoints/background.ts      Service Worker entry
apps/extension/entrypoints/firefly.content.tsx Shadow DOM content entry
apps/extension/src/app/cockpit.css              isolated cockpit CSS
apps/extension/src/app/mount-cockpit.tsx       WXT Shadow DOM lifecycle
apps/extension/src/app/Cockpit.tsx             accessible cockpit rendering
apps/extension/src/practice/practice-machine.ts pure transition reducer
apps/extension/src/practice/practice-controller.ts orchestration and key latch
apps/extension/src/practice/word-diff.ts       deterministic word alignment
apps/extension/src/learning/local-ranking.ts   deterministic candidates/fallback
apps/extension/src/ports/*.ts                  site/audio/storage/Gateway boundaries
apps/extension/src/practice/practice-settings.ts modes, keymap, and exam playback policy
apps/extension/src/content/*.ts                strict runtime clients, no Dexie
apps/extension/src/background/storage/db.ts    extension-origin Dexie schema
apps/extension/src/background/storage/repositories.ts atomic fact operations
apps/extension/src/background/start-cockpit-background.ts runtime message owner
packages/contracts/src/site.ts                 site/index schemas and branded tokens
packages/contracts/src/practice.ts             practice/fault schemas
packages/contracts/src/gateway.ts              event, rank, and health schemas
packages/contracts/src/messages.ts             content/Service Worker envelopes
packages/contracts/src/index.ts                public contract barrel
tests/e2e/                                    stable-selector browser and soak tests
```

### Task 1: Pin and Verify the pnpm Monorepo Foundation

**Files:**
- Create: `.node-version`
- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `apps/extension/package.json`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/gateway/package.json`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `tests/e2e/package.json`
- Create: `tests/e2e/tsconfig.json`
- Create: `tests/toolchain.test.ts`
- Create: `tests/setup-indexeddb.ts`
- Generate: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: exact runtime/library versions in Global Constraints.
- Produces: reproducible workspace commands `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.

- [ ] **Step 1: Write the failing workspace-shape test and root manifest**

```ts
// tests/toolchain.test.ts
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

describe("workspace pins", () => {
  test("pins the approved runtime and workspace roots", async () => {
    const root = JSON.parse(await readFile("package.json", "utf8")) as {
      packageManager: string;
      engines: { node: string; pnpm: string };
    };
    const workspace = await readFile("pnpm-workspace.yaml", "utf8");

    expect(root.packageManager).toBe("pnpm@11.7.0");
    expect(root.engines).toEqual({ node: "24.15.0", pnpm: "11.7.0" });
    expect(workspace).toContain("apps/*");
    expect(workspace).toContain("packages/*");
    expect(workspace).toContain("tests/*");
  });
});
```

```json
{
  "name": "pte-pilot",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.7.0",
  "engines": { "node": "24.15.0", "pnpm": "11.7.0" },
  "scripts": {
    "build": "pnpm -r --if-present build",
    "check": "pnpm lint && pnpm typecheck && pnpm test",
    "lint": "biome check .",
    "typecheck": "pnpm -r --if-present typecheck",
    "test": "vitest run --project unit",
    "test:e2e": "playwright test",
    "test:soak": "playwright test tests/e2e/cockpit-soak.spec.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.4",
    "@playwright/test": "1.61.1",
    "@types/node": "24.13.3",
    "@vitejs/plugin-react": "6.0.3",
    "fake-indexeddb": "6.2.5",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  },
  "pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild"] }
}
```

- [ ] **Step 2: Install the minimal root and confirm red state**

Run:

```powershell
node --version
pnpm --version
pnpm install
pnpm exec vitest run tests/toolchain.test.ts --environment node
```

Expected: versions print `v24.15.0` and `11.7.0`; test FAILS with `ENOENT` for `pnpm-workspace.yaml`.

- [ ] **Step 3: Add complete workspace configuration and package manifests**

```text
# .node-version
24.15.0
```

```gitignore
.wxt/
.output/
node_modules/
coverage/
playwright-report/
test-results/
*.tsbuildinfo
apps/gateway/data/
apps/gateway/dist/
```

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
  - tests/*

catalog:
  "@types/react": 19.2.17
  "@types/react-dom": 19.2.3
  "@vitejs/plugin-react": 6.0.3
  "@wxt-dev/module-react": 1.2.2
  dexie: 4.4.4
  fake-indexeddb: 6.2.5
  react: 19.2.7
  react-dom: 19.2.7
  typescript: 6.0.3
  vitest: 4.1.10
  wxt: 0.20.27
  zod: 4.4.3
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useDefineForClassFields": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
  "files": { "includes": ["**", "!!pnpm-lock.yaml", "!!.wxt", "!!.output"] },
  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } }
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: [
            "tests/**/*.test.ts",
            "packages/**/*.test.ts",
            "apps/**/*.test.ts",
            "apps/**/tests/**/*.test.ts",
          ],
          setupFiles: ["tests/setup-indexeddb.ts"],
        },
      },
    ],
  },
});
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: "line",
  use: { headless: true, trace: "retain-on-failure" },
});
```

```json
// apps/extension/package.json
{
  "name": "@pte-pilot/extension",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "wxt build -b chrome",
    "dev": "wxt -b chrome",
    "prepare": "wxt prepare",
    "test": "vitest run --root ../.. --config ../../vitest.config.ts --project unit",
    "typecheck": "wxt prepare && tsc --noEmit"
  },
  "dependencies": {
    "@pte-pilot/contracts": "workspace:*",
    "dexie": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@wxt-dev/module-react": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "wxt": "catalog:"
  }
}
```

```json
// apps/extension/tsconfig.json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

```json
// apps/gateway/package.json
{
  "name": "@pte-pilot/gateway",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": "24.15.0" },
  "dependencies": { "@pte-pilot/contracts": "workspace:*" }
}
```

```json
// packages/contracts/package.json
{
  "name": "@pte-pilot/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./practice": "./src/practice.ts",
    "./site": "./src/site.ts",
    "./gateway": "./src/gateway.ts",
    "./messages": "./src/messages.ts"
  },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": { "typescript": "catalog:" }
}
```

```json
// packages/contracts/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

```json
// tests/e2e/package.json
{
  "name": "@pte-pilot/e2e",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "typecheck": "tsc --noEmit -p tsconfig.json" },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@types/node": "24.13.3",
    "typescript": "catalog:"
  }
}
```

```json
// tests/e2e/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["**/*.ts", "../fixtures/**/*.ts"]
}
```

```ts
// tests/setup-indexeddb.ts
import "fake-indexeddb/auto";
```

- [ ] **Step 4: Install the complete workspace and verify green state**

Run:

```powershell
pnpm install --frozen-lockfile=false
pnpm exec vitest run tests/toolchain.test.ts --environment node
pnpm exec biome check package.json pnpm-workspace.yaml tsconfig.base.json biome.json vitest.config.ts playwright.config.ts
```

Expected: toolchain test PASS; Biome exits `0`; `pnpm-lock.yaml` records exact catalog pins.

- [ ] **Step 5: Commit**

```powershell
git add .node-version .gitignore package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json biome.json vitest.config.ts playwright.config.ts apps/extension/package.json apps/extension/tsconfig.json apps/gateway/package.json packages/contracts/package.json packages/contracts/tsconfig.json tests/e2e/package.json tests/e2e/tsconfig.json tests/toolchain.test.ts tests/setup-indexeddb.ts
git commit -m "build: scaffold pinned pte pilot monorepo"
```

### Task 2: Publish the Shared Zod Contract Surface

**Files:**
- Create: `packages/contracts/src/site.ts`
- Create: `packages/contracts/src/practice.ts`
- Create: `packages/contracts/src/gateway.ts`
- Create: `packages/contracts/src/messages.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/contracts.test.ts`

**Interfaces:**
- Consumes: no application code; only `zod@4.4.3`.
- Produces: `QuestionRefSchema/QuestionRef`, `NavigationEpochSchema/NavigationEpoch`, `AttemptEpochSchema/AttemptEpoch`, `SubmissionTokenSchema/SubmissionToken`, `CaptureTokenSchema/CaptureToken`, `RuntimeFaultSchema/RuntimeFault`, `PracticeStateSchema/PracticeState`, `IndexedQuestionSchema/IndexedQuestion`, `IndexSnapshotSchema/IndexSnapshot`, `AttemptErrorSchema/AttemptError`, `AttemptEventSchema/AttemptEvent`, `BatchUpsertRequestSchema/BatchUpsertRequest`, `BatchUpsertResponseSchema/BatchUpsertResponse`, `RankCandidateSchema/RankCandidate`, `RankRequestSchema/RankRequest`, `RankResponseSchema/RankResponse`, `GatewayHealthSchema/GatewayHealth`, `UserSettingsSchema/UserSettings`, and `WordStatSummarySchema/WordStatSummary`.

- [ ] **Step 1: Write failing cross-plan schema tests**

```ts
// packages/contracts/src/contracts.test.ts
import { describe, expect, test } from "vitest";
import {
  AttemptEpochSchema,
  AttemptEventSchema,
  BatchUpsertRequestSchema,
  GatewayHealthSchema,
  IndexSnapshotSchema,
  NavigationEpochSchema,
  PracticeStateSchema,
  QuestionRefSchema,
  RankRequestSchema,
  RuntimeRequestSchema,
  SubmissionTokenSchema,
} from "./index";

const question = QuestionRefSchema.parse({
  questionId: "131020",
  position: 12,
  total: 192,
  predictionEdition: "yc-2026-w29",
});

describe("shared contracts", () => {
  test("brands epochs and tokens through schema parsing", () => {
    expect(NavigationEpochSchema.parse(0)).toBe(0);
    expect(AttemptEpochSchema.parse(4)).toBe(4);
    expect(SubmissionTokenSchema.parse("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")).toMatch(
      /^[0-9a-f-]+$/,
    );
    expect(() => NavigationEpochSchema.parse(-1)).toThrow();
  });

  test("rejects impossible question positions and incomplete complete snapshots", () => {
    expect(() => QuestionRefSchema.parse({ ...question, position: 193 })).toThrow();
    expect(() =>
      IndexSnapshotSchema.parse({
        predictionEdition: "yc-2026-w29",
        orderedQuestionIds: ["131020"],
        siteTotal: 192,
        completeness: "complete",
        schemaVersion: 1,
      }),
    ).toThrow();
  });

  test("parses the immutable attempt and Gateway request", () => {
    const attempt = AttemptEventSchema.parse({
      attemptId: "81d4e9de-457d-4b86-a51a-e93996dcb1ac",
      questionId: "131020",
      accuracy: 0.75,
      durationMs: 8400,
      replayCount: 1,
      errors: [{ expected: "sentence", actual: "sentense", type: "spelling" }],
      completedAt: "2026-07-15T10:00:00.000Z",
    });
    expect(BatchUpsertRequestSchema.parse({
      batchId: "f7cb19be-7aa2-4e80-bc4b-6f2c924b864f",
      events: [attempt],
    }).events).toHaveLength(1);
    expect(RankRequestSchema.parse({
      decisionId: "fbbe1ba0-e458-49ab-b03a-0ceebb1d32a8",
      candidateSetHash: `sha256:${"a".repeat(64)}`,
      learnerStateVersion: 3,
      candidates: [{
        questionId: "131020",
        dueScore: 1,
        weaknessScore: 0.5,
        noveltyScore: 0,
        marked: false,
        attemptCount: 2,
        lastAttemptAt: "2026-07-15T10:00:00.000Z",
      }],
    }).candidates).toHaveLength(1);
  });

  test("parses flat runtime state and strict runtime message", () => {
    expect(PracticeStateSchema.parse({
      phase: "ANSWERING",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      attemptEpoch: AttemptEpochSchema.parse(0),
      audioStatus: "READY",
      indexStatus: "PARTIAL",
      hermesOnline: false,
      fault: null,
    }).phase).toBe("ANSWERING");
    expect(RuntimeRequestSchema.parse({
      requestId: "89ed35f1-88a3-41a6-b7af-ddb26bb1ed48",
      action: "storage/loadDraft",
      predictionEdition: "yc-2026-w29",
      questionId: "131020",
    }).action).toBe("storage/loadDraft");
  });

  test("requires exact Gateway identity and bounded capabilities", () => {
    expect(GatewayHealthSchema.parse({
      service: "pte-pilot",
      status: "degraded",
      profile: "pte-pilot",
      schemaVersion: 1,
      projectionInstanceId: "ef8153d5-87c5-48f4-9340-d369927b801f",
      projectionVersion: 0,
      capabilities: ["events:batchUpsert", "rank", "pair"],
      hermes: {
        status: "offline",
        model: null,
        enabledTools: [],
        unexpectedTools: [],
      },
    }).profile).toBe("pte-pilot");
  });
});
```

- [ ] **Step 2: Run the contract test and verify red state**

Run: `pnpm exec vitest run packages/contracts/src/contracts.test.ts --environment node`

Expected: FAIL with `Cannot find module './index'`.

- [ ] **Step 3: Implement site and practice contracts**

```ts
// packages/contracts/src/site.ts
import { z } from "zod";

export const QuestionRefSchema = z
  .object({
    questionId: z.string().min(1),
    position: z.number().int().positive(),
    total: z.number().int().positive(),
    predictionEdition: z.string().min(1),
  })
  .superRefine((value, context) => {
    if (value.position > value.total) {
      context.addIssue({ code: "custom", message: "position exceeds total", path: ["position"] });
    }
  });
export type QuestionRef = z.infer<typeof QuestionRefSchema>;

export const NavigationEpochSchema = z.number().int().nonnegative().brand<"NavigationEpoch">();
export type NavigationEpoch = z.infer<typeof NavigationEpochSchema>;

export const CaptureTokenSchema = z.string().uuid().brand<"CaptureToken">();
export type CaptureToken = z.infer<typeof CaptureTokenSchema>;

export const IndexedQuestionSchema = z.object({
  predictionEdition: z.string().min(1),
  questionId: z.string().min(1),
  sitePosition: z.number().int().positive(),
  siteTotal: z.number().int().positive(),
  tags: z.array(z.string()),
  mediaLocator: z.string().min(1).optional(),
  discoveredAt: z.string().datetime(),
  schemaVersion: z.number().int().positive(),
});
export type IndexedQuestion = z.infer<typeof IndexedQuestionSchema>;

export const IndexSnapshotSchema = z
  .object({
    predictionEdition: z.string().min(1),
    orderedQuestionIds: z.array(z.string().min(1)),
    siteTotal: z.number().int().positive(),
    completeness: z.enum(["complete", "partial"]),
    checkpointPosition: z.number().int().positive().optional(),
    schemaVersion: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (new Set(value.orderedQuestionIds).size !== value.orderedQuestionIds.length) {
      context.addIssue({ code: "custom", message: "question IDs must be unique" });
    }
    if (value.orderedQuestionIds.length > value.siteTotal) {
      context.addIssue({ code: "custom", message: "snapshot exceeds site total" });
    }
    if (value.completeness === "complete" && value.orderedQuestionIds.length !== value.siteTotal) {
      context.addIssue({ code: "custom", message: "complete snapshot must cover 1..N" });
    }
  });
export type IndexSnapshot = z.infer<typeof IndexSnapshotSchema>;
```

```ts
// packages/contracts/src/practice.ts
import { z } from "zod";
import { NavigationEpochSchema, QuestionRefSchema } from "./site";

export const AttemptEpochSchema = z.number().int().nonnegative().brand<"AttemptEpoch">();
export type AttemptEpoch = z.infer<typeof AttemptEpochSchema>;

export const SubmissionTokenSchema = z.string().uuid().brand<"SubmissionToken">();
export type SubmissionToken = z.infer<typeof SubmissionTokenSchema>;

export const RuntimeFaultSchema = z.object({
  code: z.enum(["AUTH_REQUIRED", "SITE_CHANGED", "DESYNC", "AUDIO_ERROR", "INDEX_PARTIAL"]),
  message: z.string().min(1),
  recoverable: z.boolean(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type RuntimeFault = z.infer<typeof RuntimeFaultSchema>;

export const MainPhaseSchema = z.enum([
  "AUTH_REQUIRED",
  "PROBING",
  "READY",
  "ANSWERING",
  "COMMAND",
  "SUBMITTING",
  "REVIEW",
  "NAVIGATING",
  "RESETTING",
  "PAUSED",
]);
export type MainPhase = z.infer<typeof MainPhaseSchema>;

export const AudioStatusSchema = z.enum(["EMPTY", "RESOLVING", "READY", "PLAYING", "PAUSED", "ENDED"]);
export type AudioStatus = z.infer<typeof AudioStatusSchema>;

export const IndexStatusSchema = z.enum(["IDLE", "DISCOVERING", "INDEXING", "COMPLETE", "PARTIAL", "PAUSED", "FAILED"]);
export type IndexStatus = z.infer<typeof IndexStatusSchema>;

export const PracticeStateSchema = z.object({
  phase: MainPhaseSchema,
  question: QuestionRefSchema.nullable(),
  navigationEpoch: NavigationEpochSchema,
  attemptEpoch: AttemptEpochSchema,
  audioStatus: AudioStatusSchema,
  indexStatus: IndexStatusSchema,
  hermesOnline: z.boolean(),
  fault: RuntimeFaultSchema.nullable(),
});
export type PracticeState = z.infer<typeof PracticeStateSchema>;
```

- [ ] **Step 4: Implement Gateway and runtime-message contracts**

```ts
// packages/contracts/src/gateway.ts
import { z } from "zod";

export const AttemptErrorSchema = z.object({
  expected: z.string(),
  actual: z.string(),
  type: z.enum(["missing", "extra", "spelling", "substitution", "order", "word_form"]),
});
export type AttemptError = z.infer<typeof AttemptErrorSchema>;

export const AttemptEventSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().min(1),
  accuracy: z.number().min(0).max(1),
  durationMs: z.number().int().nonnegative(),
  replayCount: z.number().int().nonnegative(),
  errors: z.array(AttemptErrorSchema),
  completedAt: z.string().datetime(),
});
export type AttemptEvent = z.infer<typeof AttemptEventSchema>;

export const BatchUpsertRequestSchema = z.object({
  batchId: z.string().uuid(),
  events: z.array(AttemptEventSchema).min(1).max(100),
});
export type BatchUpsertRequest = z.infer<typeof BatchUpsertRequestSchema>;

export const BatchUpsertResponseSchema = z.object({
  batchId: z.string().uuid(),
  ackedAttemptIds: z.array(z.string().uuid()),
  projectionInstanceId: z.string().uuid(),
  projectionVersion: z.number().int().nonnegative(),
});
export type BatchUpsertResponse = z.infer<typeof BatchUpsertResponseSchema>;

export const RankCandidateSchema = z.object({
  questionId: z.string().min(1),
  dueScore: z.number().min(0).max(1),
  weaknessScore: z.number().min(0).max(1),
  noveltyScore: z.number().min(0).max(1),
  marked: z.boolean(),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptAt: z.string().datetime().nullable(),
});
export type RankCandidate = z.infer<typeof RankCandidateSchema>;

const CandidateSetHashSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

export const RankRequestSchema = z.object({
  decisionId: z.string().uuid(),
  candidateSetHash: CandidateSetHashSchema,
  learnerStateVersion: z.number().int().nonnegative(),
  candidates: z.array(RankCandidateSchema).min(1).max(100),
});
export type RankRequest = z.infer<typeof RankRequestSchema>;

export const RankResponseSchema = z.object({
  decisionId: z.string().uuid(),
  candidateSetHash: CandidateSetHashSchema,
  learnerStateVersion: z.number().int().nonnegative(),
  rankedQuestionIds: z.array(z.string().min(1)),
});
export type RankResponse = z.infer<typeof RankResponseSchema>;

export const GatewayHealthSchema = z.object({
  service: z.literal("pte-pilot"),
  status: z.enum(["ready", "degraded"]),
  profile: z.literal("pte-pilot"),
  schemaVersion: z.literal(1),
  projectionInstanceId: z.string().uuid(),
  projectionVersion: z.number().int().nonnegative(),
  capabilities: z.tuple([
    z.literal("events:batchUpsert"),
    z.literal("rank"),
    z.literal("pair"),
  ]),
  hermes: z.object({
    status: z.enum(["ready", "offline", "rejected"]),
    model: z.string().nullable(),
    enabledTools: z.array(z.string()),
    unexpectedTools: z.array(z.string()),
  }),
});
export type GatewayHealth = z.infer<typeof GatewayHealthSchema>;
```

```ts
// packages/contracts/src/messages.ts
import { z } from "zod";
import {
  AttemptErrorSchema,
  AttemptEventSchema,
  GatewayHealthSchema,
  RankCandidateSchema,
  RankRequestSchema,
  RankResponseSchema,
} from "./gateway";
import { IndexedQuestionSchema, IndexSnapshotSchema, QuestionRefSchema } from "./site";

export const DraftCheckpointSchema = z.object({
  predictionEdition: z.string().min(1),
  questionId: z.string().min(1),
  text: z.string(),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type DraftCheckpoint = z.infer<typeof DraftCheckpointSchema>;

export const CandidateFactSchema = z.object({
  questionId: z.string().min(1),
  dueAt: z.string().datetime().nullable(),
  attemptCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  lastAccuracy: z.number().min(0).max(1).nullable(),
  lastAttemptAt: z.string().datetime().nullable(),
  marked: z.boolean(),
});
export type CandidateFact = z.infer<typeof CandidateFactSchema>;

export const RestoredSessionSchema = z.object({
  question: QuestionRefSchema.nullable(),
  draft: DraftCheckpointSchema.nullable(),
});
export type RestoredSession = z.infer<typeof RestoredSessionSchema>;

export const RankCandidateSnapshotSchema = z.object({
  learnerStateVersion: z.number().int().nonnegative(),
  candidates: z.array(RankCandidateSchema),
});
export type RankCandidateSnapshot = z.infer<typeof RankCandidateSnapshotSchema>;

export const UserSettingsSchema = z.object({
  id: z.literal("current"),
  mode: z.enum(["practice", "exam"]),
  audioStrategy: z.enum(["site-player-only", "transfer-to-extension"]),
  keymap: z.record(z.string().min(1), z.string().min(1)),
  updatedAt: z.string().datetime(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const WordStatSummarySchema = z.object({
  key: z.string().min(1),
  expected: z.string(),
  actual: z.string(),
  type: AttemptErrorSchema.shape.type,
  occurrences: z.number().int().positive(),
  lastSeenAt: z.string().datetime(),
});
export type WordStatSummary = z.infer<typeof WordStatSummarySchema>;

const RequestIdSchema = z.string().uuid();
export const RuntimeRequestSchema = z.discriminatedUnion("action", [
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/loadDraft"), predictionEdition: z.string().min(1), questionId: z.string().min(1) }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/saveDraft"), draft: DraftCheckpointSchema }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/commitAttempt"), predictionEdition: z.string().min(1), attempt: AttemptEventSchema }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/setMarked"), predictionEdition: z.string().min(1), questionId: z.string().min(1), marked: z.boolean() }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/getRankCandidates"), predictionEdition: z.string().min(1), questionIds: z.array(z.string().min(1)).min(1).max(100) }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/restoreSession") }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/saveSession"), question: QuestionRefSchema }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/loadIndexSnapshot"), predictionEdition: z.string().min(1) }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/saveIndexSnapshot"), snapshot: IndexSnapshotSchema, questions: z.array(IndexedQuestionSchema) }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/loadSettings") }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/saveSettings"), settings: UserSettingsSchema }),
  z.object({ requestId: RequestIdSchema, action: z.literal("storage/listWordStats"), limit: z.number().int().positive().max(500) }),
  z.object({ requestId: RequestIdSchema, action: z.literal("gateway/health") }),
  z.object({ requestId: RequestIdSchema, action: z.literal("gateway/rank"), request: RankRequestSchema }),
]);
export type RuntimeRequest = z.infer<typeof RuntimeRequestSchema>;

export const RuntimeSuccessSchema = z.discriminatedUnion("action", [
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/loadDraft"), draft: DraftCheckpointSchema.nullable() }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/saveDraft") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/commitAttempt") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/setMarked") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/getRankCandidates"), snapshot: RankCandidateSnapshotSchema }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/restoreSession"), session: RestoredSessionSchema }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/saveSession") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/loadIndexSnapshot"), snapshot: IndexSnapshotSchema.nullable(), questions: z.array(IndexedQuestionSchema) }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/saveIndexSnapshot") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/loadSettings"), settings: UserSettingsSchema.nullable() }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/saveSettings") }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("storage/listWordStats"), words: z.array(WordStatSummarySchema) }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("gateway/health"), health: GatewayHealthSchema }),
  z.object({ requestId: RequestIdSchema, ok: z.literal(true), action: z.literal("gateway/rank"), response: RankResponseSchema }),
]);
export type RuntimeSuccess = z.infer<typeof RuntimeSuccessSchema>;

export const RuntimeFailureSchema = z.object({
  requestId: RequestIdSchema,
  ok: z.literal(false),
  action: z.string().min(1),
  reason: z.enum(["offline", "timeout", "unauthorized", "invalid-request", "invalid-response", "storage-failure"]),
});
export type RuntimeFailure = z.infer<typeof RuntimeFailureSchema>;
export const RuntimeResponseSchema = z.union([RuntimeSuccessSchema, RuntimeFailureSchema]);
export type RuntimeResponse = z.infer<typeof RuntimeResponseSchema>;
```

```ts
// packages/contracts/src/index.ts
export * from "./gateway";
export * from "./messages";
export * from "./practice";
export * from "./site";
```

- [ ] **Step 5: Run contract tests and typecheck**

Run:

```powershell
pnpm exec vitest run packages/contracts/src/contracts.test.ts --environment node
pnpm --filter @pte-pilot/contracts typecheck
```

Expected: all five tests PASS; TypeScript exits `0` with branded types preserved.

- [ ] **Step 6: Commit**

```powershell
git add packages/contracts/src
git commit -m "feat: publish shared pte pilot contracts"
```

### Task 3: Define Runtime Ports and the Pure Practice State Machine

**Files:**
- Create: `apps/extension/src/ports/firefly-site-port.ts`
- Create: `apps/extension/src/ports/audio-port.ts`
- Create: `apps/extension/src/ports/submission-gate-port.ts`
- Create: `apps/extension/src/ports/navigation-port.ts`
- Create: `apps/extension/src/ports/index-port.ts`
- Create: `apps/extension/src/ports/storage-port.ts`
- Create: `apps/extension/src/ports/gateway-port.ts`
- Create: `apps/extension/src/practice/practice-machine.ts`
- Create: `apps/extension/src/practice/practice-machine.test.ts`

**Interfaces:**
- Consumes: branded epochs/tokens, `QuestionRef`, `PracticeState`, `AttemptEvent`, message records, and Gateway request/response contracts.
- Produces: stable ports for Firefly/Gateway/integration plans and pure `transition(state: PracticeMachineState, event: PracticeEvent): PracticeMachineState`.

- [ ] **Step 1: Write state transition tests, including physical Enter release**

```ts
// apps/extension/src/practice/practice-machine.test.ts
import { describe, expect, test } from "vitest";
import {
  AttemptEpochSchema,
  NavigationEpochSchema,
  QuestionRefSchema,
  SubmissionTokenSchema,
} from "@pte-pilot/contracts";
import { createInitialMachineState, transition } from "./practice-machine";

const question = QuestionRefSchema.parse({
  questionId: "131020",
  position: 12,
  total: 192,
  predictionEdition: "yc-2026-w29",
});

describe("practice machine", () => {
  test("enters answering only after a verified question", () => {
    const state = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "saved",
    });
    expect(state.runtime.phase).toBe("ANSWERING");
    expect(state.draft).toBe("saved");
  });

  test("opens and expires command mode without changing draft", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "words",
    });
    const command = transition(answering, { type: "OPEN_COMMAND", nowMs: 100 });
    expect(command.runtime.phase).toBe("COMMAND");
    expect(transition(command, { type: "COMMAND_TIMEOUT", nowMs: 1_599 }).runtime.phase).toBe("COMMAND");
    expect(transition(command, { type: "COMMAND_TIMEOUT", nowMs: 1_600 }).runtime.phase).toBe("ANSWERING");
  });

  test("requires keyup and guard expiry before review can navigate", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "a sentence",
    });
    const submitting = transition(answering, {
      type: "SUBMIT_REQUESTED",
      attemptEpoch: AttemptEpochSchema.parse(1),
      submissionToken: SubmissionTokenSchema.parse("d6babbf0-bb7d-4ca8-b709-f226b1828b19"),
    });
    const review = transition(submitting, {
      type: "SUBMIT_SUCCEEDED",
      submissionToken: SubmissionTokenSchema.parse("d6babbf0-bb7d-4ca8-b709-f226b1828b19"),
      attempt: {
        attemptId: "41575b51-4976-40cb-a210-6ea26934dab0",
        questionId: "131020",
        accuracy: 1,
        durationMs: 1_000,
        replayCount: 0,
        errors: [],
        completedAt: "2026-07-15T10:00:00.000Z",
      },
      nowMs: 1_000,
    });
    expect(transition(review, { type: "NAVIGATE_REQUESTED", target: "next", nowMs: 2_000 }).runtime.phase).toBe("REVIEW");
    const released = transition(review, { type: "ENTER_KEYUP" });
    expect(transition(released, { type: "NAVIGATE_REQUESTED", target: "next", nowMs: 1_399 }).runtime.phase).toBe("REVIEW");
    expect(transition(released, { type: "NAVIGATE_REQUESTED", target: "next", nowMs: 1_400 }).runtime.phase).toBe("NAVIGATING");
  });

  test("rejects stale submission tokens", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "answer",
    });
    const submitting = transition(answering, {
      type: "SUBMIT_REQUESTED",
      attemptEpoch: AttemptEpochSchema.parse(1),
      submissionToken: SubmissionTokenSchema.parse("d6babbf0-bb7d-4ca8-b709-f226b1828b19"),
    });
    const stale = transition(submitting, {
      type: "SUBMIT_SUCCEEDED",
      submissionToken: SubmissionTokenSchema.parse("bbd12b3d-0768-40a0-9bd5-4337b25d68b5"),
      attempt: {
        attemptId: "41575b51-4976-40cb-a210-6ea26934dab0",
        questionId: "131020",
        accuracy: 1,
        durationMs: 1_000,
        replayCount: 0,
        errors: [],
        completedAt: "2026-07-15T10:00:00.000Z",
      },
      nowMs: 1_000,
    });
    expect(stale).toBe(submitting);
  });

  test("rejects a navigation completion from an older epoch", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "",
    });
    const navigating = transition(answering, {
      type: "SITE_NAVIGATION_STARTED",
      navigationEpoch: NavigationEpochSchema.parse(2),
    });
    const stale = transition(navigating, {
      type: "NAVIGATION_SUCCEEDED",
      question: { ...question, questionId: "old" },
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "old draft",
    });
    expect(stale).toBe(navigating);
  });
});
```

- [ ] **Step 2: Run the state test and verify red state**

Run: `pnpm exec vitest run apps/extension/src/practice/practice-machine.test.ts --environment node`

Expected: FAIL with `Cannot find module './practice-machine'`.

- [ ] **Step 3: Define exact site, audio, storage, and Gateway ports**

```ts
// apps/extension/src/ports/firefly-site-port.ts
import type {
  AttemptEpoch,
  IndexedQuestion,
  NavigationEpoch,
  QuestionRef,
  SubmissionToken,
} from "@pte-pilot/contracts";

export type SemanticAction = "previous" | "next" | "select-question" | "write-answer" | "score" | "reveal-answer" | "redo" | "play";
export type SiteStopReason = "auth-required" | "forbidden" | "rate-limited" | "captcha" | "site-changed";
export interface AnswerSurfaceProof { visible: boolean; signature: string }
export interface FireflyCapabilities { previous: boolean; next: boolean; selectQuestion: boolean; score: boolean; revealAnswer: boolean; redo: boolean; play: boolean; structuredList: boolean }
export interface FireflySiteSnapshot { question: QuestionRef | null; inputValue: string; answerSurface: AnswerSurfaceProof; capabilities: FireflyCapabilities; stopReason: SiteStopReason | null }
export type NavigationIntent = { kind: "previous" } | { kind: "next" } | { kind: "select"; position: number };
export type NavigationExpectation = { questionId: string } | { position: number } | { direction: -1 | 1; fromPosition: number };
export interface SiteOperationContext { question: QuestionRef; navigationEpoch: NavigationEpoch; signal: AbortSignal }
export interface SubmissionContext extends SiteOperationContext { attemptEpoch: AttemptEpoch; submissionToken: SubmissionToken }

export interface FireflySitePort {
  readSnapshot(): FireflySiteSnapshot;
  observe(listener: (snapshot: FireflySiteSnapshot) => void): () => void;
  navigate(intent: NavigationIntent, context: SiteOperationContext): Promise<void>;
  writeAnswer(value: string, context: SubmissionContext): Promise<string>;
  scoreAndWait(context: SubmissionContext): Promise<void>;
  revealAnswer(context: SubmissionContext): Promise<void>;
  readRevealedAnswer(context: SubmissionContext): string | null;
  redo(context: SiteOperationContext): Promise<void>;
  playNative(context: SiteOperationContext): Promise<void>;
  readStructuredList(signal: AbortSignal): Promise<readonly IndexedQuestion[] | null>;
}
```

`FireflySitePort` is a raw adapter interface used only while composing the Firefly gates. `PracticeController` must not import it. `scoreAndWait()` arms its completion observer before clicking Score, then checks both synchronous and asynchronous transitions.

```ts
// apps/extension/src/ports/submission-gate-port.ts
import type {
  AttemptEpoch,
  AttemptError,
  NavigationEpoch,
  QuestionRef,
  SubmissionToken,
} from "@pte-pilot/contracts";

export interface VerifiedSubmissionFacts {
  accuracy: number;
  errors: AttemptError[];
}

export interface SubmissionTransaction {
  readonly attemptEpoch: AttemptEpoch;
  readonly submissionToken: SubmissionToken;
  readonly navigationEpoch: NavigationEpoch;
  run(): Promise<VerifiedSubmissionFacts>;
}

export interface SubmissionGatePort {
  begin(input: {
    question: QuestionRef;
    navigationEpoch: NavigationEpoch;
    userAnswer: string;
  }): SubmissionTransaction;
  invalidateBefore(nextNavigationEpoch: NavigationEpoch): void;
  dispose(): void;
}
```

```ts
// apps/extension/src/ports/navigation-port.ts
import type { NavigationEpoch, QuestionRef, RuntimeFault } from "@pte-pilot/contracts";
import type { NavigationTarget } from "../practice/practice-machine";

export interface NavigationResult {
  question: QuestionRef;
  navigationEpoch: NavigationEpoch;
  source: "extension" | "site" | "index" | "redo" | "probe";
}
export interface NavigationHandlers {
  beforeLeave(): Promise<void>;
  onObserved(result: NavigationResult): Promise<void> | void;
  onFault(fault: RuntimeFault): void;
}

export interface NavigationPort {
  start(handlers: NavigationHandlers): () => void;
  probe(signal?: AbortSignal): Promise<NavigationResult>;
  navigate(target: NavigationTarget, signal?: AbortSignal): Promise<NavigationResult>;
  redo(signal?: AbortSignal): Promise<NavigationResult>;
  dispose(): void;
}
```

For `site-observed` navigation, the coordinator must await `beforeLeave()` and then re-read the latest live snapshot before `onObserved()`. `probe()` accepts the initial question into the same epoch counter without clicking. No result with an epoch less than or equal to the last accepted result may be emitted.

```ts
// apps/extension/src/ports/index-port.ts
import type { QuestionRef, RuntimeFault } from "@pte-pilot/contracts";

export interface IndexPort {
  startOrResume(signal?: AbortSignal): Promise<{ status: "complete" | "partial"; predictionEdition: string; indexed: number; total: number; fault?: RuntimeFault }>;
  findQuestion(questionId: string): Promise<QuestionRef | null>;
  pause(): void;
  dispose(): void;
}
```

```ts
// apps/extension/src/ports/audio-port.ts
import type { NavigationEpoch, PracticeState, QuestionRef } from "@pte-pilot/contracts";

export interface AudioPort {
  bind(question: QuestionRef, epoch: NavigationEpoch): Promise<void>;
  getStatus(): PracticeState["audioStatus"];
  subscribe(listener: (status: PracticeState["audioStatus"]) => void): () => void;
  toggle(): Promise<void>;
  restart(): Promise<void>;
  useSitePlayer(): Promise<void>;
  invalidateBefore(epoch: NavigationEpoch): void;
  dispose(): void;
}
```

```ts
// apps/extension/src/ports/storage-port.ts
import type {
  AttemptEvent,
  DraftCheckpoint,
  IndexedQuestion,
  IndexSnapshot,
  QuestionRef,
  RankCandidateSnapshot,
  RestoredSession,
  UserSettings,
  WordStatSummary,
} from "@pte-pilot/contracts";

export interface StoragePort {
  loadDraft(predictionEdition: string, questionId: string): Promise<DraftCheckpoint | null>;
  saveDraft(draft: DraftCheckpoint): Promise<void>;
  commitAttempt(predictionEdition: string, attempt: AttemptEvent): Promise<void>;
  setMarked(predictionEdition: string, questionId: string, marked: boolean): Promise<void>;
  getRankCandidates(predictionEdition: string, questionIds: readonly string[]): Promise<RankCandidateSnapshot>;
  restoreSession(): Promise<RestoredSession>;
  saveSession(question: QuestionRef): Promise<void>;
  loadIndexSnapshot(predictionEdition: string): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }>;
  saveIndexSnapshot(snapshot: IndexSnapshot, questions: readonly IndexedQuestion[]): Promise<void>;
  loadSettings(): Promise<UserSettings | null>;
  saveSettings(settings: UserSettings): Promise<void>;
  listWordStats(limit: number): Promise<WordStatSummary[]>;
}
```

```ts
// apps/extension/src/ports/gateway-port.ts
import type { GatewayHealth, RankRequest, RankResponse } from "@pte-pilot/contracts";

export interface GatewayPort {
  health(signal?: AbortSignal): Promise<GatewayHealth>;
  rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse>;
}
```

- [ ] **Step 4: Implement the pure reducer**

```ts
// apps/extension/src/practice/practice-machine.ts
import {
  AttemptEpochSchema,
  NavigationEpochSchema,
  type AttemptEpoch,
  type AttemptEvent,
  type AudioStatus,
  type IndexStatus,
  type NavigationEpoch,
  type PracticeState,
  type QuestionRef,
  type RuntimeFault,
  type SubmissionToken,
} from "@pte-pilot/contracts";

export type NavigationTarget = "next" | "previous" | { questionId: string };

export interface PracticeMachineState {
  runtime: PracticeState;
  draft: string;
  review: AttemptEvent | null;
  submissionToken: SubmissionToken | null;
  enterGate: "released" | "held-from-submit";
  reviewGuardUntilMs: number | null;
  commandDeadlineMs: number | null;
  navigationTarget: NavigationTarget | null;
}

export type PracticeEvent =
  | { type: "QUESTION_READY"; question: QuestionRef; navigationEpoch: NavigationEpoch; restoredDraft: string }
  | { type: "DRAFT_RESTORED"; value: string }
  | { type: "OPEN_COMMAND"; nowMs: number }
  | { type: "CLOSE_COMMAND" }
  | { type: "COMMAND_TIMEOUT"; nowMs: number }
  | { type: "SUBMIT_REQUESTED"; attemptEpoch: AttemptEpoch; submissionToken: SubmissionToken }
  | { type: "SUBMIT_SUCCEEDED"; submissionToken: SubmissionToken; attempt: AttemptEvent; nowMs: number }
  | { type: "ENTER_KEYUP" }
  | { type: "NAVIGATE_REQUESTED"; target: NavigationTarget; nowMs: number }
  | { type: "SITE_NAVIGATION_STARTED"; navigationEpoch: NavigationEpoch }
  | { type: "NAVIGATION_SUCCEEDED"; question: QuestionRef; navigationEpoch: NavigationEpoch; restoredDraft: string }
  | { type: "REDO_REQUESTED" }
  | { type: "RESET_SUCCEEDED"; question: QuestionRef; navigationEpoch: NavigationEpoch }
  | { type: "AUDIO_STATUS_CHANGED"; status: AudioStatus }
  | { type: "INDEX_STATUS_CHANGED"; status: IndexStatus }
  | { type: "HERMES_STATUS_CHANGED"; online: boolean }
  | { type: "FAULTED"; fault: RuntimeFault }
  | { type: "RETRY" }
  | { type: "PAUSE" };

export function createInitialMachineState(): PracticeMachineState {
  return {
    runtime: {
      phase: "PROBING",
      question: null,
      navigationEpoch: NavigationEpochSchema.parse(0),
      attemptEpoch: AttemptEpochSchema.parse(0),
      audioStatus: "EMPTY",
      indexStatus: "IDLE",
      hermesOnline: false,
      fault: null,
    },
    draft: "",
    review: null,
    submissionToken: null,
    enterGate: "released",
    reviewGuardUntilMs: null,
    commandDeadlineMs: null,
    navigationTarget: null,
  };
}

const updateRuntime = (state: PracticeMachineState, change: Partial<PracticeState>): PracticeMachineState => ({
  ...state,
  runtime: { ...state.runtime, ...change },
});

export function transition(state: PracticeMachineState, event: PracticeEvent): PracticeMachineState {
  switch (event.type) {
    case "QUESTION_READY":
      if (Number(event.navigationEpoch) <= Number(state.runtime.navigationEpoch)) return state;
      return {
        ...state,
        runtime: { ...state.runtime, phase: "ANSWERING", question: event.question, navigationEpoch: event.navigationEpoch, fault: null },
        draft: event.restoredDraft,
        review: null,
        submissionToken: null,
        enterGate: "released",
        reviewGuardUntilMs: null,
        commandDeadlineMs: null,
        navigationTarget: null,
      };
    case "NAVIGATION_SUCCEEDED":
      if (state.runtime.phase !== "NAVIGATING" || Number(event.navigationEpoch) <= Number(state.runtime.navigationEpoch)) return state;
      return {
        ...state,
        runtime: { ...state.runtime, phase: "ANSWERING", question: event.question, navigationEpoch: event.navigationEpoch, fault: null },
        draft: event.restoredDraft,
        review: null,
        submissionToken: null,
        enterGate: "released",
        reviewGuardUntilMs: null,
        commandDeadlineMs: null,
        navigationTarget: null,
      };
    case "DRAFT_RESTORED":
      return { ...state, draft: event.value };
    case "OPEN_COMMAND":
      return state.runtime.phase === "ANSWERING"
        ? { ...updateRuntime(state, { phase: "COMMAND" }), commandDeadlineMs: event.nowMs + 1_500 }
        : state;
    case "CLOSE_COMMAND":
      return state.runtime.phase === "COMMAND"
        ? { ...updateRuntime(state, { phase: "ANSWERING" }), commandDeadlineMs: null }
        : state;
    case "COMMAND_TIMEOUT":
      return state.runtime.phase === "COMMAND" && state.commandDeadlineMs !== null && event.nowMs >= state.commandDeadlineMs
        ? { ...updateRuntime(state, { phase: "ANSWERING" }), commandDeadlineMs: null }
        : state;
    case "SUBMIT_REQUESTED":
      return state.runtime.phase === "ANSWERING" && state.draft.trim().length > 0
        ? {
            ...updateRuntime(state, { phase: "SUBMITTING", attemptEpoch: event.attemptEpoch }),
            submissionToken: event.submissionToken,
            enterGate: "held-from-submit",
          }
        : state;
    case "SUBMIT_SUCCEEDED":
      if (state.runtime.phase !== "SUBMITTING" || state.submissionToken !== event.submissionToken) return state;
      return {
        ...updateRuntime(state, { phase: "REVIEW" }),
        review: event.attempt,
        reviewGuardUntilMs: event.nowMs + 400,
      };
    case "ENTER_KEYUP":
      return state.enterGate === "held-from-submit" ? { ...state, enterGate: "released" } : state;
    case "NAVIGATE_REQUESTED": {
      const answering = state.runtime.phase === "ANSWERING";
      const reviewReady = state.runtime.phase === "REVIEW" && state.enterGate === "released" && state.reviewGuardUntilMs !== null && event.nowMs >= state.reviewGuardUntilMs;
      return answering || reviewReady
        ? {
            ...updateRuntime(state, {
              phase: "NAVIGATING",
            }),
            navigationTarget: event.target,
          }
        : state;
    }
    case "SITE_NAVIGATION_STARTED":
      return Number(event.navigationEpoch) > Number(state.runtime.navigationEpoch)
        ? {
            ...updateRuntime(state, { phase: "NAVIGATING" }),
            navigationTarget: null,
          }
        : state;
    case "REDO_REQUESTED":
      return state.runtime.phase === "REVIEW" ? updateRuntime(state, { phase: "RESETTING" }) : state;
    case "RESET_SUCCEEDED":
      return state.runtime.phase === "RESETTING"
        ? { ...updateRuntime(state, { phase: "ANSWERING", question: event.question, navigationEpoch: event.navigationEpoch }), draft: "", review: null, submissionToken: null, enterGate: "released", reviewGuardUntilMs: null }
        : state;
    case "AUDIO_STATUS_CHANGED":
      return updateRuntime(state, { audioStatus: event.status });
    case "INDEX_STATUS_CHANGED":
      return updateRuntime(state, { indexStatus: event.status });
    case "HERMES_STATUS_CHANGED":
      return updateRuntime(state, { hermesOnline: event.online });
    case "FAULTED":
      return updateRuntime(state, { phase: event.fault.code === "AUTH_REQUIRED" ? "AUTH_REQUIRED" : "PAUSED", fault: event.fault });
    case "RETRY":
      return state.runtime.fault?.recoverable ? updateRuntime(state, { phase: "PROBING", fault: null }) : state;
    case "PAUSE":
      return updateRuntime(state, { phase: "PAUSED" });
  }
}
```

- [ ] **Step 5: Run state tests and workspace typecheck**

Run:

```powershell
pnpm exec vitest run apps/extension/src/practice/practice-machine.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
```

Expected: five tests PASS; TypeScript exits `0`.

- [ ] **Step 6: Commit**

```powershell
git add apps/extension/src/ports apps/extension/src/practice/practice-machine.ts apps/extension/src/practice/practice-machine.test.ts
git commit -m "feat: add pure practice state machine and ports"
```

### Task 4: Build the Deterministic WFD Word-Diff Engine

**Files:**
- Create: `apps/extension/src/practice/word-diff.ts`
- Create: `apps/extension/src/practice/word-diff.test.ts`

**Interfaces:**
- Consumes: raw submitted text and the verified post-submit reference string.
- Produces: `diffWords(expected: string, actual: string): WordDiffResult`; output errors are valid `AttemptError[]` and never use an LLM.

- [ ] **Step 1: Write failing tests for every error class**

```ts
// apps/extension/src/practice/word-diff.test.ts
import { describe, expect, test } from "vitest";
import { diffWords } from "./word-diff";

describe("diffWords", () => {
  test.each([
    ["write the sentence", "write sentence", "missing"],
    ["write sentence", "write the sentence", "extra"],
    ["write the sentence", "write the sentense", "spelling"],
    ["many students arrived", "many student arrived", "word_form"],
    ["the lecture starts", "the seminar starts", "substitution"],
  ] as const)("classifies %s against %s as %s", (expected, actual, type) => {
    expect(diffWords(expected, actual).errors).toContainEqual(expect.objectContaining({ type }));
  });

  test("marks reordered words without treating them as new vocabulary", () => {
    expect(diffWords("the lecture starts", "lecture the starts").errors).toEqual([
      { expected: "the", actual: "lecture", type: "order" },
      { expected: "lecture", actual: "the", type: "order" },
    ]);
  });

  test("normalizes case and punctuation but preserves display tokens", () => {
    expect(diffWords("Students arrive.", "students arrive").accuracy).toBe(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify red state**

Run: `pnpm exec vitest run apps/extension/src/practice/word-diff.test.ts --environment node`

Expected: FAIL with `Cannot find module './word-diff'`.

- [ ] **Step 3: Implement deterministic tokenization, alignment, and classification**

```ts
// apps/extension/src/practice/word-diff.ts
import type { AttemptError } from "@pte-pilot/contracts";

export interface WordDiffResult {
  expectedTokens: string[];
  actualTokens: string[];
  correctCount: number;
  accuracy: number;
  errors: AttemptError[];
}

const tokenize = (value: string): string[] =>
  value
    .normalize("NFKC")
    .replace(/[’]/gu, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

const normalized = (value: string): string => value.toLocaleLowerCase("en-AU");

function levenshtein(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0));
  for (let row = 0; row <= left.length; row += 1) rows[row]![0] = row;
  for (let column = 0; column <= right.length; column += 1) rows[0]![column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row]![column] = Math.min(
        rows[row - 1]![column]! + 1,
        rows[row]![column - 1]! + 1,
        rows[row - 1]![column - 1]! + cost,
      );
    }
  }
  return rows[left.length]![right.length]!;
}

const stem = (value: string): string => {
  const word = normalized(value);
  for (const suffix of ["ing", "ied", "ed", "es", "s"] as const) {
    if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
      return suffix === "ied" ? `${word.slice(0, -3)}y` : word.slice(0, -suffix.length);
    }
  }
  return word;
};

function classify(expected: string, actual: string): AttemptError["type"] {
  if (stem(expected) === stem(actual)) return "word_form";
  const distance = levenshtein(normalized(expected), normalized(actual));
  const spellingLimit = Math.max(1, Math.floor(Math.max(expected.length, actual.length) * 0.25));
  return distance <= spellingLimit ? "spelling" : "substitution";
}

function sameMultiset(expected: string[], actual: string[]): boolean {
  if (expected.length !== actual.length) return false;
  const left = expected.map(normalized).sort();
  const right = actual.map(normalized).sort();
  return left.every((word, index) => word === right[index]);
}

function lcsPairs(expected: string[], actual: string[]): Array<[number, number]> {
  const rows = expected.length + 1;
  const columns = actual.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  for (let row = expected.length - 1; row >= 0; row -= 1) {
    for (let column = actual.length - 1; column >= 0; column -= 1) {
      table[row]![column] = normalized(expected[row]!) === normalized(actual[column]!)
        ? table[row + 1]![column + 1]! + 1
        : Math.max(table[row + 1]![column]!, table[row]![column + 1]!);
    }
  }
  const pairs: Array<[number, number]> = [];
  let row = 0;
  let column = 0;
  while (row < expected.length && column < actual.length) {
    if (normalized(expected[row]!) === normalized(actual[column]!)) {
      pairs.push([row, column]);
      row += 1;
      column += 1;
    } else if (table[row + 1]![column]! >= table[row]![column + 1]!) {
      row += 1;
    } else {
      column += 1;
    }
  }
  return pairs;
}

export function diffWords(expectedText: string, actualText: string): WordDiffResult {
  const expectedTokens = tokenize(expectedText);
  const actualTokens = tokenize(actualText);
  if (sameMultiset(expectedTokens, actualTokens)) {
    const errors = expectedTokens.flatMap<AttemptError>((expected, index) =>
      normalized(expected) === normalized(actualTokens[index]!)
        ? []
        : [{ expected, actual: actualTokens[index]!, type: "order" }],
    );
    return {
      expectedTokens,
      actualTokens,
      correctCount: expectedTokens.length - errors.length,
      accuracy: expectedTokens.length === 0 ? 1 : (expectedTokens.length - errors.length) / expectedTokens.length,
      errors,
    };
  }

  const pairs = lcsPairs(expectedTokens, actualTokens);
  const errors: AttemptError[] = [];
  let expectedCursor = 0;
  let actualCursor = 0;
  for (const [expectedMatch, actualMatch] of [...pairs, [expectedTokens.length, actualTokens.length] as [number, number]]) {
    const expectedGap = expectedTokens.slice(expectedCursor, expectedMatch);
    const actualGap = actualTokens.slice(actualCursor, actualMatch);
    const paired = Math.min(expectedGap.length, actualGap.length);
    for (let index = 0; index < paired; index += 1) {
      const expected = expectedGap[index]!;
      const actual = actualGap[index]!;
      errors.push({ expected, actual, type: classify(expected, actual) });
    }
    for (const expected of expectedGap.slice(paired)) errors.push({ expected, actual: "", type: "missing" });
    for (const actual of actualGap.slice(paired)) errors.push({ expected: "", actual, type: "extra" });
    expectedCursor = expectedMatch + 1;
    actualCursor = actualMatch + 1;
  }
  const correctCount = pairs.length;
  return {
    expectedTokens,
    actualTokens,
    correctCount,
    accuracy: expectedTokens.length === 0 ? (actualTokens.length === 0 ? 1 : 0) : correctCount / expectedTokens.length,
    errors,
  };
}
```

- [ ] **Step 4: Run focused and contract regression tests**

Run:

```powershell
pnpm exec vitest run apps/extension/src/practice/word-diff.test.ts packages/contracts/src/contracts.test.ts --environment node
```

Expected: all tests PASS; output classifications remain deterministic across repeated runs.

- [ ] **Step 5: Commit**

```powershell
git add apps/extension/src/practice/word-diff.ts apps/extension/src/practice/word-diff.test.ts
git commit -m "feat: add deterministic wfd word diff"
```

### Task 5: Make Service Worker Dexie the Atomic Fact Source

**Files:**
- Create: `apps/extension/src/background/storage/db.ts`
- Create: `apps/extension/src/background/storage/repositories.ts`
- Create: `apps/extension/src/background/storage/repositories.test.ts`

**Interfaces:**
- Consumes: `AttemptEvent`, `DraftCheckpoint`, `IndexedQuestion`, `IndexSnapshot`, `RankCandidate`, and Gateway batch schemas.
- Produces: `createPtePilotDb()`, `CockpitRepositories`, atomic `commitAttempt()`, draft/session restore, marking, rank facts, and outbox lease/ack/release for Gateway worker use.

- [ ] **Step 1: Install fake IndexedDB setup and write atomicity tests**

```ts
// apps/extension/src/background/storage/repositories.test.ts
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { AttemptEvent } from "@pte-pilot/contracts";
import { createPtePilotDb, type PtePilotDb } from "./db";
import { CockpitRepositories } from "./repositories";

const attempt: AttemptEvent = {
  attemptId: "8ac6f879-5608-4f32-b0c7-eb5d0e9b8080",
  questionId: "131020",
  accuracy: 0.75,
  durationMs: 4_000,
  replayCount: 1,
  errors: [{ expected: "sentence", actual: "sentense", type: "spelling" }],
  completedAt: "2026-07-15T10:00:00.000Z",
};

describe("CockpitRepositories", () => {
  let db: PtePilotDb;
  let repository: CockpitRepositories;

  beforeEach(async () => {
    db = createPtePilotDb(`pte-pilot-test-${crypto.randomUUID()}`);
    repository = new CockpitRepositories(db);
    await repository.saveSession({
      questionId: attempt.questionId,
      predictionEdition: "yc-2026-w29",
      position: 12,
      total: 192,
    }, "2026-07-15T10:00:00.000Z");
  });

  afterEach(async () => {
    await db.delete();
  });

  test("commits attempt, statistics, progress, and outbox atomically", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect(await db.wordStats.count()).toBe(1);
    expect(await db.questionProgress.count()).toBe(1);
    expect(await db.outbox.count()).toBe(1);
  });

  test("is idempotent for the same attemptId", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.commitAttempt("yc-2026-w29", attempt);
    expect(await db.attempts.count()).toBe(1);
    expect((await db.wordStats.toArray())[0]?.occurrences).toBe(1);
  });

  test("rolls every table back if outbox insert fails", async () => {
    db.outbox.hook("creating", () => {
      throw new Error("forced outbox failure");
    });
    await expect(repository.commitAttempt("yc-2026-w29", attempt)).rejects.toThrow("forced outbox failure");
    expect(await db.attempts.count()).toBe(0);
    expect(await db.wordStats.count()).toBe(0);
    expect(await db.questionProgress.count()).toBe(0);
  });

  test("leases and acknowledges only matching outbox rows", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const batchId = "9dc99e6e-7f31-4869-ad78-d824fa0e7840";
    const batch = await repository.leaseOutbox(batchId, 10, "2026-07-15T10:01:00.000Z");
    expect(batch?.events).toEqual([attempt]);
    await repository.ackOutbox({
      batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "e3850a41-0566-43f1-8f73-50a9ff028ad0",
      projectionVersion: 1,
    });
    expect(await db.outbox.count()).toBe(0);
  });

  test("reclaims an expired inflight lease after a Service Worker crash", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    await repository.leaseOutbox("28dbda55-3132-44f0-8159-d1c641ae5dce", 10, "2026-07-15T10:01:00.000Z");
    const reclaimed = await repository.leaseOutbox("b49e848e-fe3b-4bcb-81d3-0f4a592b9225", 10, "2026-07-15T10:01:31.000Z");
    expect(reclaimed?.events).toEqual([attempt]);
  });

  test("increments learnerStateVersion for attempts and actual mark changes", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const afterAttempt = await repository.getRankCandidates("yc-2026-w29", [attempt.questionId]);
    await repository.setMarked("yc-2026-w29", attempt.questionId, true);
    const afterMark = await repository.getRankCandidates("yc-2026-w29", [attempt.questionId]);
    await repository.setMarked("yc-2026-w29", attempt.questionId, true);
    expect(afterMark.learnerStateVersion).toBe(afterAttempt.learnerStateVersion + 1);
    expect((await repository.getRankCandidates("yc-2026-w29", [attempt.questionId])).learnerStateVersion).toBe(afterMark.learnerStateVersion);
  });

  test("isolates drafts and question metadata by prediction edition", async () => {
    const base = { questionId: "131020", text: "one", revision: 1, updatedAt: "2026-07-15T10:00:00.000Z" };
    await repository.saveDraft({ ...base, predictionEdition: "yc-2026-w29" });
    await repository.saveDraft({ ...base, predictionEdition: "yc-2026-w30", text: "two" });
    expect((await repository.loadDraft("yc-2026-w29", "131020"))?.text).toBe("one");
    expect((await repository.loadDraft("yc-2026-w30", "131020"))?.text).toBe("two");
  });

  test("requeues immutable attempts when the Gateway projection instance changes", async () => {
    await repository.commitAttempt("yc-2026-w29", attempt);
    const firstBatch = await repository.leaseOutbox("66c3fdbe-432a-4a97-8d26-4c6c6f21d451", 10, "2026-07-15T10:01:00.000Z");
    await repository.ackOutbox({
      batchId: firstBatch!.batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: "b27112b6-2b19-4868-96a3-9a0b0c4f5030",
      projectionVersion: 1,
    });
    await repository.requeueAllAttemptsForProjection("1730a136-3517-4a8c-b31a-34594d9cab49", "2026-07-15T10:02:00.000Z");
    expect((await repository.leaseOutbox("25977310-a3e2-4d21-b1a8-b073de47b929", 10, "2026-07-15T10:02:00.000Z"))?.events).toEqual([attempt]);
  });
});
```

- [ ] **Step 2: Run the repository test and verify red state**

Run: `pnpm exec vitest run apps/extension/src/background/storage/repositories.test.ts --environment node`

Expected: FAIL with `Cannot find module './db'`.

- [ ] **Step 3: Define the extension-origin Dexie schema**

```ts
// apps/extension/src/background/storage/db.ts
import Dexie, { type EntityTable } from "dexie";
import type { AttemptEvent, DraftCheckpoint, IndexedQuestion, IndexSnapshot, UserSettings } from "@pte-pilot/contracts";

export interface OutboxRecord {
  attemptId: string;
  batchId: string | null;
  status: "pending" | "inflight";
  retryCount: number;
  nextAttemptAt: string;
  leaseExpiresAt: string | null;
}

export interface WordStatRecord {
  key: string;
  expected: string;
  actual: string;
  type: AttemptEvent["errors"][number]["type"];
  occurrences: number;
  lastSeenAt: string;
}

export interface QuestionProgressRecord {
  key: string;
  predictionEdition: string;
  questionId: string;
  attemptCount: number;
  errorCount: number;
  lastAccuracy: number | null;
  lastAttemptAt: string | null;
  dueAt: string | null;
  marked: boolean;
}

export interface SessionRecord {
  id: "current";
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
  updatedAt: string;
}

export interface MetaRecord {
  id: "learner-state-version" | "projection-instance-id";
  numberValue?: number;
  stringValue?: string;
}

export class PtePilotDb extends Dexie {
  drafts!: EntityTable<DraftCheckpoint, [string, string]>;
  attempts!: EntityTable<AttemptEvent, "attemptId">;
  outbox!: EntityTable<OutboxRecord, "attemptId">;
  wordStats!: EntityTable<WordStatRecord, "key">;
  questionProgress!: EntityTable<QuestionProgressRecord, "key">;
  questions!: EntityTable<IndexedQuestion, [string, string]>;
  snapshots!: EntityTable<IndexSnapshot, "predictionEdition">;
  sessions!: EntityTable<SessionRecord, "id">;
  settings!: EntityTable<UserSettings, "id">;
  meta!: EntityTable<MetaRecord, "id">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      drafts: "&[predictionEdition+questionId], predictionEdition, updatedAt",
      attempts: "&attemptId, questionId, completedAt",
      outbox: "&attemptId, status, nextAttemptAt, batchId, leaseExpiresAt",
      wordStats: "&key, expected, lastSeenAt",
      questionProgress: "&key, predictionEdition, questionId, dueAt, marked",
      questions: "&[predictionEdition+questionId], predictionEdition, sitePosition",
      snapshots: "&predictionEdition",
      sessions: "&id, predictionEdition, questionId, updatedAt",
      settings: "&id, updatedAt",
      meta: "&id",
    });
  }
}

export const createPtePilotDb = (name = "pte-pilot-facts-v1"): PtePilotDb => new PtePilotDb(name);
```

- [ ] **Step 4: Implement atomic repositories and outbox leasing**

```ts
// apps/extension/src/background/storage/repositories.ts
import type {
  AttemptEvent,
  BatchUpsertRequest,
  BatchUpsertResponse,
  CandidateFact,
  DraftCheckpoint,
  IndexedQuestion,
  IndexSnapshot,
  QuestionRef,
  RankCandidate,
  UserSettings,
  WordStatSummary,
} from "@pte-pilot/contracts";
import type { PtePilotDb, QuestionProgressRecord, SessionRecord, WordStatRecord } from "./db";

const HOUR = 60 * 60 * 1_000;
const progressKey = (edition: string, questionId: string): string => `${edition}\u0000${questionId}`;
const wordKey = (error: AttemptEvent["errors"][number]): string =>
  `${error.type}\u0000${error.expected.toLocaleLowerCase("en-AU")}\u0000${error.actual.toLocaleLowerCase("en-AU")}`;

const nextDueAt = (attempt: AttemptEvent): string => {
  const delay = attempt.accuracy === 1 ? 24 * HOUR : attempt.accuracy >= 0.8 ? 6 * HOUR : 30 * 60 * 1_000;
  return new Date(Date.parse(attempt.completedAt) + delay).toISOString();
};

const LEASE_MS = 30_000;

export class CockpitRepositories {
  constructor(private readonly db: PtePilotDb) {}

  loadDraft(predictionEdition: string, questionId: string): Promise<DraftCheckpoint | undefined> {
    return this.db.drafts.get([predictionEdition, questionId]);
  }

  async saveDraft(draft: DraftCheckpoint): Promise<void> {
    await this.db.transaction("rw", this.db.drafts, async () => {
      const current = await this.db.drafts.get([draft.predictionEdition, draft.questionId]);
      if (!current || draft.revision >= current.revision) await this.db.drafts.put(draft);
    });
  }

  async saveSession(question: QuestionRef, updatedAt = new Date().toISOString()): Promise<void> {
    const session: SessionRecord = { id: "current", ...question, updatedAt };
    await this.db.sessions.put(session);
  }

  async restoreSession(): Promise<{ question: QuestionRef | null; draft: DraftCheckpoint | null }> {
    const session = await this.db.sessions.get("current");
    if (!session) return { question: null, draft: null };
    const question: QuestionRef = {
      questionId: session.questionId,
      predictionEdition: session.predictionEdition,
      position: session.position,
      total: session.total,
    };
    return { question, draft: (await this.loadDraft(session.predictionEdition, session.questionId)) ?? null };
  }

  async commitAttempt(predictionEdition: string, attempt: AttemptEvent): Promise<void> {
    await this.db.transaction(
      "rw",
      [this.db.attempts, this.db.outbox, this.db.wordStats, this.db.questionProgress, this.db.meta, this.db.sessions],
      async () => {
        const session = await this.db.sessions.get("current");
        if (session?.predictionEdition !== predictionEdition || session.questionId !== attempt.questionId) {
          throw new Error("attempt does not match verified current session");
        }
        if (await this.db.attempts.get(attempt.attemptId)) return;
        await this.db.attempts.add(attempt);
        const key = progressKey(predictionEdition, attempt.questionId);
        const current = await this.db.questionProgress.get(key);
        const progress: QuestionProgressRecord = {
          key,
          predictionEdition,
          questionId: attempt.questionId,
          attemptCount: (current?.attemptCount ?? 0) + 1,
          errorCount: (current?.errorCount ?? 0) + attempt.errors.length,
          lastAccuracy: attempt.accuracy,
          lastAttemptAt: attempt.completedAt,
          dueAt: nextDueAt(attempt),
          marked: current?.marked ?? false,
        };
        await this.db.questionProgress.put(progress);
        for (const error of attempt.errors) {
          const errorKey = wordKey(error);
          const previous = await this.db.wordStats.get(errorKey);
          const record: WordStatRecord = {
            key: errorKey,
            expected: error.expected,
            actual: error.actual,
            type: error.type,
            occurrences: (previous?.occurrences ?? 0) + 1,
            lastSeenAt: attempt.completedAt,
          };
          await this.db.wordStats.put(record);
        }
        await this.db.outbox.add({
          attemptId: attempt.attemptId,
          batchId: null,
          status: "pending",
          retryCount: 0,
          nextAttemptAt: attempt.completedAt,
          leaseExpiresAt: null,
        });
        const version = (await this.db.meta.get("learner-state-version"))?.numberValue ?? 0;
        await this.db.meta.put({ id: "learner-state-version", numberValue: version + 1 });
      },
    );
  }

  async setMarked(predictionEdition: string, questionId: string, marked: boolean): Promise<void> {
    await this.db.transaction("rw", [this.db.questionProgress, this.db.meta], async () => {
      const key = progressKey(predictionEdition, questionId);
      const current = await this.db.questionProgress.get(key);
      if (current?.marked === marked) return;
      await this.db.questionProgress.put({
        key,
        predictionEdition,
        questionId,
        attemptCount: current?.attemptCount ?? 0,
        errorCount: current?.errorCount ?? 0,
        lastAccuracy: current?.lastAccuracy ?? null,
        lastAttemptAt: current?.lastAttemptAt ?? null,
        dueAt: current?.dueAt ?? null,
        marked,
      });
      const version = (await this.db.meta.get("learner-state-version"))?.numberValue ?? 0;
      await this.db.meta.put({ id: "learner-state-version", numberValue: version + 1 });
    });
  }

  async listCandidateFacts(predictionEdition: string): Promise<CandidateFact[]> {
    return (await this.db.questionProgress.where("predictionEdition").equals(predictionEdition).toArray()).map((row) => ({
      questionId: row.questionId,
      dueAt: row.dueAt,
      attemptCount: row.attemptCount,
      errorCount: row.errorCount,
      lastAccuracy: row.lastAccuracy,
      lastAttemptAt: row.lastAttemptAt,
      marked: row.marked,
    }));
  }

  async getRankCandidates(predictionEdition: string, questionIds: readonly string[]): Promise<{ learnerStateVersion: number; candidates: RankCandidate[] }> {
    const rows = (await this.db.questionProgress.where("questionId").anyOf([...questionIds]).toArray())
      .filter((row) => row.predictionEdition === predictionEdition);
    const byId = new Map(rows.map((row) => [row.questionId, row]));
    const now = Date.now();
    const candidates = questionIds.map((questionId) => {
      const row = byId.get(questionId);
      const dueScore = !row?.dueAt ? 1 : Math.min(1, Math.max(0, (now - Date.parse(row.dueAt)) / (24 * HOUR) + 0.5));
      return {
        questionId,
        dueScore,
        weaknessScore: row ? Math.min(1, row.errorCount / Math.max(1, row.attemptCount * 3)) : 0,
        noveltyScore: row ? 0 : 1,
        marked: row?.marked ?? false,
        attemptCount: row?.attemptCount ?? 0,
        lastAttemptAt: row?.lastAttemptAt ?? null,
      };
    });
    return {
      learnerStateVersion: (await this.db.meta.get("learner-state-version"))?.numberValue ?? 0,
      candidates,
    };
  }

  async leaseOutbox(batchId: string, limit: number, now: string): Promise<BatchUpsertRequest | null> {
    return this.db.transaction("rw", [this.db.outbox, this.db.attempts], async () => {
      const expired = (await this.db.outbox.where("status").equals("inflight").toArray())
        .filter((row) => row.leaseExpiresAt !== null && row.leaseExpiresAt <= now);
      await Promise.all(expired.map((row) => this.db.outbox.put({
        ...row,
        status: "pending",
        batchId: null,
        leaseExpiresAt: null,
      })));
      const rows = (await this.db.outbox.where("status").equals("pending").toArray())
        .filter((row) => row.nextAttemptAt <= now)
        .slice(0, limit);
      if (rows.length === 0) return null;
      const leaseExpiresAt = new Date(Date.parse(now) + LEASE_MS).toISOString();
      await Promise.all(rows.map((row) => this.db.outbox.put({ ...row, status: "inflight", batchId, leaseExpiresAt })));
      const events = (await this.db.attempts.bulkGet(rows.map((row) => row.attemptId))).filter(
        (event): event is AttemptEvent => event !== undefined,
      );
      if (events.length !== rows.length) throw new Error("outbox references missing attempt");
      return { batchId, events };
    });
  }

  async ackOutbox(response: BatchUpsertResponse): Promise<void> {
    await this.db.transaction("rw", [this.db.outbox, this.db.meta], async () => {
      for (const attemptId of response.ackedAttemptIds) {
        const row = await this.db.outbox.get(attemptId);
        if (row?.batchId === response.batchId) await this.db.outbox.delete(attemptId);
      }
      await this.db.meta.put({ id: "projection-instance-id", stringValue: response.projectionInstanceId });
    });
  }

  async releaseOutbox(batchId: string, now: string): Promise<void> {
    await this.db.transaction("rw", this.db.outbox, async () => {
      const rows = await this.db.outbox.where("batchId").equals(batchId).toArray();
      for (const row of rows) {
        const retryCount = row.retryCount + 1;
        const delay = Math.min(60_000, 1_000 * 2 ** retryCount);
        await this.db.outbox.put({ ...row, batchId: null, status: "pending", retryCount, nextAttemptAt: new Date(Date.parse(now) + delay).toISOString(), leaseExpiresAt: null });
      }
    });
  }

  async requeueAllAttemptsForProjection(projectionInstanceId: string, now: string): Promise<void> {
    await this.db.transaction("rw", [this.db.attempts, this.db.outbox, this.db.meta], async () => {
      const current = (await this.db.meta.get("projection-instance-id"))?.stringValue;
      if (current === projectionInstanceId) return;
      const attempts = await this.db.attempts.toArray();
      await this.db.outbox.bulkPut(attempts.map((attempt) => ({
        attemptId: attempt.attemptId,
        batchId: null,
        status: "pending" as const,
        retryCount: 0,
        nextAttemptAt: now,
        leaseExpiresAt: null,
      })));
      await this.db.meta.put({ id: "projection-instance-id", stringValue: projectionInstanceId });
    });
  }

  async loadIndexSnapshot(predictionEdition: string): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }> {
    return {
      snapshot: (await this.db.snapshots.get(predictionEdition)) ?? null,
      questions: await this.db.questions.where("predictionEdition").equals(predictionEdition).sortBy("sitePosition"),
    };
  }

  async saveIndexSnapshot(snapshot: IndexSnapshot, questions: readonly IndexedQuestion[]): Promise<void> {
    if (questions.some((question) => question.predictionEdition !== snapshot.predictionEdition)) throw new Error("cross-edition index write");
    await this.db.transaction("rw", [this.db.snapshots, this.db.questions], async () => {
      await this.db.questions.bulkPut([...questions]);
      await this.db.snapshots.put(snapshot);
    });
  }

  loadSettings(): Promise<UserSettings | undefined> { return this.db.settings.get("current"); }
  saveSettings(settings: UserSettings): Promise<void> { return this.db.settings.put(settings).then(() => undefined); }
  listWordStats(limit: number): Promise<WordStatSummary[]> {
    return this.db.wordStats.orderBy("lastSeenAt").reverse().limit(limit).toArray();
  }
}
```

- [ ] **Step 5: Run atomicity tests**

Run: `pnpm exec vitest run apps/extension/src/background/storage/repositories.test.ts --environment node`

Expected: eight tests PASS; atomic rollback, compound edition keys, lease recovery, monotonic learner version, and projection rebuild replay are covered.

- [ ] **Step 6: Commit**

```powershell
git add apps/extension/src/background/storage
git commit -m "feat: add atomic extension fact store"
```

### Task 6: Enforce the Content-to-Service-Worker Storage Boundary

**Files:**
- Create: `apps/extension/src/content/runtime-call.ts`
- Create: `apps/extension/src/content/runtime-storage-port.ts`
- Create: `apps/extension/src/content/runtime-gateway-port.ts`
- Create: `apps/extension/src/content/storage-boundary.test.ts`
- Create: `apps/extension/src/background/start-cockpit-background.ts`
- Create: `apps/extension/entrypoints/background.ts`

**Interfaces:**
- Consumes: `RuntimeRequestSchema`, `RuntimeResponseSchema`, `CockpitRepositories`, `StoragePort`, and `GatewayPort`.
- Produces: `createRuntimeStoragePort(runtime): StoragePort`, `createRuntimeGatewayPort(runtime): GatewayPort`, and `startCockpitBackground(api): () => void`; Dexie remains unreachable from Firefly-origin code.

- [ ] **Step 1: Write the failing architecture-boundary test**

```ts
// apps/extension/src/content/storage-boundary.test.ts
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return nested.flat().filter((path) => /\.[cm]?[jt]sx?$/u.test(path));
}

describe("extension-origin storage boundary", () => {
  test("content, app, practice, and ports never import Dexie or open IndexedDB", async () => {
    const roots = [
      "apps/extension/src/content",
      "apps/extension/src/app",
      "apps/extension/src/practice",
      "apps/extension/src/ports",
    ];
    for (const file of (await Promise.all(roots.map(sourceFiles))).flat()) {
      if (file.endsWith("storage-boundary.test.ts")) continue;
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["']dexie["']|indexedDB|background\/storage/u);
    }
  });
});
```

- [ ] **Step 2: Run the boundary test and verify red state**

Run: `pnpm exec vitest run apps/extension/src/content/storage-boundary.test.ts --environment node`

Expected: FAIL because `apps/extension/src/content` does not exist.

- [ ] **Step 3: Add strict runtime clients without Dexie imports**

```ts
// apps/extension/src/content/runtime-call.ts
import { RuntimeResponseSchema, type RuntimeRequest, type RuntimeSuccess } from "@pte-pilot/contracts";

export interface RuntimeSender { sendMessage(message: unknown): Promise<unknown> }

export async function runtimeCall<TAction extends RuntimeSuccess["action"]>(
  runtime: RuntimeSender,
  request: RuntimeRequest,
  action: TAction,
): Promise<Extract<RuntimeSuccess, { action: TAction }>> {
  const response = RuntimeResponseSchema.parse(await runtime.sendMessage(request));
  if (!response.ok) throw new Error(`runtime ${response.action} failed: ${response.reason}`);
  if (response.requestId !== request.requestId || response.action !== action) {
    throw new Error("runtime response correlation mismatch");
  }
  return response as Extract<RuntimeSuccess, { action: TAction }>;
}
```

```ts
// apps/extension/src/content/runtime-storage-port.ts
import type { DraftCheckpoint } from "@pte-pilot/contracts";
import type { StoragePort } from "../ports/storage-port";
import { runtimeCall, type RuntimeSender } from "./runtime-call";

const requestId = (): string => crypto.randomUUID();

export function createRuntimeStoragePort(runtime: RuntimeSender): StoragePort {
  return {
    async loadDraft(predictionEdition, questionId) {
      return (await runtimeCall(runtime, { requestId: requestId(), action: "storage/loadDraft", predictionEdition, questionId }, "storage/loadDraft")).draft;
    },
    async saveDraft(draft: DraftCheckpoint) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/saveDraft", draft }, "storage/saveDraft");
    },
    async commitAttempt(predictionEdition, attempt) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/commitAttempt", predictionEdition, attempt }, "storage/commitAttempt");
    },
    async setMarked(predictionEdition, questionId, marked) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/setMarked", predictionEdition, questionId, marked }, "storage/setMarked");
    },
    async getRankCandidates(predictionEdition, questionIds) {
      return (await runtimeCall(runtime, { requestId: requestId(), action: "storage/getRankCandidates", predictionEdition, questionIds: [...questionIds] }, "storage/getRankCandidates")).snapshot;
    },
    async restoreSession() {
      return (await runtimeCall(runtime, { requestId: requestId(), action: "storage/restoreSession" }, "storage/restoreSession")).session;
    },
    async saveSession(question) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/saveSession", question }, "storage/saveSession");
    },
    async loadIndexSnapshot(predictionEdition) {
      const response = await runtimeCall(runtime, { requestId: requestId(), action: "storage/loadIndexSnapshot", predictionEdition }, "storage/loadIndexSnapshot");
      return { snapshot: response.snapshot, questions: response.questions };
    },
    async saveIndexSnapshot(snapshot, questions) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/saveIndexSnapshot", snapshot, questions: [...questions] }, "storage/saveIndexSnapshot");
    },
    async loadSettings() {
      return (await runtimeCall(runtime, { requestId: requestId(), action: "storage/loadSettings" }, "storage/loadSettings")).settings;
    },
    async saveSettings(settings) {
      await runtimeCall(runtime, { requestId: requestId(), action: "storage/saveSettings", settings }, "storage/saveSettings");
    },
    async listWordStats(limit) {
      return (await runtimeCall(runtime, { requestId: requestId(), action: "storage/listWordStats", limit }, "storage/listWordStats")).words;
    },
  };
}
```

```ts
// apps/extension/src/content/runtime-gateway-port.ts
import type { GatewayPort } from "../ports/gateway-port";
import { runtimeCall, type RuntimeSender } from "./runtime-call";

const withAbort = async <T>(signal: AbortSignal | undefined, work: () => Promise<T>): Promise<T> => {
  if (signal?.aborted) throw signal.reason;
  const abort = new Promise<never>((_, reject) => signal?.addEventListener("abort", () => reject(signal.reason), { once: true }));
  return signal ? Promise.race([work(), abort]) : work();
};

export function createRuntimeGatewayPort(runtime: RuntimeSender): GatewayPort {
  return {
    health(signal) {
      return withAbort(signal, async () => (await runtimeCall(runtime, { requestId: crypto.randomUUID(), action: "gateway/health" }, "gateway/health")).health);
    },
    rank(request, signal) {
      return withAbort(signal, async () => (await runtimeCall(runtime, { requestId: crypto.randomUUID(), action: "gateway/rank", request }, "gateway/rank")).response);
    },
  };
}
```

- [ ] **Step 4: Add the sole background database owner and offline-fallback Gateway responses**

```ts
// apps/extension/src/background/start-cockpit-background.ts
import { RuntimeRequestSchema, type RuntimeFailure, type RuntimeResponse } from "@pte-pilot/contracts";
import { createPtePilotDb } from "./storage/db";
import { CockpitRepositories } from "./storage/repositories";

interface MessageSender { id?: string; url?: string; tab?: { url?: string } }
type MessageListener = (message: unknown, sender: MessageSender) => Promise<RuntimeResponse | undefined> | undefined;
interface RuntimeListener { addListener(listener: MessageListener): void; removeListener(listener: MessageListener): void }
export interface CockpitBackgroundApi { runtime: { id: string; onMessage: RuntimeListener } }

const allowedSender = (api: CockpitBackgroundApi, sender: MessageSender): boolean => {
  const url = sender.url ?? sender.tab?.url ?? "";
  return sender.id === api.runtime.id && url.startsWith("https://www.fireflyau.com/ptehome/exercise");
};

export function startCockpitBackground(api: CockpitBackgroundApi): () => void {
  const db = createPtePilotDb();
  const repository = new CockpitRepositories(db);
  const listener: MessageListener = async (raw, sender) => {
    if (!allowedSender(api, sender)) return undefined;
    const parsed = RuntimeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return { requestId: crypto.randomUUID(), ok: false, action: "unknown", reason: "invalid-request" };
    }
    const request = parsed.data;
    try {
      switch (request.action) {
        case "storage/loadDraft":
          return { requestId: request.requestId, ok: true, action: request.action, draft: (await repository.loadDraft(request.predictionEdition, request.questionId)) ?? null };
        case "storage/saveDraft":
          await repository.saveDraft(request.draft);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/commitAttempt":
          await repository.commitAttempt(request.predictionEdition, request.attempt);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/setMarked":
          await repository.setMarked(request.predictionEdition, request.questionId, request.marked);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/getRankCandidates":
          return { requestId: request.requestId, ok: true, action: request.action, snapshot: await repository.getRankCandidates(request.predictionEdition, request.questionIds) };
        case "storage/restoreSession":
          return { requestId: request.requestId, ok: true, action: request.action, session: await repository.restoreSession() };
        case "storage/saveSession":
          await repository.saveSession(request.question);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/loadIndexSnapshot": {
          const index = await repository.loadIndexSnapshot(request.predictionEdition);
          return { requestId: request.requestId, ok: true, action: request.action, ...index };
        }
        case "storage/saveIndexSnapshot":
          await repository.saveIndexSnapshot(request.snapshot, request.questions);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/loadSettings":
          return { requestId: request.requestId, ok: true, action: request.action, settings: (await repository.loadSettings()) ?? null };
        case "storage/saveSettings":
          await repository.saveSettings(request.settings);
          return { requestId: request.requestId, ok: true, action: request.action };
        case "storage/listWordStats":
          return { requestId: request.requestId, ok: true, action: request.action, words: await repository.listWordStats(request.limit) };
        case "gateway/health":
        case "gateway/rank": {
          const offline: RuntimeFailure = { requestId: request.requestId, ok: false, action: request.action, reason: "offline" };
          return offline;
        }
      }
    } catch {
      return { requestId: request.requestId, ok: false, action: request.action, reason: "storage-failure" };
    }
  };
  api.runtime.onMessage.addListener(listener);
  return () => {
    api.runtime.onMessage.removeListener(listener);
    db.close();
  };
}
```

```ts
// apps/extension/entrypoints/background.ts
import { browser } from "wxt/browser";
import { startCockpitBackground } from "../src/background/start-cockpit-background";

export default defineBackground(() => {
  void browser.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  return startCockpitBackground(browser);
});
```

- [ ] **Step 5: Run boundary, repository, and type tests**

Run:

```powershell
pnpm exec vitest run apps/extension/src/content/storage-boundary.test.ts apps/extension/src/background/storage/repositories.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
```

Expected: tests PASS; content scan finds no `dexie`, `indexedDB`, or background-storage import; TypeScript exits `0`.

- [ ] **Step 6: Commit**

```powershell
git add apps/extension/src/content apps/extension/src/background/start-cockpit-background.ts apps/extension/entrypoints/background.ts
git commit -m "feat: isolate cockpit storage in service worker"
```

### Task 7: Add Local Ranking and the PracticeController Orchestrator

**Files:**
- Create: `apps/extension/src/learning/local-ranking.ts`
- Create: `apps/extension/src/learning/local-ranking.test.ts`
- Create: `apps/extension/src/practice/practice-controller.ts`
- Create: `apps/extension/src/practice/practice-controller.test.ts`

**Interfaces:**
- Consumes: `SubmissionGatePort`, `NavigationPort`, `IndexPort`, audio/storage/Gateway ports, the pure state reducer, and rank contracts. It never imports `FireflySitePort` or any plaintext answer reader.
- Produces: `rankLocally`, `rankWithGatewayFallback`, `PracticeController`, and `createPracticeController(deps:{submissions;navigation;index;audio;storage;gateway;clock}): PracticeController`.

- [ ] **Step 1: Write failing fallback and controller hot-path tests**

```ts
// apps/extension/src/learning/local-ranking.test.ts
import { describe, expect, test } from "vitest";
import type { GatewayPort } from "../ports/gateway-port";
import { createRankRequest, rankLocally, rankWithGatewayFallback } from "./local-ranking";

const candidates = [
  { questionId: "new", dueScore: 0.5, weaknessScore: 0, noveltyScore: 1, marked: false, attemptCount: 0, lastAttemptAt: null },
  { questionId: "weak", dueScore: 1, weaknessScore: 1, noveltyScore: 0, marked: true, attemptCount: 4, lastAttemptAt: "2026-07-14T00:00:00.000Z" },
];

describe("local ranking", () => {
  test("puts marked overdue weak work first", () => {
    expect(rankLocally(candidates)).toEqual(["weak", "new"]);
  });

  test("uses local order when Gateway is offline", async () => {
    const gateway = { rank: async () => { throw new Error("offline"); } } as GatewayPort;
    const request = await createRankRequest(candidates, 2, "1bf5b647-9d48-4773-b91b-9fe0b15cb458");
    expect(await rankWithGatewayFallback(gateway, request)).toEqual(["weak", "new"]);
  });
});
```

```ts
// apps/extension/src/practice/practice-controller.test.ts
import { readFile } from "node:fs/promises";
import { NavigationEpochSchema } from "@pte-pilot/contracts";
import { describe, expect, test, vi } from "vitest";
import type { AudioPort } from "../ports/audio-port";
import type { GatewayPort } from "../ports/gateway-port";
import type { IndexPort } from "../ports/index-port";
import type { NavigationPort } from "../ports/navigation-port";
import type { StoragePort } from "../ports/storage-port";
import type { SubmissionGatePort } from "../ports/submission-gate-port";
import { createPracticeController } from "./practice-controller";

describe("PracticeController", () => {
  const makeController = (overrides: Partial<Parameters<typeof createPracticeController>[0]> = {}) => createPracticeController({
    submissions: { invalidateBefore: vi.fn(), dispose: vi.fn() } as unknown as SubmissionGatePort,
    navigation: { dispose: vi.fn() } as unknown as NavigationPort,
    index: { dispose: vi.fn() } as unknown as IndexPort,
    audio: { dispose: vi.fn(), invalidateBefore: vi.fn() } as unknown as AudioPort,
    storage: {} as StoragePort,
    gateway: {} as GatewayPort,
    clock: () => 1_000,
    ...overrides,
  });

  test("setDraft updates hot-path ref without notifying React subscribers", () => {
    const controller = makeController();
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.setDraft("typed without render");
    expect(controller.getState().draft).toBe("typed without render");
    expect(listener).not.toHaveBeenCalled();
    controller.dispose();
  });

  test("cannot import the raw site port or plaintext answer reader", async () => {
    const source = await readFile("apps/extension/src/practice/practice-controller.ts", "utf8");
    expect(source).not.toMatch(/FireflySitePort|readRevealedAnswer|revealAnswer|scoreAndWait/u);
  });

  test("closes and reopens the overlay through the same controller state", () => {
    const controller = makeController();
    expect(controller.getState().overlayOpen).toBe(true);
    controller.closeOverlayForLogin();
    expect(controller.getState().overlayOpen).toBe(false);
    controller.toggleOverlay();
    expect(controller.getState().overlayOpen).toBe(true);
    controller.dispose();
  });

  test("submits only through the answer gate and persists sanitized facts", async () => {
    const run = vi.fn(async () => ({ accuracy: 0.5, errors: [{ expected: "sentence", actual: "sentense", type: "spelling" as const }] }));
    const submission = {
      begin: vi.fn(() => ({ attemptEpoch: 1, submissionToken: "d6babbf0-bb7d-4ca8-b709-f226b1828b19", run })),
      invalidateBefore: vi.fn(),
      dispose: vi.fn(),
    } as unknown as SubmissionGatePort;
    const commitAttempt = vi.fn(async () => undefined);
    const controller = makeController({
      submissions: submission,
      audio: { bind: vi.fn(async () => undefined), dispose: vi.fn(), invalidateBefore: vi.fn() } as unknown as AudioPort,
      storage: { commitAttempt, saveDraft: vi.fn(async () => undefined), loadDraft: vi.fn(async () => null), saveSession: vi.fn(async () => undefined) } as unknown as StoragePort,
    });
    await controller.acceptVerifiedQuestion({ questionId: "131020", predictionEdition: "yc-2026-w29", position: 12, total: 192 }, NavigationEpochSchema.parse(1));
    controller.setDraft("a sentense");
    await controller.submit();
    expect(run).toHaveBeenCalledWith();
    expect(commitAttempt.mock.calls[0]?.[1]).toMatchObject({ accuracy: 0.5, errors: [{ expected: "sentence" }] });
  });

  test("turns playback failure into an AUDIO_ERROR recovery state", async () => {
    const controller = makeController({ audio: { toggle: vi.fn(async () => { throw new Error("ambiguous media"); }), dispose: vi.fn(), invalidateBefore: vi.fn() } as unknown as AudioPort });
    await controller.togglePlayback();
    expect(controller.getState().runtime).toMatchObject({ phase: "PAUSED", fault: { code: "AUDIO_ERROR" } });
  });
});
```

- [ ] **Step 2: Run focused tests and verify red state**

Run: `pnpm exec vitest run apps/extension/src/learning/local-ranking.test.ts apps/extension/src/practice/practice-controller.test.ts --environment node`

Expected: FAIL on missing `local-ranking` and `practice-controller` modules.

- [ ] **Step 3: Implement canonical local and remote ranking validation**

```ts
// apps/extension/src/learning/local-ranking.ts
import { RankRequestSchema, RankResponseSchema, type RankCandidate, type RankRequest } from "@pte-pilot/contracts";
import type { GatewayPort } from "../ports/gateway-port";

const score = (candidate: RankCandidate): number =>
  candidate.dueScore * 4 + candidate.weaknessScore * 3 + candidate.noveltyScore * 2 + (candidate.marked ? 2 : 0);

export function rankLocally(candidates: readonly RankCandidate[]): string[] {
  return [...candidates]
    .sort((left, right) => score(right) - score(left) || left.questionId.localeCompare(right.questionId))
    .map((candidate) => candidate.questionId);
}

async function candidateHash(candidates: readonly RankCandidate[]): Promise<`sha256:${string}`> {
  const canonical = JSON.stringify([...candidates].sort((left, right) => left.questionId.localeCompare(right.questionId)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function createRankRequest(
  candidates: readonly RankCandidate[],
  learnerStateVersion: number,
  decisionId = crypto.randomUUID(),
): Promise<RankRequest> {
  return RankRequestSchema.parse({
    decisionId,
    candidateSetHash: await candidateHash(candidates),
    learnerStateVersion,
    candidates,
  });
}

export async function rankWithGatewayFallback(
  gateway: GatewayPort,
  request: RankRequest,
  signal?: AbortSignal,
): Promise<string[]> {
  const local = rankLocally(request.candidates);
  try {
    const response = RankResponseSchema.parse(await gateway.rank(request, signal));
    if (
      response.decisionId !== request.decisionId ||
      response.candidateSetHash !== request.candidateSetHash ||
      response.learnerStateVersion !== request.learnerStateVersion
    ) return local;
    const allowed = new Set(request.candidates.map((candidate) => candidate.questionId));
    if (new Set(response.rankedQuestionIds).size !== response.rankedQuestionIds.length) return local;
    if (response.rankedQuestionIds.some((questionId) => !allowed.has(questionId))) return local;
    return [...response.rankedQuestionIds, ...local.filter((questionId) => !response.rankedQuestionIds.includes(questionId))];
  } catch {
    return local;
  }
}
```

- [ ] **Step 4: Implement the controller with fixed public methods**

```ts
// apps/extension/src/practice/practice-controller.ts
import {
  RuntimeFaultSchema,
  type AttemptEvent,
  type NavigationEpoch,
  type PracticeState,
  type QuestionRef,
  type RuntimeFault,
} from "@pte-pilot/contracts";
import type { AudioPort } from "../ports/audio-port";
import type { GatewayPort } from "../ports/gateway-port";
import type { IndexPort } from "../ports/index-port";
import type { NavigationPort, NavigationResult } from "../ports/navigation-port";
import type { StoragePort } from "../ports/storage-port";
import type { SubmissionGatePort } from "../ports/submission-gate-port";
import { createInitialMachineState, transition, type PracticeMachineState } from "./practice-machine";

export interface PracticeControllerState extends PracticeMachineState {
  overlayOpen: boolean;
  marked: boolean;
}

export interface PracticeController {
  start(): Promise<void>;
  getState(): PracticeControllerState;
  subscribe(listener: () => void): () => void;
  setDraft(value: string): void;
  flushDraft(): Promise<void>;
  submit(): Promise<void>;
  releaseEnter(): void;
  navigate(target: "next" | "previous" | { questionId: string }): Promise<void>;
  togglePlayback(): Promise<void>;
  restartPlayback(): Promise<void>;
  redo(): Promise<void>;
  toggleMark(): Promise<void>;
  openCommand(): void;
  closeCommand(): void;
  retryAudioOrUseSitePlayer(): Promise<void>;
  probeSiteContract(): Promise<void>;
  acceptVerifiedQuestion(question: QuestionRef, navigationEpoch: NavigationEpoch): Promise<void>;
  reportFault(fault: RuntimeFault): void;
  toggleOverlay(): void;
  closeOverlayForLogin(): void;
  resumeOrKeepPartialIndex(): Promise<void>;
  dispose(): void;
}

export interface PracticeControllerDeps {
  submissions: SubmissionGatePort;
  navigation: NavigationPort;
  index: IndexPort;
  audio: AudioPort;
  storage: StoragePort;
  gateway: GatewayPort;
  clock: () => number;
}

export function createPracticeController(deps: PracticeControllerDeps): PracticeController {
  let state: PracticeControllerState = { ...createInitialMachineState(), overlayOpen: true, marked: false };
  let revision = 0;
  let questionStartedAt = deps.clock();
  let replayCount = 0;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;
  let commandTimer: ReturnType<typeof setTimeout> | undefined;
  let activeAbort: AbortController | undefined;
  let readyGeneration = 0;
  let stopAudioObservation: (() => void) | undefined;
  let stopNavigationObservation: (() => void) | undefined;
  const listeners = new Set<() => void>();

  const publish = (): void => listeners.forEach((listener) => listener());
  const reduce = (event: Parameters<typeof transition>[1], notify = true): void => {
    const { overlayOpen, marked } = state;
    state = { ...transition(state, event), overlayOpen, marked };
    if (notify) publish();
  };
  const fault = (value: RuntimeFault): void => reduce({ type: "FAULTED", fault: value });
  const preserveFault = (error: unknown, code: RuntimeFault["code"], fallback: string): RuntimeFault => {
    const parsed = RuntimeFaultSchema.safeParse(error);
    return parsed.success
      ? parsed.data
      : { code, message: error instanceof Error ? error.message : fallback, recoverable: true };
  };
  const context = (): { question: QuestionRef; navigationEpoch: PracticeState["navigationEpoch"]; signal: AbortSignal } => {
    if (!state.runtime.question) throw new Error("question unavailable");
    activeAbort?.abort();
    activeAbort = new AbortController();
    return { question: state.runtime.question, navigationEpoch: state.runtime.navigationEpoch, signal: activeAbort.signal };
  };
  const saveDraft = async (): Promise<void> => {
    if (draftTimer) {
      clearTimeout(draftTimer);
      draftTimer = undefined;
    }
    const question = state.runtime.question;
    if (!question) return;
    await deps.storage.saveDraft({
      predictionEdition: question.predictionEdition,
      questionId: question.questionId,
      text: state.draft,
      revision,
      updatedAt: new Date(deps.clock()).toISOString(),
    });
  };
  const ready = async (question: QuestionRef, nextEpoch: NavigationEpoch): Promise<void> => {
    const generation = ++readyGeneration;
    const machineEpochAtStart = state.runtime.navigationEpoch;
    const draft = await deps.storage.loadDraft(question.predictionEdition, question.questionId);
    if (generation !== readyGeneration || state.runtime.navigationEpoch !== machineEpochAtStart) return;
    await deps.audio.bind(question, nextEpoch);
    if (generation !== readyGeneration) return;
    await deps.storage.saveSession(question);
    if (generation !== readyGeneration) return;
    questionStartedAt = deps.clock();
    replayCount = 0;
    revision = draft?.revision ?? 0;
    reduce({
      type: state.runtime.phase === "NAVIGATING" ? "NAVIGATION_SUCCEEDED" : "QUESTION_READY",
      question,
      navigationEpoch: nextEpoch,
      restoredDraft: draft?.text ?? "",
    });
  };

  const acceptNavigation = async (result: NavigationResult): Promise<void> => {
    if (Number(result.navigationEpoch) <= Number(state.runtime.navigationEpoch)) return;
    readyGeneration += 1;
    deps.submissions.invalidateBefore(result.navigationEpoch);
    activeAbort?.abort();
    deps.audio.invalidateBefore(result.navigationEpoch);
    if (result.source === "site") reduce({ type: "SITE_NAVIGATION_STARTED", navigationEpoch: result.navigationEpoch });
    await ready(result.question, result.navigationEpoch);
  };

  const controller: PracticeController = {
    async start() {
      stopAudioObservation = deps.audio.subscribe((status) => reduce({ type: "AUDIO_STATUS_CHANGED", status }));
      stopNavigationObservation = deps.navigation.start({
        beforeLeave: saveDraft,
        onObserved: acceptNavigation,
        onFault: fault,
      });
      void deps.gateway.health().then(() => reduce({ type: "HERMES_STATUS_CHANGED", online: true })).catch(() => reduce({ type: "HERMES_STATUS_CHANGED", online: false }));
      await controller.probeSiteContract();
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setDraft(value) {
      revision += 1;
      state = { ...state, draft: value };
      if (draftTimer) clearTimeout(draftTimer);
      draftTimer = setTimeout(() => void saveDraft(), 150);
    },
    flushDraft: saveDraft,
    async submit() {
      const question = state.runtime.question;
      if (!question || state.runtime.phase !== "ANSWERING" || state.draft.trim().length === 0) return;
      await saveDraft();
      const questionEpoch = state.runtime.navigationEpoch;
      const transaction = deps.submissions.begin({
        question,
        navigationEpoch: questionEpoch,
        userAnswer: state.draft,
      });
      reduce({ type: "SUBMIT_REQUESTED", attemptEpoch: transaction.attemptEpoch, submissionToken: transaction.submissionToken });
      try {
        const facts = await transaction.run();
        if (state.runtime.navigationEpoch !== questionEpoch || state.runtime.question?.questionId !== question.questionId) return;
        const attempt: AttemptEvent = {
          attemptId: crypto.randomUUID(),
          questionId: question.questionId,
          accuracy: facts.accuracy,
          durationMs: Math.max(0, deps.clock() - questionStartedAt),
          replayCount,
          errors: facts.errors,
          completedAt: new Date(deps.clock()).toISOString(),
        };
        await deps.storage.commitAttempt(question.predictionEdition, attempt);
        reduce({ type: "SUBMIT_SUCCEEDED", submissionToken: transaction.submissionToken, attempt, nowMs: deps.clock() });
      } catch (error) {
        if (state.runtime.navigationEpoch !== questionEpoch || state.runtime.question?.questionId !== question.questionId) return;
        fault(preserveFault(error, "DESYNC", "submit failed"));
      }
    },
    releaseEnter() {
      reduce({ type: "ENTER_KEYUP" }, false);
    },
    async navigate(target) {
      if (!state.runtime.question) return;
      await saveDraft();
      reduce({ type: "NAVIGATE_REQUESTED", target, nowMs: deps.clock() });
      if (state.runtime.phase !== "NAVIGATING") return;
      const operation = context();
      try {
        const result = await deps.navigation.navigate(target, operation.signal);
        await acceptNavigation(result);
      } catch (error) {
        fault(preserveFault(error, "DESYNC", "navigation failed"));
      }
    },
    async togglePlayback() {
      try { await deps.audio.toggle(); }
      catch (error) { fault(preserveFault(error, "AUDIO_ERROR", "audio failed")); }
    },
    async restartPlayback() {
      try {
        await deps.audio.restart();
        replayCount += 1;
      } catch (error) {
        fault(preserveFault(error, "AUDIO_ERROR", "audio restart failed"));
      }
    },
    async redo() {
      if (!state.runtime.question || state.runtime.phase !== "REVIEW") return;
      reduce({ type: "REDO_REQUESTED" });
      const operation = context();
      try {
        const result = await deps.navigation.redo(operation.signal);
        deps.submissions.invalidateBefore(result.navigationEpoch);
        deps.audio.invalidateBefore(result.navigationEpoch);
        await deps.audio.bind(result.question, result.navigationEpoch);
        reduce({ type: "RESET_SUCCEEDED", question: result.question, navigationEpoch: result.navigationEpoch });
        revision += 1;
        state = { ...state, draft: "" };
        await saveDraft();
        questionStartedAt = deps.clock();
        replayCount = 0;
      } catch (error) {
        fault(preserveFault(error, "DESYNC", "redo reset failed"));
      }
    },
    async toggleMark() {
      const question = state.runtime.question;
      if (!question) return;
      state = { ...state, marked: !state.marked };
      await deps.storage.setMarked(question.predictionEdition, question.questionId, state.marked);
      publish();
    },
    openCommand() {
      reduce({ type: "OPEN_COMMAND", nowMs: deps.clock() });
      if (commandTimer) clearTimeout(commandTimer);
      commandTimer = setTimeout(() => controller.closeCommand(), 1_500);
    },
    closeCommand() {
      reduce({ type: "CLOSE_COMMAND" });
    },
    async retryAudioOrUseSitePlayer() {
      try {
        await deps.audio.restart();
      } catch {
        try { await deps.audio.useSitePlayer(); }
        catch (error) { fault(preserveFault(error, "AUDIO_ERROR", "site player failed")); }
      }
    },
    async probeSiteContract() {
      activeAbort?.abort();
      activeAbort = new AbortController();
      try {
        const verified = await deps.navigation.probe(activeAbort.signal);
        await acceptNavigation(verified);
      } catch (error) {
        fault(preserveFault(error, "SITE_CHANGED", "question unavailable"));
      }
    },
    acceptVerifiedQuestion(question, navigationEpoch) {
      return acceptNavigation({ question, navigationEpoch, source: "probe" });
    },
    reportFault(value) {
      fault(value);
    },
    toggleOverlay() {
      state = { ...state, overlayOpen: !state.overlayOpen };
      publish();
    },
    closeOverlayForLogin() {
      state = { ...state, overlayOpen: false };
      publish();
    },
    async resumeOrKeepPartialIndex() {
      reduce({ type: "INDEX_STATUS_CHANGED", status: "INDEXING" });
      try {
        const outcome = await deps.index.startOrResume();
        reduce({ type: "INDEX_STATUS_CHANGED", status: outcome.status === "complete" ? "COMPLETE" : "PARTIAL" });
      } catch {
        reduce({ type: "INDEX_STATUS_CHANGED", status: "PARTIAL" });
      }
    },
    dispose() {
      if (draftTimer) clearTimeout(draftTimer);
      if (commandTimer) clearTimeout(commandTimer);
      activeAbort?.abort();
      stopAudioObservation?.();
      stopNavigationObservation?.();
      listeners.clear();
    },
  };
  return controller;
}
```

- [ ] **Step 5: Run local-learning tests and typecheck**

Run:

```powershell
pnpm exec vitest run apps/extension/src/learning/local-ranking.test.ts apps/extension/src/practice/practice-controller.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
```

Expected: seven tests PASS; controller source has no raw answer reader, `setDraft` calls no subscriber, audio ambiguity fails closed, and offline rank returns exact local order; TypeScript exits `0`.

- [ ] **Step 6: Commit**

```powershell
git add apps/extension/src/learning apps/extension/src/practice/practice-controller.ts apps/extension/src/practice/practice-controller.test.ts
git commit -m "feat: add local ranking and practice controller"
```

### Task 8: Wire Modes, Ranked Review, Settings, and the Word Library

**Files:**
- Create: `apps/extension/src/practice/practice-settings.ts`
- Create: `apps/extension/src/practice/practice-settings.test.ts`
- Create: `apps/extension/src/learning/review-queue.ts`
- Create: `apps/extension/src/learning/review-queue.test.ts`
- Modify: `apps/extension/src/learning/local-ranking.ts`
- Modify: `apps/extension/src/practice/practice-controller.ts`
- Modify: `apps/extension/src/practice/practice-controller.test.ts`

**Interfaces:**
- Consumes: persisted `UserSettings`, index IDs, monotonic rank snapshots, word summaries, AudioPort status, and the existing deterministic local ranker.
- Produces: `DEFAULT_SETTINGS`, `validateKeymap()`, `buildReviewQueue()`, Practice/Exam policy enforcement, configurable collision-free keys, ranked-review entry, and an in-cockpit read-only word library. None of these paths is allowed to block typing or ordinary sequential navigation.

- [ ] **Step 1: Write failing settings, Exam, and stale-ranking tests**

```ts
// apps/extension/src/practice/practice-settings.test.ts
import { describe, expect, test } from "vitest";
import { DEFAULT_SETTINGS, examPlaybackAllowed, validateKeymap } from "./practice-settings";

describe("practice settings", () => {
  test("uses safe keyboard defaults and rejects collisions", () => {
    expect(DEFAULT_SETTINGS.mode).toBe("practice");
    expect(DEFAULT_SETTINGS.audioStrategy).toBe("site-player-only");
    expect(validateKeymap({ ...DEFAULT_SETTINGS.keymap, "answer.next": DEFAULT_SETTINGS.keymap["answer.previous"]! })).toEqual({
      ok: false,
      conflicts: ["answer.next", "answer.previous"],
    });
  });

  test("Exam allows one successful start, but still allows pausing that playback", () => {
    expect(examPlaybackAllowed("exam", 0, "READY", "toggle")).toBe(true);
    expect(examPlaybackAllowed("exam", 1, "PLAYING", "toggle")).toBe(true);
    expect(examPlaybackAllowed("exam", 1, "PAUSED", "toggle")).toBe(false);
    expect(examPlaybackAllowed("exam", 1, "ENDED", "restart")).toBe(false);
  });
});
```

```ts
// apps/extension/src/learning/review-queue.test.ts
import { describe, expect, test, vi } from "vitest";
import type { GatewayPort } from "../ports/gateway-port";
import type { StoragePort } from "../ports/storage-port";
import { buildReviewQueue } from "./review-queue";

describe("buildReviewQueue", () => {
  test("drops a Hermes answer when learnerStateVersion changes in flight", async () => {
    const snapshots = [
      { learnerStateVersion: 4, candidates: [{ questionId: "q1", dueScore: 1, weaknessScore: 0, noveltyScore: 0, marked: false, attemptCount: 1, lastAttemptAt: null }] },
      { learnerStateVersion: 5, candidates: [{ questionId: "q1", dueScore: 1, weaknessScore: 0, noveltyScore: 0, marked: true, attemptCount: 1, lastAttemptAt: null }] },
    ];
    const storage = { getRankCandidates: vi.fn(async () => snapshots.shift()!) } as unknown as StoragePort;
    const gateway = { rank: vi.fn(async (request) => ({ ...request, rankedQuestionIds: ["q1"] })) } as unknown as GatewayPort;
    expect(await buildReviewQueue(storage, gateway, "yc-2026-w29", ["q1"])).toEqual(["q1"]);
    expect(storage.getRankCandidates).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the focused tests and verify red state**

Run:

```powershell
pnpm exec vitest run apps/extension/src/practice/practice-settings.test.ts apps/extension/src/learning/review-queue.test.ts --environment node
```

Expected: FAIL on missing modules.

- [ ] **Step 3: Implement settings and exact Exam playback policy**

```ts
// apps/extension/src/practice/practice-settings.ts
import type { AudioStatus, UserSettings } from "@pte-pilot/contracts";

export const DEFAULT_SETTINGS: UserSettings = {
  id: "current",
  mode: "practice",
  audioStrategy: "site-player-only",
  keymap: {
    "answer.submit": "Enter",
    "answer.next": "Alt+J",
    "answer.previous": "Alt+K",
    "answer.playback": "Alt+P",
    "answer.restart": "Alt+R",
    "answer.mark": "Alt+M",
    "answer.command": "Escape",
    "review.next-enter": "Enter",
    "review.next-j": "J",
    "review.previous": "K",
    "review.playback": "Space",
    "review.restart": "R",
    "review.redo": "T",
    "review.mark": "M",
    "command.playback": "P",
    "command.restart": "R",
    "command.next": "J",
    "command.previous": "K",
    "command.mark": "M",
    "command.mode": "E",
    "command.review": "Q",
    "command.words": "W",
    "command.settings": "S",
    "command.input": "I",
    "command.close": "Escape",
    "command.help": "?",
  },
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export function validateKeymap(keymap: Record<string, string>): { ok: true } | { ok: false; conflicts: string[] } {
  const byChord = new Map<string, string[]>();
  const reserved: string[] = [];
  for (const [action, chord] of Object.entries(keymap)) {
    const phase = action.split(".", 1)[0] ?? "";
    const canonical = chord.trim().toLocaleLowerCase("en-AU");
    if (canonical === "alt+shift+p" || canonical === "shift+alt+p") reserved.push(action);
    if (phase === "answer" && /^(?:[a-z0-9]|space)$/u.test(canonical)) reserved.push(action);
    const key = `${phase}:${canonical}`;
    byChord.set(key, [...(byChord.get(key) ?? []), action]);
  }
  const conflicts = [...reserved, ...byChord.values().filter((actions) => actions.length > 1).flat()].sort();
  return conflicts.length === 0 ? { ok: true } : { ok: false, conflicts };
}

export function examPlaybackAllowed(
  mode: UserSettings["mode"],
  successfulStarts: number,
  status: AudioStatus,
  action: "toggle" | "restart",
): boolean {
  if (mode === "practice") return true;
  if (action === "toggle" && status === "PLAYING") return true;
  return successfulStarts === 0;
}
```

`Alt+Shift+P` remains a non-configurable global recovery chord and is rejected if entered into the configurable keymap. `validateKeymap()` must canonicalize modifier order, detect phase-local and reserved-chord collisions, and return the exact action names shown beside the settings field.

- [ ] **Step 4: Build and apply a freshness-checked review queue**

```ts
// apps/extension/src/learning/review-queue.ts
import type { GatewayPort } from "../ports/gateway-port";
import type { StoragePort } from "../ports/storage-port";
import { createRankRequest, rankLocally, rankWithGatewayFallback } from "./local-ranking";

export async function buildReviewQueue(
  storage: StoragePort,
  gateway: GatewayPort,
  predictionEdition: string,
  questionIds: readonly string[],
  signal?: AbortSignal,
): Promise<string[]> {
  const first = await storage.getRankCandidates(predictionEdition, questionIds);
  const request = await createRankRequest(first.candidates, first.learnerStateVersion);
  return rankWithGatewayFallback(
    gateway,
    request,
    async () => (await storage.getRankCandidates(predictionEdition, questionIds)).learnerStateVersion,
    signal,
  ).catch(() => rankLocally(first.candidates));
}
```

Modify `rankWithGatewayFallback()` to accept `getCurrentLearnerStateVersion`. After parsing the response but before adopting it, call that function once and require it to equal the request version. Continue rejecting wrong echoes, duplicates, unknown IDs, and candidate-external IDs. A timeout, abort, storage failure, invalid Hermes response, or changed version returns the original deterministic local order.

- [ ] **Step 5: Extend PracticeController without touching the typing hot path**

Add these public state fields and methods:

```ts
interface PracticeControllerState {
  settings: UserSettings;
  reviewQueue: string[];
  wordLibrary: WordStatSummary[] | null;
  settingsOpen: boolean;
  notice: string | null;
}

interface PracticeController {
  setMode(mode: UserSettings["mode"]): Promise<void>;
  saveKeymap(keymap: Record<string, string>): Promise<void>;
  startRankedReview(): Promise<void>;
  openWordLibrary(): Promise<void>;
  closeWordLibrary(): void;
  openSettings(): void;
  closeSettings(): void;
}
```

Implementation requirements:

- `start()` loads settings once, validates them, and falls back to `DEFAULT_SETTINGS`; it does not wait for Hermes.
- `startRankedReview()` calls `storage.loadIndexSnapshot(current.predictionEdition)`, builds a queue from those edition-scoped IDs, validates returned IDs against the same snapshot, stores the queue, then asks `NavigationPort` to select the first ID. Empty/partial indexes show a non-blocking notice.
- A successful attempt updates IndexedDB first. Any later review-queue rebuild therefore receives a newer `learnerStateVersion`.
- `openWordLibrary()` loads only `WordStatSummary[]`; no full correct sentence or audio URL is available to that view.
- In Exam mode, track successful `PLAYING` transitions per verified question. Auto-play or a user play that actually starts counts once. Once consumed, every start/restart command becomes a no-op with an ARIA-live notice; pausing the currently playing audio is still allowed. Reset the counter only in `acceptVerifiedQuestion()` after the new epoch is accepted.
- Mode/keymap writes call `saveSettings()` only after validation. Invalid or reserved mappings remain unsaved and expose the collision list.
- `setDraft()` remains a ref-only update: no settings, ranking, word-library, Gateway, or React work may be added to that method.

- [ ] **Step 6: Run mode, queue, controller, storage, and type checks**

Run:

```powershell
pnpm exec vitest run apps/extension/src/practice/practice-settings.test.ts apps/extension/src/learning/review-queue.test.ts apps/extension/src/practice/practice-controller.test.ts apps/extension/src/background/storage/repositories.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
```

Expected: all focused tests PASS; stale Hermes responses are adopted zero times; Exam starts audio at most once per verified question; invalid keymaps are not persisted; TypeScript exits `0`.

- [ ] **Step 7: Commit**

```powershell
git add apps/extension/src/learning apps/extension/src/practice
git commit -m "feat: wire modes review queue and word library"
```

### Task 9: Mount the Accessible WXT Shadow-DOM Keyboard Cockpit

**Files:**
- Create: `apps/extension/src/app/keyboard.ts`
- Create: `apps/extension/src/app/keyboard.test.ts`
- Create: `apps/extension/src/app/Cockpit.tsx`
- Create: `apps/extension/src/app/SettingsPanel.tsx`
- Create: `apps/extension/src/app/WordLibraryPanel.tsx`
- Create: `apps/extension/src/app/mount-cockpit.tsx`
- Create: `apps/extension/src/app/cockpit.css`
- Create: `apps/extension/src/content/fail-closed-ports.ts`
- Create: `apps/extension/wxt.config.ts`
- Create: `apps/extension/entrypoints/firefly.content.tsx`

**Interfaces:**
- Consumes: `PracticeController`, validated settings/keymap, `ContentScriptContext`, runtime storage/Gateway factories, optional `RecoveryActions`, and fixed test IDs.
- Produces: `mountCockpit({ctx, controller, recoveryActions?}): Promise<() => void>`, full keyboard command interpretation, focus confinement, ARIA status, mode/index/audio/site visibility, word-library/settings panels, and a buildable fail-closed entry that the Firefly integration plan replaces with verified ports.

- [ ] **Step 1: Write failing collision and state-aware keyboard tests**

```ts
// apps/extension/src/app/keyboard.test.ts
import { describe, expect, test } from "vitest";
import { keyboardCommand, type KeyboardInput } from "./keyboard";

const key = (value: Partial<KeyboardInput>): KeyboardInput => ({
  key: "a",
  altKey: false,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  repeat: false,
  isComposing: false,
  ...value,
});

describe("keyboardCommand", () => {
  test("never steals printable answer text", () => {
    expect(keyboardCommand("ANSWERING", key({ key: "p" }))).toBeNull();
    expect(keyboardCommand("ANSWERING", key({ key: " " }))).toBeNull();
  });

  test("maps input chords and ignores repeated destructive keys", () => {
    expect(keyboardCommand("ANSWERING", key({ key: "p", altKey: true }))).toBe("toggle-playback");
    expect(keyboardCommand("ANSWERING", key({ key: "p", altKey: true, shiftKey: true }))).toBe("toggle-overlay");
    expect(keyboardCommand("ANSWERING", key({ key: "Enter" }))).toBe("submit");
    expect(keyboardCommand("ANSWERING", key({ key: "Enter", repeat: true }))).toBeNull();
  });

  test("uses single keys only outside answer entry", () => {
    expect(keyboardCommand("REVIEW", key({ key: " " }))).toBe("toggle-playback");
    expect(keyboardCommand("REVIEW", key({ key: "t" }))).toBe("redo");
    expect(keyboardCommand("COMMAND", key({ key: "j" }))).toBe("next");
    expect(keyboardCommand("REVIEW", key({ key: "j", altKey: true }))).toBeNull();
    expect(keyboardCommand("COMMAND", key({ key: "t", shiftKey: true }))).toBeNull();
    expect(keyboardCommand("COMMAND", key({ key: "e" }))).toBe("toggle-mode");
    expect(keyboardCommand("COMMAND", key({ key: "q" }))).toBe("ranked-review");
    expect(keyboardCommand("COMMAND", key({ key: "w" }))).toBe("word-library");
  });

  test("rejects every repeated command", () => {
    expect(keyboardCommand("ANSWERING", key({ key: "m", altKey: true, repeat: true }))).toBeNull();
    expect(keyboardCommand("REVIEW", key({ key: " ", repeat: true }))).toBeNull();
    expect(keyboardCommand("COMMAND", key({ key: "j", repeat: true }))).toBeNull();
  });

  test("ignores every shortcut during IME composition", () => {
    expect(keyboardCommand("ANSWERING", key({ key: "Enter", isComposing: true }))).toBeNull();
  });
});
```

- [ ] **Step 2: Run keyboard tests and verify red state**

Run: `pnpm exec vitest run apps/extension/src/app/keyboard.test.ts --environment node`

Expected: FAIL with `Cannot find module './keyboard'`.

- [ ] **Step 3: Implement state-aware keyboard interpretation**

```ts
// apps/extension/src/app/keyboard.ts
import type { MainPhase } from "@pte-pilot/contracts";
import { DEFAULT_SETTINGS } from "../practice/practice-settings";

export interface KeyboardInput {
  key: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  isComposing: boolean;
}

export type CockpitCommand =
  | "submit"
  | "next"
  | "previous"
  | "toggle-playback"
  | "restart-playback"
  | "toggle-mark"
  | "redo"
  | "open-command"
  | "close-command"
  | "show-help"
  | "toggle-mode"
  | "ranked-review"
  | "word-library"
  | "open-settings"
  | "toggle-overlay";

const commandByBinding: Record<string, CockpitCommand> = {
  submit: "submit",
  next: "next",
  "next-enter": "next",
  "next-j": "next",
  previous: "previous",
  playback: "toggle-playback",
  restart: "restart-playback",
  mark: "toggle-mark",
  redo: "redo",
  command: "open-command",
  close: "close-command",
  input: "close-command",
  help: "show-help",
  mode: "toggle-mode",
  review: "ranked-review",
  words: "word-library",
  settings: "open-settings",
};

const canonicalEventChord = (event: KeyboardInput): string => {
  const key = event.key === " " ? "space" : event.key.toLocaleLowerCase("en-AU");
  const modifiers = [event.altKey ? "alt" : "", event.shiftKey && key !== "?" ? "shift" : ""].filter(Boolean);
  return [...modifiers, key].join("+");
};

export function keyboardCommand(
  phase: MainPhase,
  event: KeyboardInput,
  keymap: Record<string, string> = DEFAULT_SETTINGS.keymap,
): CockpitCommand | null {
  if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey) return null;
  const key = event.key.toLocaleLowerCase("en-AU");
  if (event.altKey && event.shiftKey && key === "p") return "toggle-overlay";
  const prefix = phase === "ANSWERING" ? "answer." : phase === "REVIEW" ? "review." : phase === "COMMAND" ? "command." : null;
  if (!prefix) return null;
  const chord = canonicalEventChord(event);
  const match = Object.entries(keymap).find(([action, binding]) =>
    action.startsWith(prefix) && binding.trim().toLocaleLowerCase("en-AU") === chord,
  );
  return match ? commandByBinding[match[0].slice(prefix.length)] ?? null : null;
}
```

- [ ] **Step 4: Render stable selectors, focus states, and recovery controls**

```tsx
// apps/extension/src/app/Cockpit.tsx
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import type { PracticeController } from "../practice/practice-controller";
import { keyboardCommand, type CockpitCommand } from "./keyboard";
import { SettingsPanel } from "./SettingsPanel";
import { WordLibraryPanel } from "./WordLibraryPanel";

export interface RecoveryActions {
  retry(): void | Promise<void>;
  openOriginalSite(): void;
}
export interface CockpitProps { controller: PracticeController; recoveryActions: RecoveryActions }

const focusable = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden);

export function Cockpit({ controller, recoveryActions }: CockpitProps) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const recoveryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const release = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Enter") controller.releaseEnter();
    };
    window.addEventListener("keyup", release, true);
    return () => window.removeEventListener("keyup", release, true);
  }, [controller]);

  useEffect(() => {
    const toggle = (event: globalThis.KeyboardEvent): void => {
      const isToggleChord = !event.ctrlKey
        && !event.metaKey
        && event.altKey
        && event.shiftKey
        && event.key.toLocaleLowerCase("en-AU") === "p";
      if (!isToggleChord) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat && !event.isComposing) controller.toggleOverlay();
    };
    window.addEventListener("keydown", toggle, true);
    return () => window.removeEventListener("keydown", toggle, true);
  }, [controller]);

  useLayoutEffect(() => {
    if (!state.overlayOpen) return;
    if (state.runtime.fault) recoveryRef.current?.focus();
    else if (state.settingsOpen || state.wordLibrary) {
      const modal = rootRef.current?.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
      focusable(modal ?? rootRef.current!).at(0)?.focus();
    }
    else if (state.runtime.phase === "ANSWERING") {
      if (inputRef.current && inputRef.current.value !== state.draft) inputRef.current.value = state.draft;
      inputRef.current?.focus();
    } else if (state.runtime.phase === "REVIEW") reviewRef.current?.focus();
    else if (state.runtime.phase === "COMMAND") commandRef.current?.focus();
    else statusRef.current?.focus();
  }, [state.overlayOpen, state.runtime.phase, state.runtime.question?.questionId, state.runtime.fault?.code, state.settingsOpen, state.wordLibrary]);

  if (!state.overlayOpen) return null;

  const run = (command: CockpitCommand): void => {
    const actions: Record<CockpitCommand, () => void> = {
      submit: () => void controller.submit(),
      next: () => void controller.navigate("next"),
      previous: () => void controller.navigate("previous"),
      "toggle-playback": () => void controller.togglePlayback(),
      "restart-playback": () => void controller.restartPlayback(),
      "toggle-mark": () => void controller.toggleMark(),
      redo: () => void controller.redo(),
      "open-command": controller.openCommand,
      "close-command": controller.closeCommand,
      "show-help": controller.openCommand,
      "toggle-mode": () => void controller.setMode(state.settings.mode === "practice" ? "exam" : "practice"),
      "ranked-review": () => void controller.startRankedReview(),
      "word-library": () => void controller.openWordLibrary(),
      "open-settings": controller.openSettings,
      "toggle-overlay": controller.toggleOverlay,
    };
    actions[command]();
    if (state.runtime.phase === "COMMAND" && !["close-command", "show-help"].includes(command)) {
      controller.closeCommand();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Tab" && rootRef.current) {
      const modal = rootRef.current.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
      const scope = modal ?? rootRef.current;
      const items = focusable(scope);
      if (items.length === 0) {
        event.preventDefault();
        scope.focus();
        return;
      }
      const rootNode = rootRef.current.getRootNode();
      const active = rootNode instanceof ShadowRoot ? rootNode.activeElement : document.activeElement;
      const current = items.indexOf(active as HTMLElement);
      const next = event.shiftKey ? (current <= 0 ? items.length - 1 : current - 1) : (current + 1) % items.length;
      if (items[next]) { event.preventDefault(); items[next]!.focus(); }
      return;
    }
    if (state.settingsOpen || state.wordLibrary) {
      if (event.key === "Escape" && !event.repeat && !event.isComposing) {
        event.preventDefault();
        if (state.settingsOpen) controller.closeSettings();
        else controller.closeWordLibrary();
      }
      return;
    }
    const command = keyboardCommand(state.runtime.phase, event.nativeEvent, state.settings.keymap);
    if (!command) return;
    event.preventDefault();
    event.stopPropagation();
    run(command);
  };

  const question = state.runtime.question;
  const faultCode = state.runtime.fault?.code ?? "";
  return (
    <main
      ref={rootRef}
      data-testid="pte-pilot-root"
      data-question-id={question?.questionId ?? ""}
      aria-label="PTE Pilot WFD"
      role="region"
      onKeyDownCapture={onKeyDown}
    >
      <header>
        <strong>PTE Pilot</strong>
        <span data-testid="practice-mode">{state.settings.mode}</span>
        <span data-testid="prediction-edition">{question?.predictionEdition ?? "—"}</span>
        <span data-testid="question-id">#{question?.questionId ?? "—"}</span>
        <span data-testid="question-position">{question ? `${question.position}/${question.total}` : "—/—"}</span>
        <span data-testid="audio-status">audio:{state.runtime.audioStatus.toLocaleLowerCase("en-AU")}</span>
        <span data-testid="index-status">index:{state.runtime.indexStatus.toLocaleLowerCase("en-AU")}</span>
        <span data-testid="site-status">site:{state.runtime.fault ? "blocked" : "synced"}</span>
        <span data-testid="hermes-status">{state.runtime.hermesOnline ? "online" : "offline"}</span>
        <button type="button" onClick={controller.closeOverlayForLogin}>关闭覆盖层</button>
      </header>

      <div
        ref={statusRef}
        tabIndex={-1}
        data-testid="practice-state"
        data-fault-code={faultCode}
        aria-live="polite"
      >
        {state.runtime.phase}
      </div>

      <section aria-label="WFD typing area">
        <textarea
          ref={inputRef}
          data-testid="answer-input"
          aria-label="WFD answer"
          defaultValue={state.draft}
          readOnly={state.runtime.phase !== "ANSWERING"}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          onInput={(event) => controller.setDraft(event.currentTarget.value)}
          onBlur={() => void controller.flushDraft()}
        />
      </section>

      {state.notice && <div role="status" aria-live="polite" data-testid="practice-notice">{state.notice}</div>}

      {state.wordLibrary && (
        <WordLibraryPanel words={state.wordLibrary} onClose={controller.closeWordLibrary} />
      )}

      {state.settingsOpen && (
        <SettingsPanel
          settings={state.settings}
          onModeChange={(mode) => void controller.setMode(mode)}
          onSaveKeymap={(keymap) => controller.saveKeymap(keymap)}
          onClose={controller.closeSettings}
        />
      )}

      {state.runtime.phase === "REVIEW" && (
        <div
          ref={reviewRef}
          tabIndex={-1}
          data-testid="review-result"
          data-guard-until-ms={state.reviewGuardUntilMs ?? ""}
        >
          <strong>{Math.round((state.review?.accuracy ?? 0) * 100)}%</strong>
          <ul>
            {state.review?.errors.map((error, index) => (
              <li key={`${error.type}-${index}`}>
                <span>{error.type}</span> <del>{error.actual || "∅"}</del> <ins>{error.expected || "∅"}</ins>
              </li>
            ))}
          </ul>
          <span>Enter 下一题 · T 重做 · M 标记</span>
        </div>
      )}

      {state.runtime.phase === "COMMAND" && (
        <div ref={commandRef} tabIndex={-1} data-testid="command-layer" role="dialog" aria-modal="true" aria-label="Keyboard commands">
          <p>P 播放 · R 重播 · J 下一题 · K 上一题 · M 标记 · I 返回输入</p>
          <p>输入态：Alt+P/R/J/K/M · Enter 提交 · Esc 命令层 · Alt+Shift+P 显示/隐藏</p>
          <p>结果态：Enter/J 下一题 · K 上一题 · Space 播放 · T 重做 · M 标记</p>
          <button type="button" onClick={controller.closeCommand}>返回输入</button>
        </div>
      )}

      {state.runtime.fault && (
        <aside role="alert">
          <p>{state.runtime.fault.message}</p>
          <button ref={recoveryRef} data-testid="recovery-retry" type="button" onClick={() => void recoveryActions.retry()}>重试</button>
          <button data-testid="recovery-original-site" type="button" onClick={recoveryActions.openOriginalSite}>返回原网页</button>
        </aside>
      )}
    </main>
  );
}
```

```tsx
// apps/extension/src/app/SettingsPanel.tsx
import { useState } from "react";
import type { UserSettings } from "@pte-pilot/contracts";
import { validateKeymap } from "../practice/practice-settings";

export function SettingsPanel(props: {
  settings: UserSettings;
  onModeChange(mode: UserSettings["mode"]): void;
  onSaveKeymap(keymap: Record<string, string>): Promise<void>;
  onClose(): void;
}) {
  const [keymap, setKeymap] = useState({ ...props.settings.keymap });
  const [conflicts, setConflicts] = useState<string[]>([]);
  const save = async (): Promise<void> => {
    const validation = validateKeymap(keymap);
    if (!validation.ok) return setConflicts(validation.conflicts);
    await props.onSaveKeymap(keymap);
    props.onClose();
  };
  return (
    <section role="dialog" aria-modal="true" aria-label="PTE Pilot settings" data-testid="settings-panel">
      <fieldset>
        <legend>模式</legend>
        <button type="button" aria-pressed={props.settings.mode === "practice"} onClick={() => props.onModeChange("practice")}>Practice</button>
        <button type="button" aria-pressed={props.settings.mode === "exam"} onClick={() => props.onModeChange("exam")}>Exam</button>
      </fieldset>
      {Object.entries(keymap).map(([action, chord]) => (
        <label key={action}>{action}<input value={chord} onChange={(event) => setKeymap({ ...keymap, [action]: event.currentTarget.value })} /></label>
      ))}
      {conflicts.length > 0 && <p role="alert">冲突：{conflicts.join(", ")}</p>}
      <button type="button" onClick={() => void save()}>保存</button>
      <button type="button" onClick={props.onClose}>取消</button>
    </section>
  );
}
```

```tsx
// apps/extension/src/app/WordLibraryPanel.tsx
import type { WordStatSummary } from "@pte-pilot/contracts";

export function WordLibraryPanel({ words, onClose }: { words: WordStatSummary[]; onClose(): void }) {
  return (
    <section role="dialog" aria-modal="true" aria-label="Wrong word library" data-testid="word-library">
      <table>
        <thead><tr><th>应为</th><th>写成</th><th>类型</th><th>次数</th></tr></thead>
        <tbody>{words.map((word) => <tr key={word.key}><td>{word.expected}</td><td>{word.actual || "∅"}</td><td>{word.type}</td><td>{word.occurrences}</td></tr>)}</tbody>
      </table>
      <button type="button" onClick={onClose}>返回练习</button>
    </section>
  );
}
```

Both panels participate in the same modal focus scope used by COMMAND. `Escape` closes the top panel first. Settings inputs are the only place where printable keys are not interpreted as cockpit commands; the global `Alt+Shift+P` recovery chord still works.

- [ ] **Step 5: Mount React inside WXT Shadow DOM and restore page accessibility whenever the overlay closes**

```tsx
// apps/extension/src/app/mount-cockpit.tsx
import { createRoot, type Root } from "react-dom/client";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { PracticeController } from "../practice/practice-controller";
import { Cockpit, type RecoveryActions } from "./Cockpit";

export interface MountCockpitArgs { ctx: ContentScriptContext; controller: PracticeController; recoveryActions?: RecoveryActions }

export async function mountCockpit({ ctx, controller, recoveryActions }: MountCockpitArgs): Promise<() => void> {
  const previous = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
  let host: HTMLElement | undefined;
  let isolationEnabled = false;
  let siteFocus: HTMLElement | null = null;

  const isolateCurrentChildren = (): void => {
    for (const child of [...document.body.children]) {
      if (!(child instanceof HTMLElement) || child === host || (host && child.contains(host))) continue;
      if (!previous.has(child)) previous.set(child, { inert: child.inert, ariaHidden: child.getAttribute("aria-hidden") });
      child.inert = true;
      child.setAttribute("aria-hidden", "true");
    }
  };
  const restorePage = (): void => {
    for (const [element, value] of previous) {
      element.inert = value.inert;
      if (value.ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", value.ariaHidden);
    }
    previous.clear();
  };
  const setPageIsolation = (enabled: boolean): void => {
    if (enabled === isolationEnabled) {
      if (enabled) isolateCurrentChildren();
      return;
    }
    if (enabled) {
      const active = document.activeElement;
      siteFocus = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    isolationEnabled = enabled;
    if (enabled) isolateCurrentChildren();
    else {
      restorePage();
      if (siteFocus?.isConnected && !siteFocus.inert) siteFocus.focus({ preventScroll: true });
      siteFocus = null;
    }
  };
  const pageObserver = new MutationObserver(() => {
    if (isolationEnabled) isolateCurrentChildren();
  });
  pageObserver.observe(document.body, { childList: true });

  const ui = await createShadowRootUi<Root>(ctx, {
    name: "pte-pilot-cockpit",
    position: "overlay",
    anchor: "body",
    isolateEvents: true,
    onMount(container) {
      host = container.getRootNode() instanceof ShadowRoot
        ? (container.getRootNode() as ShadowRoot).host as HTMLElement
        : undefined;
      setPageIsolation(controller.getState().overlayOpen);
      const root = createRoot(container);
      root.render(<Cockpit
        controller={controller}
        recoveryActions={recoveryActions ?? {
          retry: () => controller.probeSiteContract(),
          openOriginalSite: controller.closeOverlayForLogin,
        }}
      />);
      return root;
    },
    onRemove(root) {
      root?.unmount();
    },
  });
  ui.mount();
  const unsubscribe = controller.subscribe(() => setPageIsolation(controller.getState().overlayOpen));
  return () => {
    unsubscribe();
    pageObserver.disconnect();
    setPageIsolation(false);
    ui.remove();
  };
}
```

```css
/* apps/extension/src/app/cockpit.css */
:host { all: initial; }
[data-testid="pte-pilot-root"] {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 20px;
  padding: clamp(20px, 4vw, 64px);
  color: #172033;
  background: #f6f8fb;
  font: 500 16px/1.5 Inter, "Segoe UI", sans-serif;
  overflow: auto;
}
header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
header strong { font-size: 24px; }
header button { margin-left: auto; }
textarea {
  box-sizing: border-box;
  width: min(85ch, 100%);
  min-height: 180px;
  padding: 20px;
  border: 2px solid #7283a7;
  border-radius: 12px;
  color: #111827;
  background: #fff;
  font: 500 clamp(22px, 2vw, 24px)/1.65 "Segoe UI", sans-serif;
  resize: vertical;
}
textarea:focus, button:focus, [tabindex="-1"]:focus { outline: 3px solid #1668dc; outline-offset: 3px; }
button { padding: 10px 14px; border: 1px solid #52617d; border-radius: 8px; background: #fff; color: #172033; font: inherit; }
[data-testid="review-result"], [data-testid="command-layer"], aside { padding: 18px; border: 1px solid #b9c3d5; border-radius: 12px; background: #fff; }
[role="dialog"] { max-width: min(900px, 100%); max-height: 80vh; overflow: auto; padding: 18px; border: 2px solid #52617d; border-radius: 12px; background: #fff; }
[role="dialog"] label { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(10rem, 1fr); gap: 12px; margin-block: 8px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; border-block-end: 1px solid #b9c3d5; text-align: left; }
del { color: #9f1239; } ins { color: #166534; text-decoration: none; }
@media (max-width: 700px), (min-resolution: 2dppx) { [data-testid="pte-pilot-root"] { padding: 16px; gap: 12px; } [role="dialog"] label { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (forced-colors: active) { textarea, button, aside { border: 2px solid CanvasText; } }
```

- [ ] **Step 6: Add WXT configuration and fail-closed composition entry**

```ts
// apps/extension/src/content/fail-closed-ports.ts
import type { AudioPort } from "../ports/audio-port";
import type { IndexPort } from "../ports/index-port";
import type { NavigationPort } from "../ports/navigation-port";
import type { SubmissionGatePort } from "../ports/submission-gate-port";

const unavailable = async (): Promise<never> => { throw new Error("verified Firefly adapter unavailable"); };

export const createFailClosedSubmissionGate = (): SubmissionGatePort => ({
  begin: () => { throw new Error("verified AnswerGate unavailable"); },
  invalidateBefore: () => undefined,
  dispose: () => undefined,
});

export const createFailClosedNavigationPort = (): NavigationPort => ({
  start: () => () => undefined,
  probe: unavailable,
  navigate: unavailable,
  redo: unavailable,
  dispose: () => undefined,
});

export const createFailClosedIndexPort = (): IndexPort => ({
  startOrResume: unavailable,
  findQuestion: async () => null,
  pause: () => undefined,
  dispose: () => undefined,
});

export const createFailClosedAudioPort = (): AudioPort => ({
  bind: unavailable,
  getStatus: () => "EMPTY",
  subscribe: () => () => undefined,
  toggle: unavailable,
  restart: unavailable,
  useSitePlayer: unavailable,
  invalidateBefore: () => undefined,
  dispose: () => undefined,
});
```

```ts
// apps/extension/wxt.config.ts
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "PTE Pilot",
    version: "0.1.0",
    minimum_chrome_version: "120",
    permissions: ["storage", "webRequest"],
    host_permissions: [
      "https://www.fireflyau.com/*",
      "https://upload.fireflyau.com/*",
      "http://127.0.0.1:8642/*",
    ],
  },
});
```

```tsx
// apps/extension/entrypoints/firefly.content.tsx
import "../src/app/cockpit.css";
import { browser } from "wxt/browser";
import { createRuntimeGatewayPort } from "../src/content/runtime-gateway-port";
import { createRuntimeStoragePort } from "../src/content/runtime-storage-port";
import {
  createFailClosedAudioPort,
  createFailClosedIndexPort,
  createFailClosedNavigationPort,
  createFailClosedSubmissionGate,
} from "../src/content/fail-closed-ports";
import { mountCockpit } from "../src/app/mount-cockpit";
import { createPracticeController } from "../src/practice/practice-controller";

export default defineContentScript({
  matches: ["https://www.fireflyau.com/ptehome/exercise*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const submission = createFailClosedSubmissionGate();
    const navigation = createFailClosedNavigationPort();
    const index = createFailClosedIndexPort();
    const audio = createFailClosedAudioPort();
    const controller = createPracticeController({
      submissions: submission,
      navigation,
      index,
      audio,
      storage: createRuntimeStoragePort(browser.runtime),
      gateway: createRuntimeGatewayPort(browser.runtime),
      clock: Date.now,
    });
    const unmount = await mountCockpit({ ctx, controller });
    let disposed = false;
    const dispose = (): void => {
      if (disposed) return;
      disposed = true;
      unmount();
      controller.dispose();
      submission.dispose();
      navigation.dispose();
      index.dispose();
      audio.dispose();
    };
    ctx.onInvalidated(dispose);
    try { await controller.start(); }
    catch (error) {
      controller.reportFault({ code: "SITE_CHANGED", message: error instanceof Error ? error.message : "startup failed", recoverable: true });
    }
  },
});
```

- [ ] **Step 7: Run keyboard, architecture, accessibility-selector, and build checks**

Run:

```powershell
pnpm exec vitest run apps/extension/src/app/keyboard.test.ts apps/extension/src/content/storage-boundary.test.ts --environment node
rg -n "pte-pilot-root|answer-input|practice-state|practice-mode|prediction-edition|question-id|question-position|audio-status|index-status|site-status|review-result|hermes-status|word-library|settings-panel|recovery-retry|recovery-original-site|command-layer|aria-label=\"WFD answer\"|aria-label=\"PTE Pilot WFD\"" apps/extension/src/app
pnpm --filter @pte-pilot/extension typecheck
pnpm --filter @pte-pilot/extension build
pnpm lint
```

Expected: keyboard/boundary tests PASS; `rg` returns every fixed selector and both ARIA labels; typecheck/build/lint exit `0`; build emits Chrome MV3 output without Dexie in the content-script dependency graph.

- [ ] **Step 8: Commit**

```powershell
git add apps/extension/src/app apps/extension/src/content/fail-closed-ports.ts apps/extension/wxt.config.ts apps/extension/entrypoints/firefly.content.tsx
git commit -m "feat: mount keyboard-first shadow cockpit"
```

## Final Verification

- [ ] Run `pnpm check`; expected all unit tests, typechecks, and Biome checks PASS.
- [ ] Run `pnpm build`; expected Chrome Manifest V3 bundle under `apps/extension/.output/chrome-mv3`.
- [ ] Run `$terms = @(("TO" + "DO"), ("TB" + "D"), ("implement" + " later"), ("Similar" + " to Task")); Select-String -Path docs/superpowers/plans/2026-07-15-pte-pilot-cockpit-local-learning.md -Pattern $terms`; expected no matches.
- [ ] Run `rg -n "from [\"']dexie[\"']|indexedDB" apps/extension/src/content apps/extension/src/app apps/extension/src/practice apps/extension/src/ports`; expected no matches.
- [ ] Confirm every shared export is present in `packages/contracts/src/index.ts` and every fixed UI selector is present in `Cockpit.tsx`.
- [ ] Confirm every task above has one focused commit before starting Firefly, Gateway, or integration-hardening plans.

## Execution Handoff

Plan complete at `docs/superpowers/plans/2026-07-15-pte-pilot-cockpit-local-learning.md`. Execute with `superpowers:subagent-driven-development` for fresh implementer/reviewer gates per task, or `superpowers:executing-plans` for checkpointed inline execution.
