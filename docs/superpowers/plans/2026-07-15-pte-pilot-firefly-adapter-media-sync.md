# PTE Pilot Firefly Adapter and Media Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Execute every task test-first and stop at each named verification gate.

**Goal:** Build a fail-closed Firefly WFD adapter that reads the current weekly-prediction question, uses the site's authenticated audio, keeps extension and website navigation synchronized, supports resumable indexing, and exposes only narrow controller ports. Correct-answer plaintext is available only inside `AnswerGate`, and only after an atomic, proven score/reveal transaction.

**Architecture:** `FireflySitePort` is a raw composition-only adapter. `PracticeController` receives only `SubmissionGatePort`, `NavigationPort`, `IndexPort`, `AudioPort`, and `StoragePort`; it never receives the raw site or an answer reader. `AnswerGate` owns raw answer write/score/reveal and is the only correct-answer consumer. `NavigationCoordinator` owns raw next/previous/select/redo and returns monotonic results while reporting site-observed changes through handlers. `QuestionIndexer` traverses only through the coordinator's private indexing facet and persists checkpoints through the existing `StoragePort`. Media capture is armed locally before native Play, bound in the Service Worker at `onBeforeRequest`, and accepted only when capture token, navigation epoch, question ID, and time fence all match.

**Tech stack:** WXT 0.20.27, Chrome MV3, React 19.2.7, TypeScript 6.0.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.61.1.

## Non-negotiable constraints

- Consume shared schemas from `@pte-pilot/contracts`; do not duplicate branded token, question, index, fault, or practice-state schemas in `apps/extension`.
- Never hard-code `192`, `yc-current`, or another guessed edition. The current site's one-based `position`, `total`, and verified edition evidence are authoritative.
- Never expose a correct answer before scoring/reveal proof. Before proof, correct-answer text must not enter UI state, controller state, IndexedDB, logs, MAIN/isolated bridge messages, or background messages.
- `AnswerGate` is the only extension module that may call the raw revealed-answer reader or receive its plaintext result. It must erase its local plaintext reference before its transaction resolves.
- Never enumerate or persist media bytes. Resolve only the active question's current request; never persist `Blob`, `ArrayBuffer`, audio response body, or a bulk media catalog.
- Default playback mode is `site-player-only`. `transfer-to-extension` is permitted only when Phase 0 explicitly proves a pause/reset transfer contract. Native and extension audio must never play simultaneously.
- Stop probing/indexing on login redirect, `401`, `403`, `429`, CAPTCHA, ambiguous semantic targets, changing totals, repeated IDs, unresolvable edition, or schema drift. Do not retry automatically.
- A site-observed navigation reconciles the latest live snapshot and never clicks another control.
- Do not request `cookies`, `debugger`, `downloads`, `tabs`, or `<all_urls>`. `webRequest`, `storage`, the exact Firefly exercise origin, and the exact upload origin are sufficient.
- Preserve `browser.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })` in the composed background entrypoint.
- Every async completion validates the operation identity it owns before mutating state.
- Mount Cockpit UI before `runtime.start()`. A recoverable startup failure must render in the already-mounted UI.

## Blocking Cockpit contract handoff

This plan consumes the latest Cockpit contracts below. The Cockpit-plan owner implements them; Firefly-plan workers must not invent a parallel port module or reintroduce `FireflySitePort` into `PracticeControllerDeps`.

```ts
// apps/extension/src/ports/submission-gate-port.ts
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

```ts
// apps/extension/src/ports/index-port.ts
export interface IndexPort {
  startOrResume(signal?: AbortSignal): Promise<{
    status: "complete" | "partial";
    predictionEdition: string;
    indexed: number;
    total: number;
    fault?: RuntimeFault;
  }>;
  findQuestion(questionId: string): Promise<QuestionRef | null>;
  pause(): void;
  dispose(): void;
}
```

The existing `StoragePort` is the index persistence boundary. It must retain these exact methods; do not add a second `IndexStoragePort`:

```ts
loadIndexSnapshot(
  predictionEdition: string,
): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }>;
saveIndexSnapshot(
  snapshot: IndexSnapshot,
  questions: readonly IndexedQuestion[],
): Promise<void>;
```

`PracticeControllerDeps` stays exactly:

```ts
export interface PracticeControllerDeps {
  submissions: SubmissionGatePort;
  navigation: NavigationPort;
  index: IndexPort;
  audio: AudioPort;
  storage: StoragePort;
  clock: () => number;
}
```

Required Cockpit behavior:

1. `submit()` calls `submissions.begin({ question, navigationEpoch, userAnswer })`, dispatches the returned token/epoch, then calls `transaction.run()`. The result contains sanitized accuracy/error facts only.
2. `navigate()` and `redo()` consume a `NavigationResult`, then call `submissions.invalidateBefore(result.navigationEpoch)` and `audio.invalidateBefore(result.navigationEpoch)`. The controller never calls raw site controls.
3. `start()` passes `beforeLeave`, `onObserved`, and `onFault` handlers to `NavigationPort.start()`. A site-observed move awaits `beforeLeave`, then accepts only the coordinator's latest re-read result.
4. `resumeOrKeepPartialIndex()` calls `IndexPort.startOrResume()`, and ranked navigation resolves IDs through `IndexPort.findQuestion()`.
5. `AudioPort.invalidateBefore(nextEpoch)` and `SubmissionGatePort.invalidateBefore(nextEpoch)` never allow an older invalidation to clear newer work.
6. Audio failures retain code `AUDIO_ERROR`; submission/navigation failures retain an already-typed `RuntimeFault` rather than always wrapping it as `DESYNC`.
7. `PracticeController.reportFault(fault)` remains available for unexpected post-mount startup failures.
8. `PracticeController.dispose()` releases only controller timers/subscriptions. Bootstrap owns and disposes submissions, navigation, index, and audio exactly once.

## File map

- `apps/extension/src/ports/firefly-site-port.ts`: raw composition-only Firefly contract. Only `AnswerGate` receives its answer-reading member.
- `apps/extension/src/firefly/semantic/semantic-locators.ts`: pure semantic ranking and ambiguity rejection.
- `tests/fixtures/firefly/firefly-week.fixture.ts`: the one shared `installFireflyFixture()` used by every Playwright plan.
- `apps/extension/src/firefly/probe/*`: authenticated, redacted Phase 0 contract and dynamic-edition evidence.
- `apps/extension/src/firefly/bridge/*` and `entrypoints/firefly-main-world.content.ts`: allowlisted metadata bridge with reversible MAIN patches.
- `apps/extension/src/firefly/dom/firefly-dom-adapter.ts`: DOM facet implementation and atomic `scoreAndWait()`.
- `apps/extension/src/firefly/navigation/navigation-coordinator.ts`: all raw previous/next/select/redo actions and latest-snapshot reconciliation.
- `apps/extension/src/firefly/indexing/*`: dynamic edition resolver and resumable `IndexPort` backed by the existing `StoragePort`.
- `apps/extension/src/firefly/audio/*` and `src/background/media/*`: token-bound media capture and single-player broker.
- `apps/extension/src/firefly/answer/answer-gate.ts`: the only caller/consumer of the raw revealed-answer reader.
- `apps/extension/src/firefly/bootstrap-firefly-sync.ts`: safe runtime composition.
- `tests/e2e/firefly-adapter-media-sync.spec.ts`: extension-level regression using the shared fixture installer.

---

### Task 1: Define the raw composition contract and one shared Firefly fixture installer

**Files:**

- Modify: `apps/extension/src/ports/firefly-site-port.ts`
- Create: `apps/extension/src/firefly/semantic/semantic-locators.ts`
- Replace/Create: `tests/fixtures/firefly/firefly-week.fixture.ts`
- Test: `apps/extension/tests/unit/firefly/semantic-locators.test.ts`
- Test: `tests/fixtures/firefly/firefly-week.fixture.test.ts`

- [ ] **Step 1: Write failing port-shape and semantic ambiguity tests**

Type-test the raw composition contract, including atomic `scoreAndWait()` and `readCurrentMediaSource()`. Separately assert that `PracticeController` does not import this module. Test exact accessible-name success and equal-proof ambiguity failure.

```ts
const raw = {} as FireflySitePort;
raw.scoreAndWait satisfies (context: SubmissionContext) => Promise<void>;
raw.readCurrentMediaSource satisfies () => string | null;
expect(() => resolveUniqueCandidate("next", [exactA, exactB]))
  .toThrow(AmbiguousSemanticTargetError);
```

- [ ] **Step 2: Define the raw composition-only port**

```ts
// apps/extension/src/ports/firefly-site-port.ts
import type { AttemptEpoch, IndexedQuestion, NavigationEpoch, QuestionRef, SubmissionToken } from "@pte-pilot/contracts";

export type NavigationIntent =
  | { kind: "previous" }
  | { kind: "next" }
  | { kind: "select"; position: number };

export interface SiteOperationContext {
  question: QuestionRef;
  navigationEpoch: NavigationEpoch;
  signal: AbortSignal;
}

export interface SubmissionContext extends SiteOperationContext {
  attemptEpoch: AttemptEpoch;
  submissionToken: SubmissionToken;
}

export interface FireflySiteSnapshot {
  question: QuestionRef | null;
  inputValue: string;
  answerSurface: { visible: boolean; signature: string };
  scoring: { complete: boolean; signature: string };
  capabilities: {
    previous: boolean; next: boolean; selectQuestion: boolean;
    score: boolean; revealAnswer: boolean; redo: boolean;
    play: boolean; structuredList: boolean;
  };
  stopReason: "auth-required" | "forbidden" | "rate-limited" | "captcha" | "site-changed" | null;
}

export type NativePlaybackState = "empty" | "playing" | "paused" | "ended";

export interface FireflySitePort {
  readSnapshot(): FireflySiteSnapshot;
  observe(listener: (snapshot: FireflySiteSnapshot) => void): () => void;
  navigate(intent: NavigationIntent, context: SiteOperationContext): Promise<void>;
  redo(context: SiteOperationContext): Promise<void>;
  writeAnswer(value: string, context: SubmissionContext): Promise<string>;
  scoreAndWait(context: SubmissionContext): Promise<void>;
  revealAnswer(context: SubmissionContext): Promise<void>;
  readRevealedAnswer(context: SubmissionContext): string | null;
  playNative(context: SiteOperationContext): Promise<void>;
  restartNative(context: SiteOperationContext): Promise<void>;
  pauseAndResetNative(context: SiteOperationContext): Promise<void>;
  readCurrentMediaSource(): string | null;
  observeNativePlayback(listener: (state: NativePlaybackState) => void): () => void;
  readStructuredList(signal: AbortSignal): Promise<readonly IndexedQuestion[] | null>;
  readPredictionEditionEvidence(): string | null;
}

export type RawNavigationSitePort = Pick<FireflySitePort, "readSnapshot" | "observe" | "navigate" | "redo">;
export type RawSubmissionSitePort = Pick<FireflySitePort, "readSnapshot" | "observe" | "writeAnswer" | "scoreAndWait" | "revealAnswer" | "readRevealedAnswer">;
export type RawIndexSitePort = Pick<FireflySitePort, "readSnapshot" | "readStructuredList" | "readPredictionEditionEvidence">;
export type RawMediaSitePort = Pick<FireflySitePort, "readSnapshot" | "playNative" | "restartNative" | "pauseAndResetNative" | "readCurrentMediaSource" | "observeNativePlayback">;
```

`FireflySitePort` is never a controller dependency. Composition passes only the appropriate `Pick` view to each gate/coordinator. `readRevealedAnswer()` is present because the DOM adapter must read the verified site result, but only `answer-gate.ts` may call it; the architecture test in Task 8 enforces that rule.

- [ ] **Step 3: Implement one complete fixture contract**

`installFireflyFixture()` owns all Firefly and upload routes. No E2E spec may duplicate `context.route()` or construct a different scenario shape.

```ts
// tests/fixtures/firefly/firefly-week.fixture.ts
import type { BrowserContext } from "@playwright/test";

export interface FireflyFixtureScenario {
  authenticated: boolean;
  predictionEdition: string;
  pageSource: string;
  questionIds: readonly string[];
  currentPosition: number;
  answerByQuestionId: Readonly<Record<string, string>>;
  mediaByQuestionId: Readonly<Record<string, readonly string[]>>;
  scoreRequiresReveal: boolean;
  duplicateNextControl: boolean;
  captcha: boolean;
  changedSelectors: boolean;
  staleReveal: boolean;
  loopNavigation: boolean;
  listApiEnabled: boolean;
  listApiIncludesAnswers: boolean;
  delayedMediaMs: Readonly<Record<string, number>>;
}

export const defaultFireflyScenario = (): FireflyFixtureScenario => ({
  authenticated: true,
  predictionEdition: "2026-W29",
  pageSource: "yc",
  questionIds: ["131001", "131002", "131003", "131004"],
  currentPosition: 1,
  answerByQuestionId: {
    "131001": "the first correct answer",
    "131002": "the second correct answer",
    "131003": "the third correct answer",
    "131004": "the fourth correct answer",
  },
  mediaByQuestionId: {
    "131001": ["https://upload.fireflyau.com/q1.wav"],
    "131002": ["https://upload.fireflyau.com/q2.wav"],
    "131003": ["https://upload.fireflyau.com/q3.wav"],
    "131004": ["https://upload.fireflyau.com/q4.wav"],
  },
  scoreRequiresReveal: false,
  duplicateNextControl: false,
  captcha: false,
  changedSelectors: false,
  staleReveal: false,
  loopNavigation: false,
  listApiEnabled: true,
  listApiIncludesAnswers: false,
  delayedMediaMs: {},
});

const wav = Buffer.from(
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
  "base64",
);

const html = (state: FireflyFixtureScenario): string => {
  const safe = JSON.stringify(state).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="zh-CN"><body>
    <main id="app" data-prediction-edition="${state.predictionEdition}"></main>
    <output data-testid="site-navigation-count">0</output>
    <output data-testid="site-score-count">0</output>
    <output data-testid="site-double-submit-count">0</output>
    <output data-testid="site-navigation-mismatch-count">0</output>
    <script>
      const state = ${safe};
      const app = document.querySelector("#app");
      const counts = { navigation: 0, score: 0, doubleSubmit: 0, mismatch: 0 };
      let scoring = false;
      let player = null;
      const out = (name, value) => {
        document.querySelector('[data-testid="' + name + '"]').textContent = String(value);
      };
      const currentId = () => state.questionIds[state.currentPosition - 1];
      const move = (position) => {
        const total = state.questionIds.length;
        const bounded = state.loopNavigation
          ? ((position - 1 + total) % total) + 1
          : Math.max(1, Math.min(total, position));
        state.currentPosition = bounded;
        counts.navigation += 1;
        out("site-navigation-count", counts.navigation);
        render();
      };
      const play = () => {
        const source = state.mediaByQuestionId[currentId()][0];
        if (!player) player = new Audio();
        player.src = source;
        player.load();
        void player.play().catch(() => undefined);
      };
      const render = () => {
        if (!state.authenticated) {
          app.innerHTML = '<form aria-label="登录">登录</form>';
          return;
        }
        if (state.captcha) {
          app.innerHTML = '<div role="alert">CAPTCHA</div>';
          return;
        }
        const id = currentId();
        const nextLabel = state.changedSelectors ? "后一个" : "下一题";
        app.innerHTML = '<section aria-label="WFD exercise" data-question-id="' + id + '">' +
          '<div data-testid="question-id">#' + id + '</div>' +
          '<div data-testid="position">' + state.currentPosition + '/' + state.questionIds.length + '</div>' +
          '<button data-testid="site-previous" aria-label="上一题">上一题</button>' +
          '<button data-testid="site-next" aria-label="' + nextLabel + '">' + nextLabel + '</button>' +
          (state.duplicateNextControl ? '<button aria-label="下一题">下一题</button>' : '') +
          '<select aria-label="选择题号">' + state.questionIds.map((qid, index) =>
            '<option value="' + (index + 1) + '"' + (index + 1 === state.currentPosition ? ' selected' : '') + '>' + qid + '</option>'
          ).join('') + '</select>' +
          '<button data-testid="site-play" aria-label="播放">Play</button>' +
          '<textarea aria-label="请输入内容"></textarea>' +
          '<button data-testid="site-score" aria-label="评分">评分</button>' +
          '<button data-testid="site-answer" aria-label="答案">答案</button>' +
          '<button data-testid="site-redo" aria-label="重做">重做</button>' +
          '<div data-testid="score-proof" data-complete="false"></div>' +
          (state.staleReveal ? '<div data-testid="revealed-answer" data-question-id="stale">stale answer</div>' : '') +
          '</section>';
        app.querySelector('[data-testid="site-previous"]').onclick = () => move(state.currentPosition - 1);
        app.querySelector('[data-testid="site-next"]').onclick = () => move(state.currentPosition + 1);
        app.querySelector('select').onchange = (event) => move(Number(event.currentTarget.value));
        app.querySelector('[data-testid="site-play"]').onclick = play;
        app.querySelector('[data-testid="site-score"]').onclick = () => {
          if (scoring) {
            counts.doubleSubmit += 1;
            out("site-double-submit-count", counts.doubleSubmit);
            return;
          }
          scoring = true;
          counts.score += 1;
          out("site-score-count", counts.score);
          app.querySelector('[data-testid="score-proof"]').dataset.complete = "true";
          if (!state.scoreRequiresReveal) {
            app.querySelector('section').insertAdjacentHTML("beforeend",
              '<div data-testid="revealed-answer" data-question-id="' + id + '">' + state.answerByQuestionId[id] + '</div>');
          }
          scoring = false;
        };
        app.querySelector('[data-testid="site-answer"]').onclick = () => {
          if (!app.querySelector('[data-testid="revealed-answer"][data-question-id="' + id + '"]')) {
            app.querySelector('section').insertAdjacentHTML("beforeend",
              '<div data-testid="revealed-answer" data-question-id="' + id + '">' + state.answerByQuestionId[id] + '</div>');
          }
        };
        app.querySelector('[data-testid="site-redo"]').onclick = () => {
          app.querySelector('textarea').value = "";
          app.querySelectorAll('[data-testid="revealed-answer"]').forEach((node) => node.remove());
          app.querySelector('[data-testid="score-proof"]').dataset.complete = "false";
        };
      };
      render();
    </script></body></html>`;
};

export async function installFireflyFixture(
  context: BrowserContext,
  overrides: Partial<FireflyFixtureScenario> = {},
): Promise<FireflyFixtureScenario> {
  const state = { ...defaultFireflyScenario(), ...overrides };
  await context.route("https://www.fireflyau.com/ptehome/exercise**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html(state) }));
  await context.route("https://www.fireflyau.com/api/prediction**", (route) => {
    if (!state.listApiEnabled) return route.fulfill({ status: 404, body: "" });
    const questions = state.questionIds.map((questionId, index) => ({
      questionId,
      position: index + 1,
      total: state.questionIds.length,
      predictionEdition: state.predictionEdition,
      mediaLocator: state.mediaByQuestionId[questionId]?.[0],
      ...(state.listApiIncludesAnswers ? { answer: state.answerByQuestionId[questionId] } : {}),
    }));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ questions }) });
  });
  await context.route("https://upload.fireflyau.com/**", async (route) => {
    const delay = state.delayedMediaMs[new URL(route.request().url()).pathname] ?? 0;
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({
      status: 206,
      headers: {
        "content-type": "audio/wav",
        "content-range": `bytes 0-${wav.length - 1}/${wav.length}`,
        "accept-ranges": "bytes",
        "access-control-allow-origin": "*",
      },
      body: wav,
    });
  });
  return state;
}
```

- [ ] **Step 4: Verify focused tests and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/semantic-locators.test.ts tests/fixtures/firefly/firefly-week.fixture.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
git add apps/extension/src/ports/firefly-site-port.ts apps/extension/src/firefly/semantic tests/fixtures/firefly/firefly-week.fixture.ts tests/fixtures/firefly/firefly-week.fixture.test.ts
git commit -m "feat(extension): define narrow Firefly facets and shared fixture"
```

### Task 2: Probe authenticated capabilities and resolve a dynamic edition

**Files:**

- Create: `apps/extension/src/firefly/probe/firefly-site-contract.ts`
- Create: `apps/extension/src/firefly/probe/authenticated-contract-probe.ts`
- Create: `apps/extension/src/firefly/indexing/prediction-edition-resolver.ts`
- Test: `apps/extension/tests/unit/firefly/authenticated-contract-probe.test.ts`
- Test: `apps/extension/tests/unit/firefly/prediction-edition-resolver.test.ts`

- [ ] **Step 1: Write failing tests for authentication stops and edition evidence**

Required cases: authenticated current question; login form; CAPTCHA; ambiguous controls; verified DOM edition `2026-W29`; verified structured-response edition; missing or conflicting edition. Missing/conflicting evidence returns `SITE_CHANGED`; it never returns `yc-current`.

- [ ] **Step 2: Implement a redacted verified contract**

The probe may retain selector/path evidence and booleans, but never raw response bodies or answer text. The contract includes:

```ts
export interface VerifiedFireflyContract {
  exercisePathname: "/ptehome/exercise";
  structuredListPathnames: readonly string[];
  answerTextSelector: string;
  editionEvidence: { kind: "dom" | "structured"; value: string };
  playbackMode: "site-player-only" | "transfer-to-extension";
  transferContract?: { canPauseAndResetNative: true };
}
```

`playbackMode` defaults to `site-player-only`. The probe may emit `transfer-to-extension` only after a fixture/live canary proves `pauseAndResetNative()` leaves the native element paused at time `0` before the extension element starts.

- [ ] **Step 3: Implement dynamic edition resolution**

```ts
export function resolvePredictionEdition(args: {
  url: URL;
  verifiedEvidence: string | null;
}): string {
  const pageSource = args.url.searchParams.get("pageSource")?.trim();
  const edition = args.verifiedEvidence?.trim();
  if (!pageSource || !/^[a-z0-9_-]+$/iu.test(pageSource)) {
    throw siteChangedFault("Firefly pageSource is unavailable or ambiguous");
  }
  if (!edition || !/^[a-z0-9._-]+$/iu.test(edition)) {
    throw siteChangedFault("Firefly prediction edition is unavailable or ambiguous");
  }
  return `${pageSource}:${edition}`;
}
```

- [ ] **Step 4: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/authenticated-contract-probe.test.ts apps/extension/tests/unit/firefly/prediction-edition-resolver.test.ts --environment jsdom
git add apps/extension/src/firefly/probe apps/extension/src/firefly/indexing/prediction-edition-resolver.ts apps/extension/tests/unit/firefly
git commit -m "feat(extension): verify Firefly contract and dynamic edition"
```

### Task 3: Build a sanitized MAIN-world bridge with reversible patches

**Files:**

- Create: `apps/extension/src/firefly/bridge/allowlist.ts`
- Create: `apps/extension/src/firefly/bridge/bridge-client.ts`
- Create: `apps/extension/entrypoints/firefly-main-world.content.ts`
- Test: `apps/extension/tests/unit/firefly/main-world-cleanup.test.ts`
- Test: `apps/extension/tests/unit/firefly/allowlist.test.ts`

- [ ] **Step 1: Write failing allowlist and cleanup tests**

Test that `answer`, `answerText`, `transcript`, unknown nested objects, headers, cookies, and raw bodies are dropped. Install the MAIN patch, invalidate its context, and assert `window.fetch`, `XMLHttpRequest.prototype.open`, and `.send` equal their original identities. Reinstall twice and assert one emitted message per response.

- [ ] **Step 2: Implement positive-field sanitization**

Only `{ questionId, position, total, predictionEdition, tags, mediaLocator }` may cross. Parse with Zod in both worlds. Bind every message to a random isolated-world nonce; reject missing/wrong nonce, unverified pathname, invalid origin, and stale document generation.

- [ ] **Step 3: Arm and clean up MAIN patches**

```ts
// apps/extension/entrypoints/firefly-main-world.content.ts
export default defineContentScript({
  matches: ["https://www.fireflyau.com/ptehome/exercise*"],
  world: "MAIN",
  runAt: "document_start",
  main(ctx) {
    const originalFetch = window.fetch;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const requestUrl = new WeakMap<XMLHttpRequest, string>();
    let disposed = false;

    const wrappedFetch: typeof window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!disposed) void observeFetchResponse(response.clone());
      return response;
    };
    const wrappedOpen: typeof XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      requestUrl.set(this, new URL(String(url), location.href).href);
      return originalOpen.call(this, method, url, ...rest);
    };
    const wrappedSend: typeof XMLHttpRequest.prototype.send = function (body) {
      const xhr = this;
      const onLoad = () => {
        xhr.removeEventListener("load", onLoad);
        if (!disposed) observeXhrResponse(xhr, requestUrl.get(xhr));
      };
      xhr.addEventListener("load", onLoad);
      return originalSend.call(xhr, body);
    };

    window.fetch = wrappedFetch;
    XMLHttpRequest.prototype.open = wrappedOpen;
    XMLHttpRequest.prototype.send = wrappedSend;

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      if (window.fetch === wrappedFetch) window.fetch = originalFetch;
      if (XMLHttpRequest.prototype.open === wrappedOpen) XMLHttpRequest.prototype.open = originalOpen;
      if (XMLHttpRequest.prototype.send === wrappedSend) XMLHttpRequest.prototype.send = originalSend;
    };
    ctx.onInvalidated(dispose);
  },
});
```

`observeFetchResponse` and `observeXhrResponse` must check the verified pathname before attempting JSON parsing and must emit only the sanitizer result. Cleanup restores a function only when the installed wrapper still owns that slot, so it never overwrites a later site patch.

- [ ] **Step 4: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/allowlist.test.ts apps/extension/tests/unit/firefly/main-world-cleanup.test.ts --environment jsdom
git add apps/extension/src/firefly/bridge apps/extension/entrypoints/firefly-main-world.content.ts apps/extension/tests/unit/firefly
git commit -m "feat(extension): add reversible Firefly metadata bridge"
```

### Task 4: Implement the DOM adapter with atomic score-and-wait

**Files:**

- Create: `apps/extension/src/firefly/dom/firefly-dom-adapter.ts`
- Test: `apps/extension/tests/unit/firefly/firefly-dom-adapter.test.ts`

- [ ] **Step 1: Write failing synchronous-score tests**

The fixture's score click mutates `data-complete` synchronously. Assert `scoreAndWait()` resolves. Also test delayed mutation, abort, timeout, changed question, duplicate control, and stale revealed-answer node.

- [ ] **Step 2: Implement semantic facets and the atomic primitive**

`score()` plus a later `waitForScoreCompletion()` is forbidden. Use one method whose observer is armed before click and whose immediate post-click read catches synchronous mutation:

```ts
async scoreAndWait(context: SubmissionContext): Promise<void> {
  this.assertCurrent(context.question);
  context.signal.throwIfAborted();
  const before = this.readSnapshot();
  const score = this.target("score");

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      stop();
      context.signal.removeEventListener("abort", onAbort);
      fn();
    };
    const accept = (snapshot: FireflySiteSnapshot) => {
      if (snapshot.question?.questionId !== context.question.questionId) {
        return finish(() => reject(desyncFault("question changed while scoring")));
      }
      const changed = snapshot.scoring.signature !== before.scoring.signature;
      if (snapshot.scoring.complete && (changed || !before.scoring.complete)) {
        finish(resolve);
      }
    };
    const onAbort = () => finish(() => reject(context.signal.reason));
    const stop = this.observe(accept); // armed before click
    context.signal.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => finish(() => reject(desyncFault("score completion timed out"))), 5_000);
    score.click();
    accept(this.readSnapshot()); // catches synchronous click mutation
  });
}
```

All waits use the same settled-guard pattern. `revealAnswer()` proves the action completed but returns no answer text. The raw adapter implements `readRevealedAnswer()` for `AnswerGate`; no controller-facing port contains it and no other module may call it.

- [ ] **Step 3: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/firefly-dom-adapter.test.ts --environment jsdom
pnpm --filter @pte-pilot/extension typecheck
git add apps/extension/src/firefly/dom apps/extension/tests/unit/firefly/firefly-dom-adapter.test.ts
git commit -m "feat(extension): add atomic Firefly DOM adapter"
```

### Task 5: Make navigation monotonic, latest-snapshot based, and timeout safe

**Files:**

- Create: `apps/extension/src/firefly/navigation/navigation-coordinator.ts`
- Test: `apps/extension/tests/unit/firefly/navigation-coordinator.test.ts`

- [ ] **Step 1: Write failing race tests**

Required tests:

- manual navigation occurs while `persistDraft()` is pending: emit the latest re-read question once and make zero extra clicks;
- extension navigation is superseded before its click: do not click the stale target;
- target timeout/wrong target: produce one `DESYNC`, reject once, and leave no active operation;
- a late observer callback from operation A cannot complete operation B;
- redo stays on the same question, waits for hidden answer and empty input, and returns a fresh epoch;
- two rapid site observations coalesce to the latest snapshot.

- [ ] **Step 2: Implement the controller-facing and private indexing facets**

The coordinator implements the exact handler/result `NavigationPort`. `start(handlers)` stores the handlers and starts raw observation. It issues operation ID and epoch synchronously before the first internal `await`. The raw observer increments `observedRevision` before queueing work. After every awaited `handlers.beforeLeave()`, it ignores the captured callback snapshot and re-reads `raw.readSnapshot()`.

```ts
type Active = {
  id: number;
  epoch: NavigationEpoch;
  fromQuestionId: string;
  observedRevision: number;
  abort: AbortController;
};

private async drainObserved(): Promise<void> {
  if (this.draining || this.disposed) return;
  this.draining = true;
  try {
    while (this.acceptedRevision < this.observedRevision) {
      const revision = this.observedRevision;
      await this.handlers.beforeLeave();
      if (revision !== this.observedRevision) continue;
      const live = this.raw.readSnapshot();
      if (!live.question || live.stopReason) {
        this.handlers.onFault(faultForSnapshot(live));
        this.acceptedRevision = revision;
        continue;
      }
      this.acceptedRevision = revision;
      if (this.active || live.question.questionId === this.acceptedQuestionId) continue;
      const navigationEpoch = this.nextEpoch();
      this.acceptedQuestionId = live.question.questionId;
      await this.handlers.onObserved({ question: live.question, navigationEpoch, source: "site" });
    }
  } finally {
    this.draining = false;
    if (this.acceptedRevision < this.observedRevision) void this.drainObserved();
  }
}
```

Extension navigation algorithm:

1. Reject when another active operation exists.
2. Capture live `from`, increment operation ID/epoch, create `AbortController`, and store `active` **before** awaiting target-ID resolution or any other dependency.
3. After any await, compare active ID, observer revision, and a fresh live snapshot. If the site already moved, reconcile that fresh snapshot and do not click.
4. Arm `waitForExpected(active, expectation)` before calling `raw.navigate()`.
5. Await target; accept only matching active ID/epoch and exact target proof, then return one `NavigationResult` with source `extension`.
6. On a caller-initiated timeout/wrong-target/abort, reject once with the typed `DESYNC`; the controller preserves it. Observer-pipeline faults use `handlers.onFault()` once and do not create a second click.
7. In `finally`, clear `active` only when `this.active?.id === active.id`.

`waitForExpected()` must own a `settled` flag, timeout ID, observer disposer, and abort listener. Every resolve/reject path calls one cleanup function. It must never leave an active timeout or observer after settlement.

The coordinator also returns a private `IndexTraversalPort`:

```ts
export interface IndexTraversalPort {
  goToPosition(position: number, signal: AbortSignal): Promise<QuestionRef>;
  restorePosition(position: number, signal: AbortSignal): Promise<QuestionRef>;
}
```

Both methods reuse the same transaction engine while suppressing ordinary site-observed callbacks for their own exact mutations. After each await they validate the active operation again. `probe()` accepts the initial live question into the same monotonic epoch counter without clicking. `redo()` arms its waiter before `raw.redo()`, requires the same question ID plus hidden answer and empty input, and returns source `redo`. No module except `NavigationCoordinator` may call `raw.navigate()` or `raw.redo()`.

- [ ] **Step 3: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/navigation-coordinator.test.ts --environment node
git add apps/extension/src/firefly/navigation apps/extension/tests/unit/firefly/navigation-coordinator.test.ts
git commit -m "feat(extension): make Firefly navigation race safe"
```

### Task 6: Add real index persistence, dynamic edition, and resumable startup

**Files:**

- Consume: `apps/extension/src/ports/storage-port.ts`
- Consume: `apps/extension/src/content/runtime-storage-port.ts`
- Consume: `apps/extension/src/background/storage/cockpit-db.ts`
- Consume: `apps/extension/src/background/start-cockpit-background.ts`
- Create: `apps/extension/src/firefly/indexing/question-indexer.ts`
- Test: `apps/extension/tests/unit/firefly/question-indexer.test.ts`
- Consume: `apps/extension/tests/unit/content/runtime-storage-port.test.ts`

- [ ] **Step 1: Write failing persistence and resume tests**

Cover structured complete index, partial traversal, persisted checkpoint after every question, restart from checkpoint+1, edition mismatch rejection, total change rejection, repeated ID stop, login/CAPTCHA/429 stop, and restoration of the user's starting position in `finally`.

- [ ] **Step 2: Verify and consume the existing real storage boundary**

```ts
const restored = await storage.loadIndexSnapshot(predictionEdition);
await storage.saveIndexSnapshot(nextSnapshot, nextQuestions);
```

`StoragePort.loadIndexSnapshot()` and `saveIndexSnapshot()` are created by the Cockpit plan and travel through `createRuntimeStoragePort(browser.runtime)`. Verify those request/response schemas and the Service Worker repository test before implementing the indexer. `saveIndexSnapshot(snapshot, questions)` replaces the edition's safe snapshot/question set in one Dexie transaction. Content code never opens IndexedDB, and Firefly does not create a parallel storage adapter.

- [ ] **Step 3: Implement the exact controller-facing `IndexPort`**

At start:

1. Resolve edition from `pageSource + verified edition evidence`; no fallback string.
2. Read the live question and total.
3. Load persisted snapshot/questions through `StoragePort.loadIndexSnapshot()`.
4. Validate persisted edition, total, unique IDs, ordered positions, and checkpoint consistency.
5. Prefer a sanitized structured list. Declare complete only when unique positions cover exactly `1..N` and every row has the same edition/total.
6. Otherwise resume controlled traversal at `checkpointPosition + 1`; persist the whole safe question set and partial snapshot atomically with `StoragePort.saveIndexSnapshot()` after every accepted question.
7. On a stop condition, persist the last safe partial snapshot and return `INDEX_PARTIAL` without automatic retry.
8. In `finally`, restore the original position through `IndexTraversalPort`; restoration failure returns `DESYNC` and must not overwrite a more specific auth/site fault.

```ts
const checkpoint = snapshot?.checkpointPosition ?? 0;
for (let position = checkpoint + 1; position <= liveTotal; position += 1) {
  signal.throwIfAborted();
  await traversal.goToPosition(position, signal);
  const observed = source.readSnapshot();
  assertIndexable(observed, { edition, total: liveTotal, position });
  const question = toIndexedQuestion(observed.question, clock());
  if (seen.has(question.questionId)) throw indexPartialFault("repeated question id");
  seen.add(question.questionId);
  ordered[position - 1] = question.questionId;
  questionsByPosition[position - 1] = question;
  const nextSnapshot = IndexSnapshotSchema.parse({
    predictionEdition: edition,
    orderedQuestionIds: ordered.filter((id): id is string => Boolean(id)),
    siteTotal: liveTotal,
    completeness: position === liveTotal ? "complete" : "partial",
    checkpointPosition: position === liveTotal ? undefined : position,
    schemaVersion: 1,
  });
  await storage.saveIndexSnapshot(
    nextSnapshot,
    questionsByPosition.filter((item): item is IndexedQuestion => Boolean(item)),
  );
}
```

`QuestionIndexer` implements `startOrResume()`, `findQuestion()`, `pause()`, and `dispose()` exactly. `startOrResume()` loads and continues a persisted partial checkpoint, `findQuestion()` resolves only from the validated snapshot for the current dynamic edition, `pause()` aborts and persists the last safe partial snapshot, and `dispose()` is idempotent. It is constructed in bootstrap and never owns raw DOM navigation.

- [ ] **Step 4: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/question-indexer.test.ts apps/extension/tests/unit/content/runtime-storage-port.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
git add apps/extension/src/firefly/indexing apps/extension/tests/unit/firefly/question-indexer.test.ts
git commit -m "feat(extension): persist and resume Firefly indexing"
```

### Task 7: Bind media at request start and enforce one playback owner

**Files:**

- Create: `apps/extension/src/firefly/audio/media-observation.ts`
- Create: `apps/extension/src/background/media/register-firefly-media.ts`
- Modify: `apps/extension/entrypoints/background.ts`
- Create: `apps/extension/src/firefly/audio/audio-broker.ts`
- Test: `apps/extension/tests/unit/firefly/register-firefly-media.test.ts`
- Test: `apps/extension/tests/unit/firefly/audio-broker.test.ts`

- [ ] **Step 1: Write failing causal-binding tests**

Required cases:

- request starts after local arm and completes after navigation: old completion is rejected;
- request starts before arm: rejected even if it completes after arm;
- wrong capture token, question ID, or epoch: rejected;
- stale `invalidateBefore(olderEpoch)` cannot clear a newer binding;
- matching invalidation disarms the old capture and clears the old `src`;
- `site-player-only` never calls extension `Audio.play()`;
- transfer mode calls `pauseAndResetNative()` before extension `Audio.play()`;
- ambiguous/missing/failed media throws typed `AUDIO_ERROR` and controller state retains that code.

- [ ] **Step 2: Define the arm/disarm/observation protocol**

```ts
export const MediaCaptureArmSchema = z.object({
  type: z.literal("PTE_PILOT_MEDIA_CAPTURE_ARM"),
  captureToken: CaptureTokenSchema,
  questionId: z.string().min(1),
  navigationEpoch: NavigationEpochSchema,
  armedAt: z.number().finite(),
});

export const MediaCaptureDisarmSchema = z.object({
  type: z.literal("PTE_PILOT_MEDIA_CAPTURE_DISARM"),
  captureToken: CaptureTokenSchema,
  questionId: z.string().min(1),
  navigationEpoch: NavigationEpochSchema,
});

export const MediaObservationSchema = z.object({
  type: z.literal("PTE_PILOT_MEDIA_OBSERVED"),
  requestId: z.string().min(1),
  url: z.string().url(),
  statusCode: z.number().int(),
  mimeType: z.string().min(1),
  startedAt: z.number().finite(),
  completedAt: z.number().finite(),
  captureToken: CaptureTokenSchema,
  questionId: z.string().min(1),
  navigationEpoch: NavigationEpochSchema,
});
```

- [ ] **Step 3: Bind in background at `onBeforeRequest`, not completion**

The Service Worker keeps `armedByTab` and `requestById` maps. Runtime ARM/DISARM messages use `sender.tab?.id`; no `tabs` permission is requested. `onBeforeRequest` copies the currently armed `{ captureToken, questionId, navigationEpoch, armedAt }` onto the request record with `startedAt = details.timeStamp`. `onHeadersReceived` emits only from that immutable request record, then deletes it. DISARM removes only an exact token/question/epoch match. Tab removal and extension suspend clear maps.

```ts
const onBeforeRequest = (details: WebRequestBodyDetails) => {
  const armed = armedByTab.get(details.tabId);
  if (!armed || details.timeStamp < armed.armedAt) return;
  requestById.set(details.requestId, {
    tabId: details.tabId,
    requestId: details.requestId,
    url: details.url,
    startedAt: details.timeStamp,
    ...armed,
  });
};
```

Filter to verified upload origin and media resource types. Never read response bodies.

- [ ] **Step 4: Preserve the existing trusted background composition**

```ts
// apps/extension/entrypoints/background.ts
import { browser } from "wxt/browser";
import { registerFireflyMediaObserver } from "../src/background/media/register-firefly-media";
import { startCockpitBackground } from "../src/background/start-cockpit-background";

export default defineBackground(() => {
  void browser.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  const stopCockpit = startCockpitBackground(browser);
  const stopMedia = registerFireflyMediaObserver(browser);
  return () => {
    stopMedia();
    stopCockpit();
  };
});
```

- [ ] **Step 5: Implement playback ownership and invalidation**

`AudioBroker.bind(question, epoch)` stores one local binding. Before native Play it generates a capture token, records `armedAt = Date.now()`, sends ARM, and only then calls the media action. It accepts an observation only if all of these are true:

```ts
candidate.captureToken === active.captureToken &&
candidate.questionId === active.question.questionId &&
candidate.navigationEpoch === active.navigationEpoch &&
candidate.startedAt >= active.armedAt &&
site.readSnapshot().question?.questionId === active.question.questionId
```

`AudioPort.invalidateBefore(nextEpoch)` is monotonic:

```ts
invalidateBefore(nextEpoch: NavigationEpoch): void {
  if (!this.binding || this.binding.navigationEpoch >= nextEpoch) return;
  void this.disarmExact(this.binding);
  this.element.pause();
  this.element.removeAttribute("src");
  this.element.load();
  this.binding = null;
  this.emit("EMPTY");
}
```

Playback branches:

- `site-player-only` (default): `toggle()` and `restart()` delegate to the verified native controls. The broker observes/cache-binds the URL identity only; it never assigns the URL to its `Audio` element and never calls `Audio.play()`.
- `transfer-to-extension`: arm, trigger native request, resolve one matching URL, call and await `pauseAndResetNative()`, verify native state is paused/empty, then assign and play the extension element. If any transfer proof fails, remain site-player-only and throw `AUDIO_ERROR`; never start a second player.

Every media failure is created by `audioFault()` and thrown unchanged. `PracticeController` catches it and enters `fault.code === "AUDIO_ERROR"` while keeping typing/navigation available.

- [ ] **Step 6: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/register-firefly-media.test.ts apps/extension/tests/unit/firefly/audio-broker.test.ts --environment node
pnpm --filter @pte-pilot/extension typecheck
git add apps/extension/src/firefly/audio apps/extension/src/background/media apps/extension/entrypoints/background.ts apps/extension/tests/unit/firefly
git commit -m "feat(extension): causally bind Firefly media without double playback"
```

### Task 8: Make `AnswerGate.begin().run()` the only answer transaction

**Files:**

- Create: `apps/extension/src/firefly/answer/answer-gate.ts`
- Modify: `apps/extension/src/firefly/dom/firefly-dom-adapter.ts`
- Test: `apps/extension/tests/unit/firefly/answer-gate.test.ts`
- Test: `apps/extension/tests/architecture/answer-isolation.test.ts`

- [ ] **Step 1: Write failing transaction and isolation tests**

Required cases: synchronous score completion, score-then-answer-button flow, auto-reveal flow, one-shot `run()`, concurrent `begin()` rejection, stale token/attempt/epoch rejection, navigation during score rejection, wrong/stale answer node rejection, abort cleanup, and correct-answer absence from every serialized pre-reveal spy value.

Architecture assertions:

- `PracticeController` imports `SubmissionGatePort`, not `FireflySitePort`;
- the call expression `.readRevealedAnswer(...)` occurs only in `answer-gate.ts`;
- the raw port may declare `readRevealedAnswer`, but no controller-facing port may contain it;
- bridge/background/index files contain no answer selector or answer payload field.

- [ ] **Step 2: Implement the exact transaction shape**

```ts
type ActiveSubmission = {
  token: SubmissionToken;
  attemptEpoch: AttemptEpoch;
  navigationEpoch: NavigationEpoch;
  question: QuestionRef;
  userAnswer: string;
  started: boolean;
  abort: AbortController;
};

export class AnswerGate implements SubmissionGatePort {
  private active: ActiveSubmission | null = null;
  private lastAttemptEpoch: AttemptEpoch;

  constructor(
    private readonly site: RawSubmissionSitePort,
    initialAttemptEpoch: AttemptEpoch,
    private readonly createToken: () => SubmissionToken,
  ) {
    this.lastAttemptEpoch = initialAttemptEpoch;
  }

  begin(input: {
    question: QuestionRef;
    navigationEpoch: NavigationEpoch;
    userAnswer: string;
  }): SubmissionTransaction {
    if (this.active) throw desyncFault("submission already active");
    const snapshot = this.site.readSnapshot();
    assertSameQuestion(snapshot, input.question);
    if (snapshot.answerSurface.visible) throw desyncFault("answer was visible before submission");

    const active: ActiveSubmission = {
      token: this.createToken(),
      attemptEpoch: AttemptEpochSchema.parse(Number(this.lastAttemptEpoch) + 1),
      navigationEpoch: input.navigationEpoch,
      question: input.question,
      userAnswer: input.userAnswer,
      started: false,
      abort: new AbortController(),
    };
    this.active = active;
    this.lastAttemptEpoch = active.attemptEpoch;

    return Object.freeze({
      submissionToken: active.token,
      attemptEpoch: active.attemptEpoch,
      navigationEpoch: active.navigationEpoch,
      run: () => this.run(active),
    });
  }

  private assertActive(active: ActiveSubmission): void {
    if (this.active !== active || active.abort.signal.aborted) {
      throw desyncFault("stale submission transaction");
    }
    assertSameQuestion(this.site.readSnapshot(), active.question);
  }

  private async run(active: ActiveSubmission): Promise<VerifiedSubmissionFacts> {
    this.assertActive(active);
    if (active.started) throw desyncFault("submission transaction already consumed");
    active.started = true;
    const context: SubmissionContext = {
      question: active.question,
      navigationEpoch: active.navigationEpoch,
      attemptEpoch: active.attemptEpoch,
      submissionToken: active.token,
      signal: active.abort.signal,
    };
    let answer = "";
    try {
      const readback = await this.site.writeAnswer(active.userAnswer, context);
      this.assertActive(active);
      if (readback !== active.userAnswer) throw desyncFault("answer input readback mismatch");
      await this.site.scoreAndWait(context);
      this.assertActive(active);
      if (!this.site.readSnapshot().answerSurface.visible) await this.site.revealAnswer(context);
      this.assertActive(active);
      if (!this.site.readSnapshot().answerSurface.visible) throw desyncFault("answer reveal proof unavailable");
      answer = this.site.readRevealedAnswer(context) ?? ""; // only plaintext read call in extension
      if (!answer) throw siteChangedFault("revealed answer is missing or ambiguous");
      const diff = diffWords(answer, active.userAnswer);
      return { accuracy: diff.accuracy, errors: [...diff.errors] };
    } finally {
      answer = "";
      active.userAnswer = "";
      if (this.active === active) this.active = null;
    }
  }

  invalidateBefore(nextEpoch: NavigationEpoch): void {
    if (!this.active || this.active.navigationEpoch >= nextEpoch) return;
    this.active.abort.abort(desyncFault("submission invalidated by navigation"));
    this.active.userAnswer = "";
    this.active = null;
  }

  dispose(): void {
    this.active?.abort.abort();
    if (this.active) this.active.userAnswer = "";
    this.active = null;
  }
}
```

The DOM adapter passes a `RawSubmissionSitePort` view, initial attempt epoch, and token factory to `AnswerGate`. The controller receives only the resulting `SubmissionGatePort`. Redo is not an answer-gate action; `NavigationCoordinator.redo()` owns the raw redo click and atomically proves same-question/answer-hidden/input-empty before returning its fresh epoch.

- [ ] **Step 3: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/answer-gate.test.ts apps/extension/tests/architecture/answer-isolation.test.ts --environment jsdom
rg -n "\.readRevealedAnswer\(" apps/extension/src
pnpm --filter @pte-pilot/extension typecheck
git add apps/extension/src/firefly/answer apps/extension/src/firefly/dom apps/extension/tests/unit/firefly/answer-gate.test.ts apps/extension/tests/architecture/answer-isolation.test.ts
git commit -m "feat(extension): isolate Firefly answers behind one-shot gate"
```

Expected `rg`: one call, inside `apps/extension/src/firefly/answer/answer-gate.ts`. The interface declaration is not a call and is allowed in the raw composition port.

### Task 9: Compose real ports and mount UI before startup

**Files:**

- Create: `apps/extension/src/firefly/session/firefly-sync-coordinator.ts`
- Create: `apps/extension/src/firefly/bootstrap-firefly-sync.ts`
- Modify: `apps/extension/entrypoints/firefly.content.tsx`
- Test: `apps/extension/tests/unit/firefly/bootstrap-firefly-sync.test.ts`
- Test: `apps/extension/tests/unit/firefly/firefly-sync-coordinator.test.ts`

- [ ] **Step 1: Write failing composition and lifecycle tests**

Assert that controller deps are the narrow ports; `AnswerGate`, event-based `NavigationCoordinator`, `QuestionIndexer`, existing real runtime `StoragePort`, and `AudioBroker` are constructed; startup occurs after `mountCockpit`; a startup error calls `controller.reportFault()` while UI remains mounted; dispose is idempotent; each owner is disposed exactly once.

- [ ] **Step 2: Keep one typed fault taxonomy**

`AUTH_REQUIRED`, `SITE_CHANGED`, and `DESYNC` block site mutation. `INDEX_PARTIAL` pauses indexing but retains the safe checkpoint. `AUDIO_ERROR` disables plugin transfer/playback only and keeps typing/navigation usable. Preserve an existing typed `RuntimeFault`; do not wrap every failure as `DESYNC`.

- [ ] **Step 3: Build a construction-only bootstrap**

```ts
// apps/extension/src/firefly/bootstrap-firefly-sync.ts
export interface FireflyRuntime {
  controller: PracticeController;
  start(): Promise<void>;
  dispose(): void;
}

export function bootstrapFireflySync(args: {
  ctx: ContentScriptContext;
  document: Document;
  runtime: typeof browser.runtime;
}): FireflyRuntime {
  const bridge = createBridgeClient(args.document);
  const site = createFireflyDomSitePort({ document: args.document, bridge });
  const storage = createRuntimeStoragePort(args.runtime);
  let controller!: PracticeController;
  const navigationCoordinator = createNavigationCoordinator({
    raw: site,
    persistDraft: () => controller.flushDraft(),
    async resolvePosition(questionId) {
      const edition = resolvePredictionEdition({
        url: new URL(args.document.location.href),
        verifiedEvidence: site.readPredictionEditionEvidence(),
      });
      const index = await storage.loadIndexSnapshot(edition);
      return index.questions.find((question) => question.questionId === questionId)?.sitePosition ?? null;
    },
  });
  const submission = new AnswerGate(site, () => SubmissionTokenSchema.parse(crypto.randomUUID()));
  const index = new QuestionIndexer({
    source: site,
    traversal: navigationCoordinator.indexTraversal,
    storage,
    resolveEdition: () => resolvePredictionEdition({
      url: new URL(args.document.location.href),
      verifiedEvidence: site.readPredictionEditionEvidence(),
    }),
    clock: Date.now,
  });
  const audio = createAudioBroker({
    site,
    runtime: args.runtime,
    playbackMode: site.verifiedContract.playbackMode,
    clock: Date.now,
  });
  controller = createPracticeController({
    submission,
    navigation: navigationCoordinator,
    index,
    audio,
    storage,
    clock: Date.now,
  });

  let disposed = false;
  return {
    controller,
    start: () => controller.start(),
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.dispose();
      bridge.dispose();
      site.dispose();
    },
  };
}
```

No probe, controller start, indexing, native click, or network mutation occurs during construction. The deferred `persistDraft` closure is not invoked until after `controller` assignment. `controller.start()` performs the authenticated probe and recoverable restoration after the UI exists. `controller.dispose()` owns submission abort plus navigation/index/audio disposal; runtime then disposes only bridge and raw DOM resources.

- [ ] **Step 4: Mount first, then start**

```tsx
// apps/extension/entrypoints/firefly.content.tsx
import { browser } from "wxt/browser";
import "../src/app/cockpit.css";
import { mountCockpit } from "../src/app/mount-cockpit";
import { bootstrapFireflySync } from "../src/firefly/bootstrap-firefly-sync";
import { normalizeStartupFault } from "../src/firefly/session/firefly-sync-coordinator";

export default defineContentScript({
  matches: ["https://www.fireflyau.com/ptehome/exercise*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const runtime = bootstrapFireflySync({ ctx, document, runtime: browser.runtime });
    const unmount = await mountCockpit({ ctx, controller: runtime.controller });
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      unmount();
      runtime.dispose();
    };
    ctx.onInvalidated(dispose);
    try {
      await runtime.start();
    } catch (error) {
      runtime.controller.reportFault(normalizeStartupFault(error));
    }
  },
});
```

- [ ] **Step 5: Verify and commit**

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly/bootstrap-firefly-sync.test.ts apps/extension/tests/unit/firefly/firefly-sync-coordinator.test.ts --environment jsdom
pnpm --filter @pte-pilot/extension typecheck
pnpm --filter @pte-pilot/extension build
git add apps/extension/src/firefly/session apps/extension/src/firefly/bootstrap-firefly-sync.ts apps/extension/entrypoints/firefly.content.tsx apps/extension/tests/unit/firefly
git commit -m "feat(extension): compose Firefly runtime behind narrow ports"
```

### Task 10: Prove the complete adapter in Playwright

**Files:**

- Create: `tests/e2e/firefly-adapter-media-sync.spec.ts`
- Consume: `tests/fixtures/firefly/firefly-week.fixture.ts`
- Consume: `playwright.config.ts`

- [ ] **Step 1: Launch the built extension with the shared installer**

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium, expect, test } from "@playwright/test";
import {
  defaultFireflyScenario,
  installFireflyFixture,
  type FireflyFixtureScenario,
} from "../fixtures/firefly/firefly-week.fixture";

const extensionPath = resolve("apps/extension/.output/chrome-mv3");

async function openScenario(overrides: Partial<FireflyFixtureScenario> = {}) {
  const userDataDir = await mkdtemp(join(tmpdir(), "pte-pilot-firefly-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const scenario = await installFireflyFixture(context, {
    ...defaultFireflyScenario(),
    ...overrides,
  });
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(`https://www.fireflyau.com/ptehome/exercise?pageSource=${scenario.pageSource}`);
  await expect(page.getByTestId("pte-pilot-root")).toBeVisible();
  return {
    page,
    context,
    async close() {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}
```

Do not add another `context.route()`. Do not invent a second fixture interface.

- [ ] **Step 2: Add browser-level regressions**

Required scenarios:

1. `Alt+J` reaches exactly the next question; one extension command equals one site navigation count.
2. Manual site Next while draft persistence is delayed reconciles the latest question and does not click twice.
3. Duplicate semantic Next enters `SITE_CHANGED` with zero site navigation.
4. Synchronous scoring completes once; holding/repeating Enter cannot double-submit.
5. No correct answer appears in extension/background messages or storage before score proof.
6. Same-question redo hides answer, clears both inputs, and creates a fresh attempt epoch.
7. Structured list indexes complete dynamically for fixture `N`; no assertion contains literal `192`.
8. Partial indexing survives extension reload and resumes from checkpoint+1, then restores the user's starting position.
9. An old delayed q1 media response arriving after navigation to q2 is ignored.
10. Default site-player mode produces one audible player path; extension `Audio.play()` remains unused.
11. Explicit transfer mode pauses/resets native before extension playback.
12. Media failure enters `AUDIO_ERROR` while answer typing and Next remain usable.
13. Changed selectors/auth/CAPTCHA show mounted recovery UI instead of preventing mount.
14. Content-script invalidation/reload leaves one MAIN wrapper and one bridge delivery.

- [ ] **Step 3: Run E2E without a nonexistent Playwright project**

```powershell
pnpm --filter @pte-pilot/extension build
pnpm exec playwright test tests/e2e/firefly-adapter-media-sync.spec.ts
```

Do not pass `--project=chromium` unless `playwright.config.ts` later defines that named project.

- [ ] **Step 4: Commit E2E proof**

```powershell
git add tests/e2e/firefly-adapter-media-sync.spec.ts
git commit -m "test(e2e): prove Firefly adapter media and sync invariants"
```

## Final verification

- [ ] Verify only the approved origins/permissions exist and minimum Chrome remains `120` or newer.
- [ ] Verify `TRUSTED_CONTEXTS` still appears in the final background entrypoint.
- [ ] Verify root Vitest discovery sees all new tests; use root commands, not an extension script whose root is ambiguous.
- [ ] Verify no `--project=chromium` remains unless the root Playwright config defines it.
- [ ] Verify no hard-coded `192` or `yc-current` exists in production code.
- [ ] Verify the raw answer-reader is declared only in the raw port/DOM adapter and called only by `answer-gate.ts`.
- [ ] Verify no raw site navigation/submission capability appears in `PracticeControllerDeps`.
- [ ] Verify no media bytes or answer plaintext are persisted or sent outside the extension.
- [ ] Verify MAIN patches and runtime listeners all have idempotent cleanup.

```powershell
pnpm exec vitest run apps/extension/tests/unit/firefly apps/extension/tests/architecture tests/fixtures/firefly --environment node
pnpm --filter @pte-pilot/extension typecheck
pnpm --filter @pte-pilot/extension build
pnpm exec playwright test tests/e2e/firefly-adapter-media-sync.spec.ts
pnpm lint
rg -n "TRUSTED_CONTEXTS" apps/extension/entrypoints/background.ts
rg -n "yc-current|\b192\b" apps/extension/src apps/extension/entrypoints tests/e2e
rg -n "\.readRevealedAnswer\(" apps/extension/src
```

Expected: unit/architecture/E2E/type/build/lint checks pass; `TRUSTED_CONTEXTS` is present; the hard-code scan is empty; the answer-call scan reports exactly one call in `answer-gate.ts`.

## Cross-plan completion handoff

Before implementing this plan, the Cockpit plan must land the exact `submission-gate-port.ts`, event-based `navigation-port.ts`, `index-port.ts`, and `StoragePort.loadIndexSnapshot/saveIndexSnapshot` contracts, then refactor `PracticeController` to consume singular `submission`, `navigation`, and `index` dependencies with no raw site. Before integration hardening, this plan must land the single `installFireflyFixture()` API, monotonic `AudioPort.invalidate(epochFence)` semantics, typed `AUDIO_ERROR` preservation, and construction-only `bootstrapFireflySync()`. Integration tests must import that fixture installer and must not own Firefly routes, raw answer reads, raw site clicks, or a separate media protocol.
