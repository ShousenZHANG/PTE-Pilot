import type { QuestionIdentity } from "../domain/types";

export interface NavigationSitePort {
  readIdentity(): QuestionIdentity;
  click(name: "previous" | "next"): void;
  selectQuestion(position: number): void;
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
  ): Promise<NavigationResult> {
    if (this.#activeEpoch !== null)
      throw new Error("navigation:already-active");
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
      if (intent.kind === "select") this.#site.selectQuestion(intent.position);
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
): Promise<QuestionIdentity> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let stableKey: string | null = null;
    let stableSince = 0;
    const stabilityMs = 120;
    const finish = (identity: QuestionIdentity) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      clearInterval(poll);
      stop();
      resolve(identity);
    };
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
    const stop = site.observeQuestionChanges(inspect);
    const poll = setInterval(() => {
      try {
        inspect(site.readIdentity());
      } catch {
        // DOM can be transient while Firefly swaps question components.
      }
    }, 50);
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      clearInterval(poll);
      stop();
      reject(new Error("navigation:timeout"));
    }, timeoutMs);
  });
}
