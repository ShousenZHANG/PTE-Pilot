# PTE Pilot Integration and Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the keyboard cockpit, Firefly adapter, media/answer gates, and PTE Pilot Gateway into one verified Chrome MV3 practice loop that satisfies the approved safety and performance acceptance criteria.

**Architecture:** Build the WXT extension once, load it into Playwright Chromium with a persistent profile, and route the real Firefly/upload origins to deterministic fixtures. Exercise the full product only through public DOM, runtime-message, and loopback HTTP boundaries; then run a small authenticated canary against the real site after fixture tests pass.

**Tech Stack:** Node.js 24.15.0, pnpm 11.7.0, WXT 0.20.27, React 19.2.7, TypeScript 6.0.3, Vitest 4.1.10, Playwright 1.61.1, Fastify 5.10.0, better-sqlite3 12.11.1, Biome 2.5.4.

## Global Constraints

- Complete the Cockpit/Local Learning, Firefly Adapter/Media Sync, and Hermes Gateway plans before this plan.
- Target Chrome Manifest V3 with minimum Chrome version `120`.
- Keep permissions exactly `storage` and `webRequest`; keep host permissions exactly the two Firefly origins and `http://127.0.0.1:8642/*`.
- Never request `<all_urls>`, cookies, debugger, downloads, tabs, webRequestBlocking, or unlimitedStorage.
- Never put a correct answer in extension UI, storage, logs, runtime messages, or Gateway requests before the current submission is verified.
- Never persist audio bytes or bulk-fetch the weekly media set.
- Never let Hermes enter typing, playback, scoring, navigation, event acknowledgement, or local fallback critical paths.
- Treat `IndexedDB` in the extension Service Worker as the authoritative event store; treat Gateway SQLite as a rebuildable projection.
- Use exact `questionId`, `navigationEpoch`, `attemptEpoch`, `submissionToken`, and `captureToken` checks; ambiguous state fails closed.
- All automated Firefly tests route fixture responses and must not contact the production site.
- Treat `FireflyFixtureScenario` as frozen: tests may pass only its existing fields and must not add shorthand such as `total`, `answers`, `audioDurationMs`, `ambiguousAudio`, or `gatewayOffline`.

---

## Locked File Map

- `playwright.config.ts` — root Playwright configuration for the built MV3 extension.
- `tests/e2e/fixtures/extension.fixture.ts` — persistent Chromium context, extension ID, and page fixtures.
- `tests/e2e/tsconfig.json` — strict compile gate for every Playwright fixture/spec and the loopback integration source.
- `tests/e2e/extension-load.spec.ts` — build/load and Shadow DOM smoke test.
- `tests/e2e/full-practice-loop.spec.ts` — keyboard-only play, submit, review, redo, and navigation loop.
- `tests/e2e/security-invariants.spec.ts` — answer leakage, origin storage, token, and permission assertions.
- `tests/e2e/failure-matrix.spec.ts` — desync, site drift, ambiguous audio, stale answers, and Hermes-offline behavior.
- `tests/e2e/performance.spec.ts` — opt-in keyboard and audio latency benchmark.
- `tests/e2e/soak.spec.ts` — configurable long-run, focus, repeat-key, and recovery test.
- `tests/e2e/hermes-online.integration.ts` — live loopback pairing, health, rank, outbox, SQLite, and ACK chain.
- `tests/e2e/scale-accessibility.spec.ts` — 100 extension navigations, 20 manual switches, 30 audio checks, and accessibility media gates.
- `vitest.online.config.ts` — isolated single-worker runner for the real loopback Gateway integration.
- `scripts/audit-manifest.mts` — generated Manifest V3 least-privilege audit.
- `scripts/audit-bundle.mts` — production bundle scan for forbidden secrets and origins.
- `docs/runbooks/firefly-authenticated-canary.md` — exact real-site canary procedure.
- `docs/verification/pte-pilot-v1-acceptance.md` — evidence recorded by the final release gate.

### Task 1: Root Playwright Extension Harness

**Files:**
- Modify: `playwright.config.ts`
- Create: `tests/e2e/fixtures/extension.fixture.ts`
- Create: `tests/e2e/tsconfig.json`
- Create: `tests/e2e/extension-load.spec.ts`
- Modify: `tests/e2e/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: built extension directory `apps/extension/.output/chrome-mv3`; `installFireflyFixture(context, scenario)` from `tests/fixtures/firefly/firefly-week.fixture.ts`.
- Produces: `test`, `expect`, `ExtensionFixtures`, `getExtensionWorker()`, and a strict `@pte-pilot/e2e` typecheck for every later E2E task.

- [ ] **Step 1: Write the failing extension-load test**

```ts
// tests/e2e/extension-load.spec.ts
import { installFireflyFixture } from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

test('loads the cockpit only on the Firefly WFD page', async ({ context, page }) => {
  await installFireflyFixture(context, {
    questionIds: ['131001', '131002', '131003'],
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');

  await expect(page.getByTestId('pte-pilot-root')).toBeVisible();
  await expect(page.getByTestId('question-position')).toHaveText('1/3');
  await expect(page.getByTestId('answer-input')).toBeFocused();
});
```

- [ ] **Step 2: Run the test and strict compiler to verify the harness is absent**

Run:

```powershell
pnpm --filter @pte-pilot/extension build
pnpm exec playwright test tests/e2e/extension-load.spec.ts
pnpm --filter @pte-pilot/e2e typecheck
```

Expected: Playwright FAILS because the extension fixture does not exist; the typecheck command FAILS because `@pte-pilot/e2e` has no `typecheck` script yet.

- [ ] **Step 3: Harden the existing Playwright configuration and create the extension fixture**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
});
```

```ts
// tests/e2e/fixtures/extension.fixture.ts
import { chromium, expect, test as base, type BrowserContext, type Page, type Worker } from '@playwright/test';
import path from 'node:path';

export interface ExtensionFixtures {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  getExtensionWorker: () => Promise<Worker>;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use, testInfo) => {
    const extensionPath = path.resolve('apps/extension/.output/chrome-mv3');
    const context = await chromium.launchPersistentContext(testInfo.outputPath('chrome-profile'), {
      channel: 'chromium',
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },
  getExtensionWorker: async ({ context }, use) => {
    await use(async () => {
      const existing = context.serviceWorkers()[0];
      return existing ?? context.waitForEvent('serviceworker');
    });
  },
  extensionId: async ({ getExtensionWorker }, use) => {
    const worker = await getExtensionWorker();
    await use(new URL(worker.url()).host);
  },
});

export { expect };
```

Create the strict E2E compiler configuration:

```json
// tests/e2e/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["./**/*.ts", "../fixtures/**/*.ts", "../../vitest.online.config.ts"]
}
```

Replace the empty E2E workspace manifest with exact test-only dependencies. Native SQLite remains allowlisted by the existing root `pnpm.onlyBuiltDependencies` policy:

```json
// tests/e2e/package.json
{
  "name": "@pte-pilot/e2e",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@pte-pilot/contracts": "workspace:*",
    "@types/better-sqlite3": "7.6.13",
    "@types/node": "24.13.3",
    "better-sqlite3": "12.11.1",
    "fake-indexeddb": "6.2.5",
    "fastify": "5.10.0",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  }
}
```

Add exact root scripts:

```powershell
pnpm pkg set "scripts.test:e2e=pnpm --filter @pte-pilot/extension build && playwright test --grep-invert '@(performance|soak)'"
pnpm pkg set "scripts.test:e2e:headed=pnpm --filter @pte-pilot/extension build && playwright test --headed --grep-invert '@(performance|soak)'"
pnpm install
```

- [ ] **Step 4: Run the smoke test**

Run:

```powershell
pnpm --filter @pte-pilot/e2e typecheck
pnpm test:e2e -- tests/e2e/extension-load.spec.ts
```

Expected: strict TypeScript exits `0`; Playwright reports `1 passed`; the opened page shows the Shadow DOM cockpit at `1/3`.

- [ ] **Step 5: Commit**

```powershell
git add playwright.config.ts tests/e2e/fixtures/extension.fixture.ts tests/e2e/tsconfig.json tests/e2e/extension-load.spec.ts tests/e2e/package.json package.json pnpm-lock.yaml
git commit -m "test: add extension Playwright harness"
```

### Task 2: Keyboard-Only Full Practice Loop

**Files:**
- Create: `tests/e2e/full-practice-loop.spec.ts`
- Modify: `apps/extension/entrypoints/firefly.content.tsx`

**Interfaces:**
- Consumes: the locked `FireflyFixtureScenario` fields `questionIds`, `answerByQuestionId`, `scoreRequiresReveal`, and `loopNavigation`; cockpit `data-guard-until-ms`; UI-only `unmount()`; runtime-owned `dispose()`.
- Produces: executable proof that the overlay and original site remain on the same exact question through submit, review, redo, next, previous, and observed navigation.

- [ ] **Step 1: Write the end-to-end keyboard tests**

```ts
// tests/e2e/full-practice-loop.spec.ts
import type { Page } from '@playwright/test';
import { installFireflyFixture } from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

async function waitForReviewReady(page: Page): Promise<void> {
  const review = page.getByTestId('review-result');
  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
  await expect.poll(() => review.evaluate((element) => {
    const raw = element.getAttribute('data-guard-until-ms');
    return raw !== null && raw !== '' && Date.now() >= Number(raw);
  })).toBe(true);
}

test.beforeEach(async ({ context, page }) => {
  await installFireflyFixture(context, {
    questionIds: ['131001', '131002', '131003'],
    answerByQuestionId: {
      '131001': 'write down this sentence',
      '131002': 'practice makes progress',
      '131003': 'accuracy before speed',
    },
    scoreRequiresReveal: true,
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
});

test('completes submit review and next without a mouse', async ({ page }) => {
  const input = page.getByTestId('answer-input');
  await page.keyboard.press('Alt+P');
  await input.fill('write down this sentense');
  await page.keyboard.press('Enter');

  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
  await expect(page.getByTestId('review-result')).toContainText('sentense');
  await expect(page.getByTestId('pte-pilot-root')).toHaveAttribute('data-question-id', '131001');

  await waitForReviewReady(page);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('question-position')).toHaveText('2/3');
  await expect(page.getByTestId('pte-pilot-root')).toHaveAttribute('data-question-id', '131002');
  await expect(input).toBeFocused();
});

test('redo creates a fresh attempt and previous returns to the saved draft', async ({ page }) => {
  const input = page.getByTestId('answer-input');
  await input.fill('write down this sentence');
  await page.keyboard.press('Enter');
  await waitForReviewReady(page);
  await page.keyboard.press('T');
  await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');
  await expect(input).toHaveValue('');

  await input.fill('second attempt');
  await page.keyboard.press('Alt+J');
  await page.keyboard.press('Alt+K');
  await expect(input).toHaveValue('second attempt');
});

test('observes a site-side navigation without clicking next twice', async ({ page }) => {
  await page.locator('[data-testid="site-next"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId('question-position')).toHaveText('2/3');
  await expect(page.locator('[data-testid="site-navigation-count"]')).toHaveText('1');
});

test('releases the original page and reopens from the global keyboard chord', async ({ page }) => {
  const root = page.getByTestId('pte-pilot-root');
  const input = page.getByTestId('answer-input');
  const siteNext = page.getByTestId('site-next');

  await page.keyboard.press('Alt+Shift+P');
  await expect(root).toHaveCount(0);
  await expect.poll(() => siteNext.evaluate((element) => element.closest('[inert]') === null)).toBe(true);
  await siteNext.focus();
  await expect(siteNext).toBeFocused();

  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.down('P');
  await expect(root).toBeVisible();
  await page.keyboard.down('P');
  await expect(root).toBeVisible();
  await page.keyboard.up('P');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
  await expect(input).toBeFocused();

  await page.keyboard.press('Alt+Shift+P');
  await expect(root).toHaveCount(0);
  await expect(siteNext).toBeFocused();
  await page.keyboard.press('Alt+Shift+P');
  await expect(input).toBeFocused();
});
```

- [ ] **Step 2: Run the tests and confirm the first integration gaps**

Run: `pnpm test:e2e -- tests/e2e/full-practice-loop.spec.ts`

Expected: FAIL on the first unwired cross-component behavior; no test may contact the real Firefly origin because the fixture routes are installed first.

- [ ] **Step 3: Wire only the public ports needed by the tests**

Replace `apps/extension/entrypoints/firefly.content.tsx` with the complete composition entrypoint:

```ts
// apps/extension/entrypoints/firefly.content.tsx
import '../src/app/cockpit.css';
import { defineContentScript } from '#imports';
import { mountCockpit } from '../src/app/mount-cockpit';
import { bootstrapFireflySync } from '../src/firefly/bootstrap-firefly-sync';

export default defineContentScript({
  matches: ['https://www.fireflyau.com/ptehome/exercise*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    const runtime = await bootstrapFireflySync({ ctx, document });
    const unmount = await mountCockpit({ ctx, controller: runtime.controller });
    ctx.onInvalidated(() => {
      unmount();
      runtime.dispose();
    });
  },
});
```

Do not add direct DOM calls to React components. Do not import the Service Worker Dexie database into the content script. Lifecycle ownership is exact: `mountCockpit()` removes only React/Shadow DOM and restores focus/inert state; `runtime.dispose()` is the sole controller owner, and `PracticeController.dispose()` is the sole AudioPort owner. Both prerequisite plans must expose idempotent cleanup matching this entrypoint.

- [ ] **Step 4: Run focused and unit regression tests**

Run: `pnpm --filter @pte-pilot/e2e typecheck && pnpm test:e2e -- tests/e2e/full-practice-loop.spec.ts && pnpm test`

Expected: all four E2E tests PASS; all workspace unit tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/extension/entrypoints/firefly.content.tsx tests/e2e/full-practice-loop.spec.ts
git commit -m "test: verify keyboard-only practice loop"
```

### Task 3: Pre-Submit Answer and Storage Isolation Audit

**Files:**
- Create: `tests/e2e/security-invariants.spec.ts`

**Interfaces:**
- Consumes: `getExtensionWorker()`, fixture responses containing a deliberately unique answer marker, Service Worker Dexie database, and trusted extension storage.
- Produces: proof that the correct answer never crosses an extension boundary before submit and that Firefly-origin scripts cannot see the extension database or Gateway token.

- [ ] **Step 1: Write the security invariant test**

```ts
// tests/e2e/security-invariants.spec.ts
import type { Page } from '@playwright/test';
import { installFireflyFixture } from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

const secretAnswer = 'quartz zephyr answer marker';

async function waitForReviewReady(page: Page): Promise<void> {
  const review = page.getByTestId('review-result');
  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
  await expect.poll(() => review.evaluate((element) => {
    const raw = element.getAttribute('data-guard-until-ms');
    return raw !== null && raw !== '' && Date.now() >= Number(raw);
  })).toBe(true);
}

test('keeps answer and extension storage isolated before submit', async ({ context, getExtensionWorker, page }) => {
  const consoleText: string[] = [];
  page.on('console', (message) => consoleText.push(message.text()));
  await installFireflyFixture(context, {
    questionIds: ['131001'],
    answerByQuestionId: { '131001': secretAnswer },
    listApiIncludesAnswers: true,
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');

  expect(await page.locator('body').innerText()).not.toContain(secretAnswer);
  expect(consoleText.join('\n')).not.toContain(secretAnswer);
  expect(await page.evaluate(async () => (await indexedDB.databases()).map((db) => db.name))).not.toContain('pte-pilot');

  const worker = await getExtensionWorker();
  const workerSnapshot = await worker.evaluate(async () => {
    const databases = await indexedDB.databases();
    const storage = await chrome.storage.local.get();
    return { databases: databases.map((db) => db.name), storage: JSON.stringify(storage) };
  });
  expect(workerSnapshot.databases).toContain('pte-pilot-facts-v1');
  expect(workerSnapshot.storage).not.toContain(secretAnswer);
  expect(workerSnapshot.storage).not.toContain('API_SERVER_KEY');
});
```

- [ ] **Step 2: Run the test to expose any leaked bridge field or wrong-origin database**

Run: `pnpm test:e2e -- tests/e2e/security-invariants.spec.ts`

Expected: PASS. Any failure blocks further integration work and names the leaking boundary.

- [ ] **Step 3: Add a regression assertion for post-submit scope and navigation cleanup**

Append this complete test to the same file:

```ts
test('uses the revealed answer only for the active attempt and clears it on navigation', async ({ context, page }) => {
  await installFireflyFixture(context, {
    questionIds: ['131001', '131002'],
    answerByQuestionId: {
      '131001': secretAnswer,
      '131002': 'second safe answer',
    },
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await page.getByTestId('answer-input').fill('quartz zephyr marker');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('review-result')).toContainText('answer');
  await waitForReviewReady(page);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('question-position')).toHaveText('2/2');
  await expect(page.getByTestId('pte-pilot-root')).not.toContainText(secretAnswer);
});
```

- [ ] **Step 4: Run the full security file**

Run: `pnpm --filter @pte-pilot/e2e typecheck && pnpm test:e2e -- tests/e2e/security-invariants.spec.ts`

Expected: `2 passed` and no secret marker in retained trace logs.

- [ ] **Step 5: Commit**

```powershell
git add tests/e2e/security-invariants.spec.ts
git commit -m "test: enforce answer and storage isolation"
```

### Task 4: Fail-Closed Integration Matrix

**Files:**
- Create: `tests/e2e/failure-matrix.spec.ts`
- Create: `apps/extension/src/practice/recovery-actions.ts`
- Modify: `apps/extension/src/practice/practice-controller.ts`
- Modify: `apps/extension/src/app/mount-cockpit.tsx`

**Interfaces:**
- Consumes: only the locked `FireflyFixtureScenario` fields `questionIds`, `answerByQuestionId`, `mediaByQuestionId`, `staleReveal`, and `changedSelectors`; an ambiguous media candidate is represented by two URLs for one existing `mediaByQuestionId` key. Gateway offline state is produced by aborting only the loopback route, not by adding a fixture field.
- Produces: executable recovery contracts for `AUDIO_ERROR`, `DESYNC`, and `SITE_CHANGED`, plus deterministic lowercase `offline` Gateway fallback.

- [ ] **Step 1: Write the failure-matrix tests**

```ts
// tests/e2e/failure-matrix.spec.ts
import type { Page } from '@playwright/test';
import {
  installFireflyFixture,
  type FireflyFixtureScenario,
} from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

async function waitForReviewReady(page: Page): Promise<void> {
  const review = page.getByTestId('review-result');
  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
  await expect.poll(() => review.evaluate((element) => {
    const raw = element.getAttribute('data-guard-until-ms');
    return raw !== null && raw !== '' && Date.now() >= Number(raw);
  })).toBe(true);
}

const failureScenarios: Array<{
  name: string;
  overrides: Partial<FireflyFixtureScenario>;
  faultCode: 'AUDIO_ERROR' | 'SITE_CHANGED';
  startAudio: boolean;
}> = [
  {
    name: 'ambiguous audio',
    overrides: {
      questionIds: ['131001', '131002'],
      mediaByQuestionId: {
        '131001': [
          'https://upload.fireflyau.com/q1-a.wav',
          'https://upload.fireflyau.com/q1-b.wav',
        ],
        '131002': ['https://upload.fireflyau.com/q2.wav'],
      },
    },
    faultCode: 'AUDIO_ERROR',
    startAudio: true,
  },
  {
    name: 'changed selectors',
    overrides: {
      questionIds: ['131001', '131002'],
      changedSelectors: true,
    },
    faultCode: 'SITE_CHANGED',
    startAudio: false,
  },
];

for (const scenario of failureScenarios) {
  test(`fails closed for ${scenario.name}`, async ({ context, page }) => {
    await installFireflyFixture(context, scenario.overrides);
    await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
    if (scenario.startAudio) {
      await page.evaluate(() => {
        const competing = document.createElement('audio');
        competing.src = 'https://upload.fireflyau.com/q1-b.wav';
        competing.dataset.testid = 'site-competing-audio';
        document.body.append(competing);
        competing.load();
      });
      await page.keyboard.press('Alt+P');
    }
    await expect(page.getByTestId('practice-state')).toHaveText('PAUSED');
    await expect(page.getByTestId('practice-state')).toHaveAttribute('data-fault-code', scenario.faultCode);
    const retry = page.getByTestId('recovery-retry');
    const input = page.getByTestId('answer-input');
    await expect(retry).toBeFocused();
    await expect(input).toHaveJSProperty('readOnly', true);
    await input.focus();
    await page.keyboard.type('must not submit');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="site-score-count"]')).toHaveText('0');
    if (scenario.startAudio) {
      await retry.focus();
      await retry.press('Enter');
      await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');
      await expect(input).toBeEditable();
    }
  });
}

test('contains a stale reveal and redo clears the verified attempt', async ({ context, page }) => {
  await installFireflyFixture(context, {
    questionIds: ['131001'],
    answerByQuestionId: { '131001': 'fresh answer' },
    staleReveal: true,
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await page.getByTestId('answer-input').fill('first');
  await page.keyboard.press('Enter');
  await waitForReviewReady(page);
  await expect(page.getByTestId('review-result')).not.toContainText('stale answer');
  await page.keyboard.press('T');
  await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');
  await expect(page.locator('[data-testid="site-score-count"]')).toHaveText('1');
  await expect(page.getByTestId('answer-input')).toBeEditable();
  await expect(page.getByTestId('answer-input')).toHaveValue('');
});

test('keeps practicing with deterministic order while Gateway is offline', async ({ context, page }) => {
  await context.route('http://127.0.0.1:8642/**', (route) => route.abort('connectionrefused'));
  await installFireflyFixture(context, {
    questionIds: ['131001', '131002'],
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await expect(page.getByTestId('hermes-status')).toHaveText('offline');
  await expect(page.getByTestId('answer-input')).toBeEditable();
  await page.getByTestId('answer-input').fill('offline attempt');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
});
```

- [ ] **Step 2: Run the matrix before recovery wiring**

Run: `pnpm test:e2e -- tests/e2e/failure-matrix.spec.ts`

Expected: at least one FAIL if a fault still permits scoring, carries a stale reveal, loses focus, or blocks on Gateway.

- [ ] **Step 3: Route every fault through the existing recovery panel**

Create one complete recovery-action factory and keep `Cockpit.tsx` component-local recovery logic empty. The factory exposes the existing structural `RecoveryActions` shape consumed by `mountCockpit()` and dispatches from the current typed fault at activation time:

```ts
// apps/extension/src/practice/recovery-actions.ts
import type { RuntimeFault } from '@pte-pilot/contracts';
import type { PracticeController } from './practice-controller';

export function createRecoveryActions(controller: PracticeController) {
  const byFault: Record<RuntimeFault['code'], () => void | Promise<void>> = {
    AUDIO_ERROR: () => controller.retryAudioOrUseSitePlayer(),
    DESYNC: () => controller.probeSiteContract(),
    SITE_CHANGED: () => controller.probeSiteContract(),
    AUTH_REQUIRED: () => controller.closeOverlayForLogin(),
    INDEX_PARTIAL: () => controller.resumeOrKeepPartialIndex(),
  };
  return {
    retry(): void | Promise<void> {
      const currentFault = controller.getState().runtime.fault;
      if (currentFault) return byFault[currentFault.code]();
    },
    openOriginalSite(): void {
      controller.closeOverlayForLogin();
    },
  };
}
```

Replace the existing contracts import in `practice-controller.ts` with the exact import below. Then place the helpers immediately after the existing `fault()` closure and replace the three controller methods with the exact guarded implementations that follow. Every rejected AudioPort promise becomes a typed `AUDIO_ERROR`; a stale native redo becomes a typed `DESYNC` instead of leaving the reducer in `RESETTING`.

```ts
import {
  AttemptEpochSchema,
  NavigationEpochSchema,
  RuntimeFaultSchema,
  SubmissionTokenSchema,
  type AttemptEvent,
  type PracticeState,
  type QuestionRef,
  type RuntimeFault,
} from '@pte-pilot/contracts';
```

```ts
const normalizeFault = (
  error: unknown,
  fallbackCode: RuntimeFault['code'],
  fallbackMessage: string,
): RuntimeFault => {
  const parsed = RuntimeFaultSchema.safeParse(error);
  if (parsed.success) return parsed.data;
  return RuntimeFaultSchema.parse({
    code: fallbackCode,
    message: error instanceof Error ? error.message : fallbackMessage,
    recoverable: true,
  });
};

const runAudio = async (operation: () => Promise<void>): Promise<void> => {
  try {
    await operation();
  } catch (error) {
    fault(normalizeFault(error, 'AUDIO_ERROR', 'audio operation failed'));
  }
};

// Exact replacements inside the PracticeController object:
togglePlayback: () => runAudio(() => deps.audio.toggle()),

async restartPlayback() {
  replayCount += 1;
  await runAudio(() => deps.audio.restart());
},

async redo() {
  if (!state.runtime.question || state.runtime.phase !== 'REVIEW') return;
  reduce({ type: 'REDO_REQUESTED' });
  try {
    await deps.site.redo(context());
    reduce({ type: 'RESET_SUCCEEDED' });
    questionStartedAt = deps.clock();
    replayCount = 0;
  } catch (error) {
    fault(normalizeFault(error, 'DESYNC', 'redo did not reset the verified answer surface'));
  }
},

async retryAudioOrUseSitePlayer() {
  try {
    try {
      await deps.audio.restart();
    } catch {
      await deps.audio.useSitePlayer();
    }
    await controller.probeSiteContract();
  } catch (error) {
    fault(normalizeFault(error, 'AUDIO_ERROR', 'audio recovery failed'));
  }
},
```

Wire the factory into `Cockpit.tsx`; the focused retry button must dispatch by the current typed fault instead of always probing the site:

```tsx
import { createRecoveryActions } from '../practice/recovery-actions';

// Inside Cockpit, after all hooks and before render:
const recoveryActions = createRecoveryActions(controller);

// Exact retry button replacement; keep the existing recoveryRef:
<button
  ref={recoveryRef}
  data-testid="recovery-retry"
  type="button"
  onClick={() => {
    const currentFault = controller.getState().runtime.fault;
    if (currentFault) void recoveryActions[currentFault.code]();
  }}
>
  重试
</button>
```

- [ ] **Step 4: Re-run the matrix and unit suite**

Run: `pnpm --filter @pte-pilot/e2e typecheck && pnpm test:e2e -- tests/e2e/failure-matrix.spec.ts && pnpm test`

Expected: all matrix tests PASS; unit tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/extension/src/practice/recovery-actions.ts apps/extension/src/practice/practice-controller.ts apps/extension/src/app/Cockpit.tsx tests/e2e/failure-matrix.spec.ts
git commit -m "test: enforce fail-closed recovery matrix"
```

### Task 5: Reproducible Keyboard and Audio Performance Gates

**Files:**
- Create: `tests/e2e/performance.spec.ts`
- Create: `apps/extension/src/diagnostics/performance-metrics.ts`
- Modify: `apps/extension/src/app/Cockpit.tsx`
- Modify: `apps/extension/src/firefly/audio/audio-broker.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: cockpit `performance` entries named `pte-keydown-handler` and `pte-keydown-paint`; AudioBroker emits `pte-audio-key-to-playing` only after the real media `playing` event.
- Produces: opt-in `@performance` tests with fixed sample counts and percentile computation.

- [ ] **Step 1: Write the percentile helper and failing benchmark**

```ts
// tests/e2e/performance.spec.ts
import { installFireflyFixture } from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

function percentile(values: number[], quantile: number): number {
  const ordered = [...values].sort((a, b) => a - b);
  if (ordered.length === 0) throw new Error('percentile requires at least one sample');
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * quantile) - 1)]!;
}

test('@performance records 5000 lossless keys without long tasks', async ({ context, page }) => {
  test.setTimeout(15 * 60_000);
  await installFireflyFixture(context, { questionIds: ['131001'] });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  const baselineLongTasks = await page.evaluate(() => {
    performance.clearMeasures('pte-keydown-handler');
    performance.clearMeasures('pte-keydown-paint');
    return performance.getEntriesByType('longtask').length;
  });
  const expected = `${'accuracy '.repeat(555)}accur`;
  await page.getByTestId('answer-input').pressSequentially(expected, { delay: 120 });
  await page.waitForTimeout(50);

  const value = await page.getByTestId('answer-input').inputValue();
  const metrics = await page.evaluate(() => ({
    handlers: performance.getEntriesByName('pte-keydown-handler').map((entry) => entry.duration),
    paints: performance.getEntriesByName('pte-keydown-paint').map((entry) => entry.duration),
    longTasks: performance.getEntriesByType('longtask').length,
  }));
  expect(value).toBe(expected);
  expect(metrics.longTasks - baselineLongTasks).toBe(0);
  expect(percentile(metrics.handlers, 0.95)).toBeLessThan(2);
  const frameMs = await page.evaluate(async () => {
    const samples: number[] = [];
    let previous = performance.now();
    for (let index = 0; index < 60; index += 1) {
      const current = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
      samples.push(current - previous);
      previous = current;
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)]!;
  });
  expect(percentile(metrics.paints, 0.95)).toBeLessThan(frameMs + 2);
});

test('@performance starts cached audio within 100ms p95', async ({ context, page }) => {
  await installFireflyFixture(context, { questionIds: ['131001'] });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await page.keyboard.press('Alt+P');
  await page.waitForFunction(() => performance.getEntriesByName('pte-audio-key-to-playing').length >= 1);
  await page.keyboard.press('Alt+P');
  await page.evaluate(() => performance.clearMeasures('pte-audio-key-to-playing'));

  for (let index = 0; index < 200; index += 1) {
    await page.keyboard.press('Alt+R');
    await page.waitForFunction((count) => (
      performance.getEntriesByName('pte-audio-key-to-playing').length >= count
    ), index + 1);
  }
  const durations = await page.evaluate(() => (
    performance.getEntriesByName('pte-audio-key-to-playing').map((entry) => entry.duration)
  ));
  expect(percentile(durations, 0.95)).toBeLessThan(100);
});
```

- [ ] **Step 2: Run the benchmark to verify instrumentation is missing**

Run: `pnpm test:e2e -- --grep @performance`

Expected: FAIL because the named performance entries are absent or the sample count is zero.

- [ ] **Step 3: Add bounded instrumentation without changing the typing path**

Create `apps/extension/src/diagnostics/performance-metrics.ts` with the following bounded metrics, then call its functions from the existing `Cockpit.tsx` DOM handler and AudioBroker:

```ts
// apps/extension/src/diagnostics/performance-metrics.ts
const MAX_MEASURES = 6_000;

let audioRequestedAt: number | null = null;

export function measureKeydown<T>(eventTimeStamp: number, handler: () => T): T {
  const start = performance.now();
  try {
    return handler();
  } finally {
    performance.measure('pte-keydown-handler', { start, end: performance.now() });
    requestAnimationFrame((paintedAt) => {
      performance.measure('pte-keydown-paint', { start: eventTimeStamp, end: paintedAt });
    });
    const entries = performance.getEntriesByName('pte-keydown-handler');
    if (entries.length > MAX_MEASURES) {
      performance.clearMeasures('pte-keydown-handler');
      performance.clearMeasures('pte-keydown-paint');
    }
  }
}

export function markAudioRequested(eventTimeStamp: number): void {
  audioRequestedAt = eventTimeStamp;
}

export function markAudioPlaying(playingAt = performance.now()): void {
  if (audioRequestedAt === null) return;
  performance.measure('pte-audio-key-to-playing', { start: audioRequestedAt, end: playingAt });
  audioRequestedAt = null;
}
```

Wrap the complete `Cockpit.tsx` `onKeyDown` body with `measureKeydown(event.timeStamp, ...)`. Call `markAudioRequested(event.timeStamp)` only after `keyboardCommand()` accepts play/restart, then call `markAudioPlaying()` from the media element's real `playing` listener. The test performs exactly 200 ready-state plays against one fixture resource and does not fetch 200 distinct files.

Add the diagnostics import and replace `onKeyDown` with this complete handler; this is the real keyboard hot path created by the Cockpit plan, not a parallel keyboard-controller file:

```tsx
import { markAudioRequested, measureKeydown } from '../diagnostics/performance-metrics';

const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
  measureKeydown(event.timeStamp, () => {
    if (event.key === 'Tab' && rootRef.current) {
      const scope = state.runtime.phase === 'COMMAND' && commandRef.current
        ? commandRef.current
        : rootRef.current;
      const items = focusable(scope);
      if (items.length === 0) {
        event.preventDefault();
        scope.focus();
        return;
      }
      const rootNode = rootRef.current.getRootNode();
      const active = rootNode instanceof ShadowRoot ? rootNode.activeElement : document.activeElement;
      const current = items.indexOf(active as HTMLElement);
      const next = event.shiftKey
        ? (current <= 0 ? items.length - 1 : current - 1)
        : (current + 1) % items.length;
      const target = items[next];
      if (target) {
        event.preventDefault();
        target.focus();
      }
      return;
    }
    const command = keyboardCommand(state.runtime.phase, event.nativeEvent);
    if (!command) return;
    event.preventDefault();
    event.stopPropagation();
    if (command === 'toggle-playback' || command === 'restart-playback') {
      markAudioRequested(event.timeStamp);
    }
    run(command);
  });
};
```

Add the real media-event instrumentation to `createAudioBroker`; listener removal belongs to the same returned AudioPort `dispose()` method:

```ts
import { markAudioPlaying } from '../../diagnostics/performance-metrics';

const element = new Audio();
const onPlaying = (): void => markAudioPlaying();
element.addEventListener('playing', onPlaying);

// Add before the existing broker cleanup inside dispose():
element.removeEventListener('playing', onPlaying);
```

- [ ] **Step 4: Add the opt-in command and run the benchmark**

```powershell
pnpm pkg set "scripts.test:perf=pnpm --filter @pte-pilot/extension build && playwright test --grep @performance"
pnpm --filter @pte-pilot/e2e typecheck
pnpm test:perf
```

Expected: 5,000 characters match exactly; handler p95 is below 2ms; no input long tasks; cached audio p95 is below 100ms. Record browser version, CPU model, and refresh rate in Playwright attachments.

- [ ] **Step 5: Commit**

```powershell
git add apps/extension/src/diagnostics/performance-metrics.ts apps/extension/src/app/Cockpit.tsx apps/extension/src/firefly/audio/audio-broker.ts tests/e2e/performance.spec.ts package.json
git commit -m "test: add input and audio performance gates"
```

### Task 6: Generated Manifest and Bundle Security Audit

**Files:**
- Create: `scripts/audit-manifest.mts`
- Create: `scripts/audit-bundle.mts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `apps/extension/.output/chrome-mv3/manifest.json` and emitted JavaScript.
- Produces: deterministic non-browser release gates for permissions, matches, secrets, remote code, and forbidden origins.

- [ ] **Step 1: Write the manifest audit**

```ts
// scripts/audit-manifest.mts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path = 'apps/extension/.output/chrome-mv3/manifest.json';
const manifest = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
const sorted = (values: unknown) => [...((values as string[] | undefined) ?? [])].sort();

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.minimum_chrome_version, '120');
assert.deepEqual(sorted(manifest.permissions), ['storage', 'webRequest']);
assert.deepEqual(sorted(manifest.host_permissions), [
  'http://127.0.0.1:8642/*',
  'https://upload.fireflyau.com/*',
  'https://www.fireflyau.com/*',
]);
assert.equal(JSON.stringify(manifest).includes('<all_urls>'), false);
assert.equal(JSON.stringify(manifest).includes('webRequestBlocking'), false);
assert.equal(JSON.stringify(manifest).includes('downloads'), false);
console.log('manifest audit passed');
```

- [ ] **Step 2: Write the bundle audit**

```ts
// scripts/audit-bundle.mts
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = 'apps/extension/.output/chrome-mv3';
async function collect(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(target) : [target];
  }));
  return nested.flat();
}

const scripts = (await collect(root)).filter((file) => file.endsWith('.js'));
const source = (await Promise.all(scripts.map((file) => readFile(file, 'utf8')))).join('\n');
for (const forbidden of [
  'API_SERVER_KEY=',
  'BEGIN PRIVATE KEY',
  'sk-proj-',
  'https://api.openai.com/',
  'http://0.0.0.0',
  'http://localhost',
  '<all_urls>',
]) {
  assert.equal(source.includes(forbidden), false, `forbidden bundle text: ${forbidden}`);
}
console.log('bundle audit passed');
```

- [ ] **Step 3: Run audits before adding scripts**

Run: `node scripts/audit-manifest.mts && node scripts/audit-bundle.mts`

Expected: PASS for a compliant build; any extra permission, host, credential marker, or remote origin causes a nonzero exit.

- [ ] **Step 4: Add the release verification command**

```powershell
pnpm pkg set "scripts.audit:extension=node scripts/audit-manifest.mts && node scripts/audit-bundle.mts"
pnpm pkg set "scripts.format:check=biome check ."
pnpm pkg set "scripts.verify=pnpm format:check && pnpm typecheck && pnpm test && pnpm --filter @pte-pilot/extension build && pnpm audit:extension"
pnpm verify
```

Expected: formatter, all workspace types including `@pte-pilot/e2e`, unit tests, extension build, manifest audit, and bundle audit all exit `0`.

- [ ] **Step 5: Commit**

```powershell
git add scripts/audit-manifest.mts scripts/audit-bundle.mts package.json
git commit -m "test: audit extension permissions and bundle"
```

### Task 7: Crash Recovery and 60-Minute Keyboard Soak

**Files:**
- Create: `tests/e2e/soak.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: persistent Chromium profile, Service Worker IndexedDB, keyboard commands, recovery panel, and fixture navigation counters.
- Produces: configurable soak evidence; acceptance mode runs exactly 60 minutes.

- [ ] **Step 1: Write the configurable soak test**

```ts
// tests/e2e/soak.spec.ts
import type { Page, Worker } from '@playwright/test';
import {
  installFireflyFixture,
  type FireflyFixtureScenario,
} from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

interface StoredDraft {
  predictionEdition: string;
  questionId: string;
  text: string;
  revision: number;
  updatedAt: string;
}

function buildQuestionFixture(total: number): Pick<
  FireflyFixtureScenario,
  'questionIds' | 'answerByQuestionId' | 'mediaByQuestionId'
> {
  const questionIds = Array.from({ length: total }, (_, index) => String(131001 + index));
  return {
    questionIds,
    answerByQuestionId: Object.fromEntries(
      questionIds.map((questionId, index) => [questionId, `fixture answer ${index + 1}`]),
    ),
    mediaByQuestionId: Object.fromEntries(
      questionIds.map((questionId, index) => [
        questionId,
        [`https://upload.fireflyau.com/q${index + 1}.wav`],
      ]),
    ),
  };
}

async function waitForReviewReady(page: Page): Promise<void> {
  const review = page.getByTestId('review-result');
  await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
  await expect.poll(() => review.evaluate((element) => {
    const raw = element.getAttribute('data-guard-until-ms');
    return raw !== null && raw !== '' && Date.now() >= Number(raw);
  })).toBe(true);
}

async function readDraftFact(worker: Worker): Promise<StoredDraft | null> {
  return worker.evaluate(async () => {
    const databases = await indexedDB.databases();
    if (!databases.some(({ name }) => name === 'pte-pilot-facts-v1')) return null;
    return new Promise<StoredDraft | null>((resolve, reject) => {
      const open = indexedDB.open('pte-pilot-facts-v1');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const database = open.result;
        if (!database.objectStoreNames.contains('drafts')) {
          database.close();
          resolve(null);
          return;
        }
        const request = database
          .transaction('drafts', 'readonly')
          .objectStore('drafts')
          .get(['2026-W29', '131001']);
        request.onerror = () => {
          database.close();
          reject(request.error);
        };
        request.onsuccess = () => {
          const value = (request.result as StoredDraft | undefined) ?? null;
          database.close();
          resolve(value);
        };
      };
    });
  });
}

test('@soak preserves focus and avoids duplicate transitions', async ({ context, page }) => {
  const minutes = Number(process.env.PTE_SOAK_MINUTES ?? '1');
  test.setTimeout((minutes + 2) * 60_000);
  await installFireflyFixture(context, {
    ...buildQuestionFixture(20),
    loopNavigation: true,
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  const deadline = Date.now() + minutes * 60_000;
  let operations = 0;

  while (Date.now() < deadline) {
    const input = page.getByTestId('answer-input');
    await expect(input).toBeFocused();
    await input.fill(`attempt ${operations}`);
    await page.keyboard.down('Enter');
    await expect(page.getByTestId('practice-state')).toHaveText('REVIEW');
    await page.keyboard.down('Enter');
    await page.waitForTimeout(2_000);
    await page.keyboard.up('Enter');
    await waitForReviewReady(page);
    if (operations % 5 === 0) {
      await page.keyboard.press('T');
      await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');
      await page.keyboard.press('Alt+J');
    } else {
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId('practice-state')).toHaveText('ANSWERING');
    await expect(input).toBeFocused();
    operations += 1;
  }

  expect(operations).toBeGreaterThan(0);
  await expect(page.locator('[data-testid="site-double-submit-count"]')).toHaveText('0');
  await expect(page.locator('[data-testid="site-navigation-mismatch-count"]')).toHaveText('0');
});
```

- [ ] **Step 2: Add an abrupt-page-close recovery test with an observable persistence barrier**

Append a second test that types a timestamped draft, polls the Service Worker fact database until the exact record is readable, closes the page without blur, opens the same Firefly URL in the persistent context, and asserts the exact `questionId` and durable draft checkpoint. No fixed sleep may stand in for persistence acknowledgement.

```ts
test('@soak restores the durable draft checkpoint after abrupt close', async ({ context, getExtensionWorker, page }) => {
  await installFireflyFixture(context, buildQuestionFixture(3));
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  const draft = 'durable checkpoint 2026-07-15T12:00:00.000Z';
  await page.getByTestId('answer-input').fill(draft);
  const worker = await getExtensionWorker();
  await expect.poll(async () => (await readDraftFact(worker))?.text, { timeout: 5_000 }).toBe(draft);
  await expect.poll(async () => (await readDraftFact(worker))?.revision ?? 0).toBeGreaterThan(0);
  await page.close({ runBeforeUnload: false });
  const reopened = await context.newPage();
  await reopened.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await expect(reopened.getByTestId('question-position')).toHaveText('1/3');
  await expect(reopened.getByTestId('pte-pilot-root')).toHaveAttribute('data-question-id', '131001');
  await expect(reopened.getByTestId('answer-input')).toHaveValue(draft);
});
```

- [ ] **Step 3: Run the one-minute development soak**

Run: `pnpm --filter @pte-pilot/e2e typecheck; $env:PTE_SOAK_MINUTES='1'; pnpm --filter @pte-pilot/extension build; pnpm exec playwright test --grep @soak`

Expected: both tests PASS; focus remains inside the overlay; duplicate submit and mismatch counters stay `0`.

- [ ] **Step 4: Add the acceptance command**

```powershell
pnpm pkg set "scripts.test:soak=pnpm --filter @pte-pilot/extension build && playwright test --grep @soak"
$env:PTE_SOAK_MINUTES='60'; pnpm test:soak
```

Expected: the 60-minute run exits `0` with no focus loss, double submit, auto-skip, or question mismatch.

- [ ] **Step 5: Commit**

```powershell
git add tests/e2e/soak.spec.ts package.json
git commit -m "test: add recovery and keyboard soak gates"
```

### Task 8: Live Loopback Hermes and SQLite End-to-End Gate

**Files:**
- Create: `vitest.online.config.ts`
- Create: `tests/e2e/hermes-online.integration.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `createGatewayServer(config)`, `makeTestConfig()`, `PairingService`, `HttpGatewayClient`, `GatewaySettingsRepository`, `CockpitRepositories`, `createPtePilotDb(name)`, and the exact shared rank/event/health contracts.
- Produces: one deterministic live-HTTP proof of pairing → trusted token storage → health → Hermes rank → local atomic attempt/outbox → Gateway SQLite receipt → exact ACK → local outbox deletion. The injected Hermes client reports only `pte-pilot` plus `memory`; the authenticated canary in Task 10 audits the real Hermes process.

- [ ] **Step 1: Write the isolated online runner and complete live-chain test**

```ts
// vitest.online.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/hermes-online.integration.ts'],
    setupFiles: ['tests/setup-indexeddb.ts'],
    pool: 'forks',
    fileParallelism: false,
    minWorkers: 1,
    maxWorkers: 1,
    testTimeout: 30_000,
  },
});
```

```ts
// tests/e2e/hermes-online.integration.ts
import 'fake-indexeddb/auto';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, test } from 'vitest';
import type { AttemptEvent, BatchUpsertResponse, RankRequest } from '@pte-pilot/contracts';
import { createPtePilotDb, type PtePilotDb } from '../../apps/extension/src/background/storage/db';
import { CockpitRepositories } from '../../apps/extension/src/background/storage/repositories';
import { CockpitOutboxQueue } from '../../apps/extension/src/background/gateway/cockpit-outbox-queue';
import { HttpGatewayClient } from '../../apps/extension/src/background/gateway/gateway-client';
import { OutboxSyncCoordinator } from '../../apps/extension/src/background/gateway/outbox-sync';
import {
  GatewaySettingsRepository,
  initializeTrustedGatewayStorage,
  type TrustedStorageArea,
} from '../../apps/extension/src/background/gateway/gateway-settings';
import { openGatewayDatabase } from '../../apps/gateway/src/db/database';
import type { HermesClient } from '../../apps/gateway/src/hermes/hermes-client';
import { PairingService } from '../../apps/gateway/src/security/pairing-service';
import { createGatewayServer } from '../../apps/gateway/src/server';
import { makeTestConfig } from '../../apps/gateway/src/test/make-test-config';

const ORIGIN = 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const PEPPER = 'integration-pepper-with-at-least-thirty-two-characters';
const NOW = new Date('2026-07-15T12:00:00.000Z');

class MemoryTrustedStorage implements TrustedStorageArea {
  readonly values: Record<string, unknown> = {};
  trusted = false;

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.values, items);
  }

  async remove(key: string): Promise<void> {
    delete this.values[key];
  }

  async setAccessLevel({ accessLevel }: { accessLevel: 'TRUSTED_CONTEXTS' }): Promise<void> {
    this.trusted = accessLevel === 'TRUSTED_CONTEXTS';
  }
}

const extensionOriginFetch = (): typeof fetch => async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('Origin', ORIGIN);
  return fetch(input, { ...init, headers });
};

describe('online Gateway and Hermes chain', () => {
  let server: FastifyInstance | undefined;
  let facts: PtePilotDb | undefined;
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    await server?.close();
    if (facts) await facts.delete();
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
    server = undefined;
    facts = undefined;
    temporaryDirectory = undefined;
  });

  test('pairs, checks health and rank, then projects and acknowledges one durable attempt', async () => {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'pte-pilot-online-'));
    const sqlitePath = path.join(temporaryDirectory, 'gateway.sqlite');
    const seedDatabase = openGatewayDatabase(sqlitePath);
    const seedPairing = new PairingService({
      database: seedDatabase,
      pepper: PEPPER,
      ttlMs: 300_000,
      now: () => NOW,
      randomBytes: (size) => Buffer.alloc(size, 3),
    });
    const pairingCode = seedPairing.createCode();
    seedDatabase.close();

    const calls = { audit: 0, rank: 0, syncMemory: 0 };
    const hermes: HermesClient = {
      audit: async () => {
        calls.audit += 1;
        return {
          status: 'ready',
          model: 'pte-pilot',
          enabledTools: ['memory'],
          unexpectedTools: [],
        };
      },
      rank: async (request) => {
        calls.rank += 1;
        return {
          decisionId: request.decisionId,
          candidateSetHash: request.candidateSetHash,
          learnerStateVersion: request.learnerStateVersion,
          rankedQuestionIds: [...request.candidates].reverse().map(({ questionId }) => questionId),
        };
      },
      syncMemory: async () => {
        calls.syncMemory += 1;
      },
    };

    server = await createGatewayServer(makeTestConfig({
      port: 8642,
      dbPath: sqlitePath,
      allowedExtensionOrigin: ORIGIN,
      tokenPepper: PEPPER,
      now: () => NOW,
      hermesClient: hermes,
    }));
    await server.listen({ host: '127.0.0.1', port: 8642 });

    const trustedStorage = new MemoryTrustedStorage();
    await initializeTrustedGatewayStorage(trustedStorage);
    const settings = new GatewaySettingsRepository(trustedStorage);
    const client = new HttpGatewayClient(settings, extensionOriginFetch());

    await client.pair(pairingCode);
    expect(trustedStorage.trusted).toBe(true);
    expect((await settings.load()).token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const firstHealth = await client.health();
    expect(firstHealth).toMatchObject({
      service: 'pte-pilot',
      status: 'ready',
      profile: 'pte-pilot',
      projectionVersion: 0,
      hermes: { status: 'ready', enabledTools: ['memory'], unexpectedTools: [] },
    });
    expect(firstHealth.projectionInstanceId).toMatch(/^[0-9a-f-]{36}$/);

    const rankRequest: RankRequest = {
      decisionId: '11111111-1111-4111-8111-111111111111',
      candidateSetHash: `sha256:${'a'.repeat(64)}`,
      learnerStateVersion: 0,
      candidates: [
        { questionId: 'q-1', dueScore: 1, weaknessScore: 0.8, noveltyScore: 0, marked: false, attemptCount: 2, lastAttemptAt: null },
        { questionId: 'q-2', dueScore: 0.5, weaknessScore: 0.2, noveltyScore: 1, marked: true, attemptCount: 0, lastAttemptAt: null },
      ],
    };
    await expect(client.rank(rankRequest)).resolves.toMatchObject({
      decisionId: rankRequest.decisionId,
      rankedQuestionIds: ['q-2', 'q-1'],
    });
    expect(calls.rank).toBe(1);

    facts = createPtePilotDb(`pte-pilot-online-${randomUUID()}`);
    const repository = new CockpitRepositories(facts);
    await repository.saveSession({
      predictionEdition: 'yc-2026-w29',
      questionId: 'q-1',
      position: 1,
      total: 1,
    }, NOW.toISOString());
    const attempt: AttemptEvent = {
      attemptId: '22222222-2222-4222-8222-222222222222',
      questionId: 'q-1',
      accuracy: 0.8,
      durationMs: 4_200,
      replayCount: 1,
      errors: [{ expected: 'sentence', actual: 'sentense', type: 'spelling' }],
      completedAt: NOW.toISOString(),
    };
    await repository.commitAttempt('yc-2026-w29', attempt);
    expect(await facts.outbox.count()).toBe(1);

    const batchId = '33333333-3333-4333-8333-333333333333';
    const queue = new CockpitOutboxQueue(repository, () => batchId);
    await new OutboxSyncCoordinator(queue, client).runOnce(
      new Date('2026-07-15T12:01:00.000Z'),
    );
    expect(await facts.outbox.count()).toBe(0);
    expect((await facts.meta.get('projection-instance-id'))?.stringValue)
      .toBe(firstHealth.projectionInstanceId);

    const projectionReader = new Database(sqlitePath, { readonly: true });
    const projection = projectionReader.prepare(`
      SELECT
        (SELECT COUNT(*) FROM attempt_events) AS attempts,
        (SELECT COUNT(*) FROM batch_receipts) AS receipts,
        (SELECT response_json FROM batch_receipts WHERE batch_id = ?) AS responseJson
    `).get(batchId) as { attempts: number; receipts: number; responseJson: string };
    projectionReader.close();
    expect({ attempts: projection.attempts, receipts: projection.receipts })
      .toEqual({ attempts: 1, receipts: 1 });
    const acknowledgement = JSON.parse(projection.responseJson) as BatchUpsertResponse;
    expect(acknowledgement).toMatchObject({
      batchId,
      ackedAttemptIds: [attempt.attemptId],
      projectionInstanceId: firstHealth.projectionInstanceId,
      projectionVersion: 1,
    });

    const projectedHealth = await client.health();
    expect(projectedHealth.projectionInstanceId).toBe(firstHealth.projectionInstanceId);
    expect(projectedHealth.projectionVersion).toBe(1);
    expect(calls.audit).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the absent online command and verify red state**

Run: `pnpm test:hermes-online`

Expected: FAIL with `ERR_PNPM_NO_SCRIPT` because the isolated live-chain command is not registered yet.

- [ ] **Step 3: Register and run the isolated online gate**

```powershell
pnpm pkg set "scripts.test:hermes-online=vitest run --config vitest.online.config.ts"
pnpm --filter @pte-pilot/e2e typecheck
pnpm test:hermes-online
```

Expected: strict TypeScript exits `0`; one integration test passes; Gateway binds only `127.0.0.1:8642`; rank traverses the ready memory-only Hermes client once; one local outbox row becomes one SQLite attempt plus one receipt and is deleted only after the matching ACK.

- [ ] **Step 4: Commit**

```powershell
git add vitest.online.config.ts tests/e2e/hermes-online.integration.ts tests/e2e/package.json package.json pnpm-lock.yaml
git commit -m "test: verify online Hermes projection chain"
```

### Task 9: Scale, Manual-Switch, Audio, and Accessibility Gates

**Files:**
- Create: `tests/e2e/scale-accessibility.spec.ts`
- Modify: `apps/extension/src/app/cockpit.css`

**Interfaces:**
- Consumes: only locked `FireflyFixtureScenario` fields `questionIds`, `answerByQuestionId`, `mediaByQuestionId`, and `loopNavigation`; public cockpit/site test IDs; Chrome CDP page-scale emulation; Playwright forced-colors and reduced-motion media emulation.
- Produces: deterministic gates for 100 extension navigations, 20 original-site keyboard switches with overlay close/reopen, 30 per-question audio requests without bulk prefetch, 200% scale, forced colors, and reduced motion.

- [ ] **Step 1: Write the complete scale and accessibility suite**

```ts
// tests/e2e/scale-accessibility.spec.ts
import type { Page, Request } from '@playwright/test';
import {
  installFireflyFixture,
  type FireflyFixtureScenario,
} from '../fixtures/firefly/firefly-week.fixture';
import { expect, test } from './fixtures/extension.fixture';

function buildQuestionFixture(total: number): Pick<
  FireflyFixtureScenario,
  'questionIds' | 'answerByQuestionId' | 'mediaByQuestionId'
> {
  const questionIds = Array.from({ length: total }, (_, index) => String(131001 + index));
  return {
    questionIds,
    answerByQuestionId: Object.fromEntries(
      questionIds.map((questionId, index) => [questionId, `fixture answer ${index + 1}`]),
    ),
    mediaByQuestionId: Object.fromEntries(
      questionIds.map((questionId, index) => [
        questionId,
        [`https://upload.fireflyau.com/q${index + 1}.wav`],
      ]),
    ),
  };
}

async function expectQuestion(page: Page, position: number, total: number): Promise<void> {
  const questionId = String(131000 + position);
  await expect(page.getByTestId('question-position')).toHaveText(`${position}/${total}`);
  await expect(page.getByTestId('pte-pilot-root')).toHaveAttribute('data-question-id', questionId);
  await expect(page.getByTestId('question-id')).toHaveText(`#${questionId}`);
  await expect(page.getByTestId('answer-input')).toBeFocused();
}

test('@acceptance keeps exact sync for 100 extension navigations and 20 original-site switches', async ({ context, page }) => {
  test.setTimeout(120_000);
  const total = 121;
  await installFireflyFixture(context, {
    ...buildQuestionFixture(total),
    loopNavigation: true,
  });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await expectQuestion(page, 1, total);

  for (let position = 2; position <= 101; position += 1) {
    await page.keyboard.press('Alt+J');
    await expectQuestion(page, position, total);
  }

  for (let position = 102; position <= 121; position += 1) {
    await page.keyboard.press('Alt+Shift+P');
    await expect(page.getByTestId('pte-pilot-root')).toHaveCount(0);
    const siteNext = page.getByTestId('site-next');
    await siteNext.focus();
    await expect(siteNext).toBeFocused();
    await siteNext.press('Enter');
    await expect(page.getByTestId('position')).toHaveText(`${position}/${total}`);
    await page.keyboard.press('Alt+Shift+P');
    await expectQuestion(page, position, total);
  }

  await expect(page.getByTestId('site-navigation-count')).toHaveText('120');
  await expect(page.getByTestId('site-navigation-mismatch-count')).toHaveText('0');
});

test('@acceptance resolves and plays exactly 30 current-question audio resources', async ({ context, page }) => {
  test.setTimeout(120_000);
  const total = 30;
  const seen = new Set<string>();
  const capture = (request: Request): void => {
    if (request.url().startsWith('https://upload.fireflyau.com/')) seen.add(request.url());
  };
  context.on('request', capture);
  await installFireflyFixture(context, buildQuestionFixture(total));
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  expect(seen.size).toBe(0);

  for (let position = 1; position <= total; position += 1) {
    const expectedUrl = `https://upload.fireflyau.com/q${position}.wav`;
    await page.keyboard.press('Alt+P');
    await expect.poll(() => seen.has(expectedUrl)).toBe(true);
    expect([...seen].every((url) => {
      const match = /\/q(\d+)\.wav$/u.exec(url);
      return match !== null && Number(match[1]) <= position;
    })).toBe(true);
    await page.keyboard.press('Alt+P');
    if (position < total) {
      await page.keyboard.press('Alt+J');
      await expectQuestion(page, position + 1, total);
    }
  }

  context.off('request', capture);
  expect(seen.size).toBe(30);
});

test('@acceptance remains keyboard-usable at 200 percent page scale', async ({ context, page }) => {
  await installFireflyFixture(context, buildQuestionFixture(3));
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(2);

  const root = page.getByTestId('pte-pilot-root');
  await expect(root).toBeVisible();
  expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const input = page.getByTestId('answer-input');
  await input.fill('zoom remains usable');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('command-layer')).toBeFocused();
  await page.keyboard.press('I');
  await expect(input).toBeFocused();
});

test('@acceptance honors forced colors and reduced motion', async ({ context, page }) => {
  await installFireflyFixture(context, buildQuestionFixture(3));
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('https://www.fireflyau.com/ptehome/exercise?pageSource=yc');
  await expect.poll(() => page.evaluate(() => ({
    forced: matchMedia('(forced-colors: active)').matches,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }))).toEqual({ forced: true, reduced: true });

  const input = page.getByTestId('answer-input');
  await input.focus();
  const focusStyle = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(focusStyle.outlineWidth).not.toBe('0px');

  const movingElements = await page.getByTestId('pte-pilot-root').evaluate((root) => {
    const milliseconds = (value: string): number => Math.max(...value.split(',').map((part) => {
      const trimmed = part.trim();
      return trimmed.endsWith('ms') ? Number.parseFloat(trimmed) : Number.parseFloat(trimmed) * 1_000;
    }));
    return [...root.querySelectorAll<HTMLElement>('*')].filter((element) => {
      const style = getComputedStyle(element);
      return milliseconds(style.animationDuration) > 0.01 || milliseconds(style.transitionDuration) > 0.01;
    }).length;
  });
  expect(movingElements).toBe(0);
});
```

- [ ] **Step 2: Run the new acceptance suite and verify the styling gap**

Run: `pnpm --filter @pte-pilot/e2e typecheck && pnpm test:e2e -- tests/e2e/scale-accessibility.spec.ts`

Expected: navigation/audio assertions PASS against the unified fixture; at least one zoom, forced-colors, or reduced-motion assertion FAILS until the cockpit resilience styles are present.

- [ ] **Step 3: Add exact zoom, forced-colors, and reduced-motion resilience styles**

Append this complete block to `apps/extension/src/app/cockpit.css`:

```css
[data-testid="pte-pilot-root"],
[data-testid="pte-pilot-root"] * {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

[data-testid="answer-input"] {
  width: 100%;
  resize: vertical;
}

@media (max-width: 640px), (max-height: 480px) {
  [data-testid="pte-pilot-root"] {
    gap: 12px;
    padding: 16px;
    overflow: auto;
  }
}

@media (forced-colors: active) {
  [data-testid="pte-pilot-root"] {
    color: CanvasText;
    background: Canvas;
    border: 1px solid CanvasText;
  }

  [data-testid="pte-pilot-root"] textarea,
  [data-testid="pte-pilot-root"] button,
  [data-testid="pte-pilot-root"] [tabindex] {
    color: CanvasText;
    background: Canvas;
    border: 1px solid ButtonText;
    forced-color-adjust: auto;
  }

  [data-testid="pte-pilot-root"] :focus {
    outline: 3px solid Highlight;
    outline-offset: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-testid="pte-pilot-root"],
  [data-testid="pte-pilot-root"] *,
  [data-testid="pte-pilot-root"] *::before,
  [data-testid="pte-pilot-root"] *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run the complete acceptance file and workspace checks**

Run:

```powershell
pnpm --filter @pte-pilot/e2e typecheck
pnpm test:e2e -- tests/e2e/scale-accessibility.spec.ts
pnpm lint
```

Expected: four tests PASS; navigation count is exactly `120`; 20 site-side keyboard switches reconcile once each; exactly 30 unique current-question audio URLs are observed; 200% scale has no horizontal overflow; forced focus remains visible; reduced-motion leaves zero elements over `0.01ms`.

- [ ] **Step 5: Commit**

```powershell
git add tests/e2e/scale-accessibility.spec.ts apps/extension/src/app/cockpit.css
git commit -m "test: gate scale audio and accessibility"
```

### Task 10: Authenticated Firefly Canary and Release Evidence

**Files:**
- Create: `docs/runbooks/firefly-authenticated-canary.md`
- Create: `docs/verification/pte-pilot-v1-acceptance.md`

**Interfaces:**
- Consumes: production extension build, user-authenticated Firefly account, local PTE Pilot Gateway, and all automated verification commands.
- Produces: a bounded real-site compatibility decision and a permanent evidence record; it never exports answers or media.

- [ ] **Step 1: Create the exact authenticated canary runbook**

```markdown
# Firefly Authenticated Canary

1. Run `pnpm verify`, `pnpm test:e2e`, `pnpm test:hermes-online`, and `pnpm test:perf`; stop unless every command exits `0`.
2. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\audit-runtime.ps1`; stop unless it proves Gateway `127.0.0.1:8642`, Hermes `127.0.0.1:8643`, profile `pte-pilot`, and exactly the `memory` tool.
3. Run `pnpm --filter @pte-pilot/extension build` and load `apps/extension/.output/chrome-mv3` as an unpacked extension.
4. Generate one five-minute pairing code with `node.exe --env-file="$env:LOCALAPPDATA\PTEPilot\gateway.env" .\apps\gateway\dist\cli\create-pairing-code.js`, enter it once in extension settings, and confirm it cannot be reused. Never record the code or bearer token.
5. Open `https://www.fireflyau.com/ptehome/exercise?pageSource=yc` and complete login manually if `AUTH_REQUIRED` appears.
6. Confirm `hermes-status` is `online`; record only Gateway `projectionInstanceId` and starting `projectionVersion` from `/pte/v1/health`.
7. Confirm the overlay reports the same `questionId`, position, and total as the visible site.
8. Index at most 10 questions in canary mode. Stop immediately on `401`, `403`, `429`, CAPTCHA, repeated ID, changing total, or `SITE_CHANGED`.
9. On three non-consecutive questions, press `Alt+P`; confirm each audio clip matches the site player. Do not save or export media.
10. Submit two intentionally imperfect answers. Confirm the site scores first, the extension reveals differences second, and no answer appears before submit.
11. Wait until `/pte/v1/health` reports the same `projectionInstanceId` and a `projectionVersion` at least two greater than Step 6. This proves both outbox events reached the current SQLite projection; Hermes output is never used as acknowledgement.
12. Use extension next, previous, and question selection once each; confirm the original page follows exactly. Trigger one site-side navigation and confirm the extension reconciles without a second click.
13. Close and reopen the overlay once, then close it again. Confirm focus returns to the original site control and the Firefly page remains usable.

Pass requires one-time pairing, ready memory-only Hermes identity, one stable projection instance, two acknowledged projection increments, zero question/audio mismatch, zero premature answer exposure, zero unexpected request burst, zero focus loss, and zero selector ambiguity. Any failure leaves the extension in a fail-closed state and blocks release.
```

- [ ] **Step 2: Run all automated release gates fresh**

Run in order:

```powershell
pnpm verify
pnpm test:e2e
pnpm test:hermes-online
pnpm test:perf
$env:PTE_SOAK_MINUTES='60'; pnpm test:soak
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\apps\gateway\scripts\audit-runtime.ps1
```

Expected: every command exits `0`; strict E2E TypeScript passes; Playwright reports contain no retained failure traces; online loopback test proves pairing/rank/SQLite ACK; runtime audit proves the real Hermes identity and memory-only policy.

- [ ] **Step 3: Execute the authenticated canary**

Follow `docs/runbooks/firefly-authenticated-canary.md` exactly. Record the Chrome version, extension commit, weekly prediction edition, site-reported `N`, ten inspected question IDs, projection instance/version numbers, and pass/fail for each runbook item. Do not record pairing codes, tokens, sentences, answers, audio URLs, cookies, request headers, or response bodies.

- [ ] **Step 4: Write the acceptance evidence**

Create `docs/verification/pte-pilot-v1-acceptance.md` with this exact structure and replace each result with the evidence from Step 2 and Step 3:

```markdown
# PTE Pilot V1 Acceptance Evidence

- Commit: output of `git rev-parse HEAD`
- Chrome: output of `chrome://version`
- Automated verification: exit code and test count from `pnpm verify`
- Strict E2E typecheck: exit code from `pnpm --filter @pte-pilot/e2e typecheck`
- Fixture E2E: exit code and test count from `pnpm test:e2e`
- Scale navigation: 100 extension navigations, 20 original-site switches, final navigation/mismatch counters
- Audio coverage: 30 unique current-question audio requests and zero bulk-prefetch violations
- Accessibility media: 200% scale, forced-colors focus, and reduced-motion results
- Keyboard handler p95: measured milliseconds
- Cached audio p95: measured milliseconds
- 60-minute soak: operation count, focus losses, duplicate submits, navigation mismatches
- Deterministic Hermes online chain: pairing, health, rank, outbox count, SQLite attempt/receipt count, ACK deletion
- Real Hermes audit: loopback addresses, profile identity, enabled tools, unexpected tools
- Gateway projection: stable projectionInstanceId, starting version, ending version
- Authenticated canary: prediction edition, site total, inspected question IDs, all runbook results
- Permission audit: exact permissions and host permissions
- Hermes-offline result: core practice pass or fail
- Release decision: PASS only when every approved acceptance threshold is met
```

- [ ] **Step 5: Commit the runbook and actual evidence**

```powershell
git add docs/runbooks/firefly-authenticated-canary.md docs/verification/pte-pilot-v1-acceptance.md
git commit -m "docs: record PTE Pilot acceptance evidence"
```
