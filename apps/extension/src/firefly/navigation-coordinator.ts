import type { QuestionIdentity } from "../domain/types";

export interface NavigationSitePort {
  readIdentity(): QuestionIdentity;
  click(name: "previous" | "next"): void;
  selectQuestion(position: number): void | Promise<void>;
  observeQuestionChanges(
    callback: (identity: QuestionIdentity) => void,
  ): () => void;
}

export type NavigationIntent =
  | { kind: "previous"; expectedQuestionId?: string }
  | { kind: "next"; expectedQuestionId?: string }
  | { kind: "select"; position: number; expectedQuestionId?: string };

export interface NavigationResult {
  identity: QuestionIdentity;
  epoch: number;
}

export class NavigationCoordinator extends EventTarget {
  readonly #site: NavigationSitePort;
  readonly #stopObserver: () => void;
  #epoch = 0;
  #activeEpoch: number | null = null;
  #lastIdentity: QuestionIdentity;
  #manualChangeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(site: NavigationSitePort) {
    super();
    this.#site = site;
    this.#lastIdentity = site.readIdentity();
    this.#stopObserver = site.observeQuestionChanges((identity) => {
      if (this.#activeEpoch !== null) return;
      this.scheduleManualChange(identity);
    });
  }

  get epoch(): number {
    return this.#epoch;
  }

  get current(): QuestionIdentity {
    return this.#lastIdentity;
  }

  async navigate(
    intent: NavigationIntent,
    timeoutMs = 8_000,
    signal?: AbortSignal,
  ): Promise<NavigationResult> {
    if (this.#activeEpoch !== null)
      throw new Error("navigation:already-active");
    if (signal?.aborted) throw new Error("navigation:aborted");
    const before = this.#site.readIdentity();
    const targetPosition = expectedPosition(before, intent);
    if (targetPosition < 1 || targetPosition > before.total) {
      throw new Error("navigation:target-out-of-range");
    }
    const epoch = ++this.#epoch;
    this.clearManualChange();
    this.#activeEpoch = epoch;
    try {
      this.dispatchEvent(
        new CustomEvent("navigationstart", {
          detail: { identity: before, epoch, manual: false },
        }),
      );
      if (signal?.aborted) throw new Error("navigation:aborted");
      if (intent.kind === "select")
        await this.#site.selectQuestion(intent.position);
      else this.#site.click(intent.kind);

      const identity = await waitForIdentity(
        this.#site,
        (candidate) => {
          if (candidate.predictionEdition !== before.predictionEdition)
            return false;
          if (
            candidate.position !== targetPosition ||
            candidate.total !== before.total
          )
            return false;
          if (
            intent.kind !== "select" &&
            candidate.questionId === before.questionId
          )
            return false;
          return (
            !intent.expectedQuestionId ||
            candidate.questionId === intent.expectedQuestionId
          );
        },
        timeoutMs,
        signal,
      );
      if (epoch !== this.#epoch) throw new Error("navigation:stale-epoch");
      this.#lastIdentity = identity;
      this.dispatchEvent(
        new CustomEvent("navigated", { detail: { identity, epoch } }),
      );
      return { identity, epoch };
    } finally {
      if (this.#activeEpoch === epoch) this.#activeEpoch = null;
    }
  }

  dispose(): void {
    this.clearManualChange();
    this.#stopObserver();
  }

  private scheduleManualChange(observed: QuestionIdentity): void {
    this.clearManualChange();
    const observedKey = identityKey(observed);
    this.#manualChangeTimer = setTimeout(() => {
      this.#manualChangeTimer = null;
      if (this.#activeEpoch !== null) return;
      let identity: QuestionIdentity;
      try {
        identity = this.#site.readIdentity();
      } catch {
        return;
      }
      if (
        identityKey(identity) !== observedKey ||
        identityKey(identity) === identityKey(this.#lastIdentity)
      ) {
        return;
      }
      this.#lastIdentity = identity;
      this.#epoch += 1;
      this.dispatchEvent(
        new CustomEvent("navigationstart", {
          detail: { identity, epoch: this.#epoch, manual: true },
        }),
      );
      this.dispatchEvent(
        new CustomEvent("manualchange", {
          detail: { identity, epoch: this.#epoch },
        }),
      );
    }, 120);
  }

  private clearManualChange(): void {
    if (this.#manualChangeTimer === null) return;
    clearTimeout(this.#manualChangeTimer);
    this.#manualChangeTimer = null;
  }
}

function expectedPosition(
  before: QuestionIdentity,
  intent: NavigationIntent,
): number {
  if (intent.kind === "previous") return before.position - 1;
  if (intent.kind === "next") return before.position + 1;
  return intent.position;
}

function identityKey(identity: QuestionIdentity): string {
  return `${identity.predictionEdition}:${identity.questionId}:${identity.position}:${identity.total}`;
}

function waitForIdentity(
  site: NavigationSitePort,
  predicate: (identity: QuestionIdentity) => boolean,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<QuestionIdentity> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let stableKey: string | null = null;
    let stableSince = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let stop: () => void = () => undefined;
    const stabilityMs = 120;
    const cleanup = () => {
      if (timeout !== null) clearTimeout(timeout);
      if (poll !== null) clearInterval(poll);
      timeout = null;
      poll = null;
      stop();
      stop = () => undefined;
      signal?.removeEventListener("abort", onAbort);
    };
    const finish = (identity: QuestionIdentity) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(identity);
    };
    const fail = (error: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };
    const onAbort = () => fail(new Error("navigation:aborted"));
    const inspect = (identity: QuestionIdentity) => {
      if (!predicate(identity)) {
        stableKey = null;
        stableSince = 0;
        return;
      }
      const key = identityKey(identity);
      const now = performance.now();
      if (key !== stableKey) {
        stableKey = key;
        stableSince = now;
        return;
      }
      if (now - stableSince >= stabilityMs) finish(identity);
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    stop = site.observeQuestionChanges(inspect);
    if (finished) {
      stop();
      stop = () => undefined;
      return;
    }
    poll = setInterval(() => {
      try {
        inspect(site.readIdentity());
      } catch {
        // DOM can be transient while Firefly swaps question components.
      }
    }, 50);
    timeout = setTimeout(
      () => fail(new Error("navigation:timeout")),
      timeoutMs,
    );
  });
}
