import type {
  IndexedQuestion,
  IndexSnapshot,
  QuestionIdentity,
} from "../domain/types";
import type { NavigationCoordinator } from "./navigation-coordinator";

export interface IndexSitePort {
  readIdentity(): QuestionIdentity;
  questionOptions(): QuestionIdentity[] | null;
  supportsDirectSelection?(): boolean;
}

export interface IndexCheckpointPort {
  resumeSnapshot?(): IndexSnapshot | null;
  resumeQuestions?(): IndexedQuestion[];
  saveQuestion(question: IndexedQuestion): Promise<void>;
  saveSnapshot(snapshot: IndexSnapshot): Promise<void>;
}

export class QuestionIndexer extends EventTarget {
  readonly #site: IndexSitePort;
  readonly #navigation: NavigationCoordinator;
  readonly #checkpoints: IndexCheckpointPort;
  #abortController: AbortController | null = null;
  #hardAbortController: AbortController | null = null;
  #paused = false;
  #failureReason: string | null = null;
  readonly #resumeWaiters = new Set<() => void>();

  constructor(
    site: IndexSitePort,
    navigation: NavigationCoordinator,
    checkpoints: IndexCheckpointPort,
  ) {
    super();
    this.#site = site;
    this.#navigation = navigation;
    this.#checkpoints = checkpoints;
  }

  async discover(): Promise<IndexSnapshot> {
    const structured = this.#site.questionOptions();
    if (structured) {
      const snapshot = toSnapshot(structured, "complete");
      for (const question of structured)
        await this.#checkpoints.saveQuestion(toIndexed(question));
      await this.#checkpoints.saveSnapshot(snapshot);
      return snapshot;
    }
    return this.learnCurrent();
  }

  async learnCurrent(): Promise<IndexSnapshot> {
    const current = this.#site.readIdentity();
    await this.#checkpoints.saveQuestion(toIndexed(current));
    const snapshot: IndexSnapshot = {
      predictionEdition: current.predictionEdition,
      orderedQuestionIds: [current.questionId],
      siteTotal: current.total,
      completeness: "partial",
      checkpointPosition: current.position,
      schemaVersion: 1,
    };
    await this.#checkpoints.saveSnapshot(snapshot);
    return snapshot;
  }

  async controlledTraversal(
    startAfter: Promise<unknown> = Promise.resolve(),
  ): Promise<IndexSnapshot> {
    if (this.#abortController) throw new Error("index:already-running");
    const abortController = new AbortController();
    const hardAbortController = new AbortController();
    this.#abortController = abortController;
    this.#hardAbortController = hardAbortController;
    this.#paused = false;
    this.#failureReason = null;
    try {
      try {
        await waitForPreflight(startAfter, abortController.signal);
      } catch (error) {
        this.#failureReason = errorMessage(error);
        throw error;
      }
      const structured = this.#site.questionOptions();
      if (structured)
        return await this.controlledStructuredIndex(
          structured,
          abortController,
        );
      const origin = this.#site.readIdentity();
      const found = resumeFound(
        this.#checkpoints.resumeQuestions?.() ?? [],
        origin,
      );
      found.set(origin.position, origin);
      const resumedSnapshot = this.#checkpoints.resumeSnapshot?.();
      let checkpointPosition = validResumeCheckpoint(resumedSnapshot, origin);
      const checkpoint = (identity: QuestionIdentity) => {
        checkpointPosition = identity.position;
      };
      await this.#checkpoints.saveQuestion(toIndexed(origin));
      let traversalFailed = false;
      try {
        if (this.#site.supportsDirectSelection?.()) {
          const missingPositions = Array.from(
            { length: origin.total },
            (_, index) => index + 1,
          ).filter((position) => !found.has(position));
          for (const targetPosition of missingPositions) {
            await this.waitUntilResumed(abortController.signal);
            if (abortController.signal.aborted) break;
            const result = await this.#navigation.navigate(
              {
                kind: "select",
                position: targetPosition,
              },
              8_000,
              abortController.signal,
            );
            found.set(result.identity.position, result.identity);
            checkpoint(result.identity);
            await this.#checkpoints.saveQuestion(toIndexed(result.identity));
            await this.#checkpoints.saveSnapshot(
              toSnapshot(
                [...found.values()].sort(byPosition),
                "partial",
                result.identity.position,
              ),
            );
          }
        } else {
          for (const targetPosition of traversalTargets(
            origin,
            found,
            checkpointPosition,
          )) {
            const currentPosition = this.#site.readIdentity().position;
            await this.walkTo(
              targetPosition,
              currentPosition < targetPosition ? "next" : "previous",
              found,
              abortController.signal,
              checkpoint,
            );
          }
        }
      } catch (error) {
        traversalFailed = true;
        this.#failureReason = errorMessage(error);
      } finally {
        if (!hardAbortController.signal.aborted) {
          try {
            await this.restoreOrigin(origin, found, hardAbortController.signal);
          } catch (error) {
            traversalFailed = true;
            this.#failureReason ??= errorMessage(error);
          }
        }
      }

      const identities = [...found.values()].sort(byPosition);
      const restored = this.#site.readIdentity();
      const complete =
        !traversalFailed &&
        !abortController.signal.aborted &&
        restored.questionId === origin.questionId &&
        hasContiguousPositions(identities, origin.total);
      const snapshot = toSnapshot(
        identities,
        complete ? "complete" : "partial",
        checkpointPosition,
      );
      await this.#checkpoints.saveSnapshot(snapshot);
      return snapshot;
    } finally {
      if (this.#abortController === abortController)
        this.#abortController = null;
      if (this.#hardAbortController === hardAbortController)
        this.#hardAbortController = null;
      this.#paused = false;
      this.releaseResumeWaiters();
    }
  }

  pause(): boolean {
    if (!this.#abortController || this.#paused) return false;
    this.#paused = true;
    this.dispatchEvent(new CustomEvent("statechange", { detail: "PAUSED" }));
    return true;
  }

  resume(): boolean {
    if (!this.#abortController || !this.#paused) return false;
    this.#paused = false;
    this.releaseResumeWaiters();
    this.dispatchEvent(new CustomEvent("statechange", { detail: "INDEXING" }));
    return true;
  }

  cancel(): boolean {
    if (!this.#abortController) return false;
    this.#abortController.abort();
    this.#paused = false;
    this.releaseResumeWaiters();
    return true;
  }

  hardCancel(): boolean {
    if (!this.#abortController && !this.#hardAbortController) return false;
    this.#hardAbortController?.abort();
    this.#abortController?.abort();
    this.#paused = false;
    this.releaseResumeWaiters();
    return true;
  }

  dispose(): void {
    this.hardCancel();
  }

  get failureReason(): string | null {
    return this.#failureReason;
  }

  private async controlledStructuredIndex(
    structured: QuestionIdentity[],
    abortController: AbortController,
  ): Promise<IndexSnapshot> {
    const collected: QuestionIdentity[] = [];
    let failed = false;
    try {
      for (const question of structured) {
        await this.waitUntilResumed(abortController.signal);
        if (abortController.signal.aborted) break;
        await this.#checkpoints.saveQuestion(toIndexed(question));
        collected.push(question);
        await this.#checkpoints.saveSnapshot(
          toSnapshot(collected, "partial", question.position),
        );
      }
    } catch (error) {
      failed = true;
      this.#failureReason = errorMessage(error);
    }
    if (collected.length === 0) {
      if (!abortController.signal.aborted)
        throw new Error(this.#failureReason ?? "index:no-checkpoint");
      const current = this.#site.readIdentity();
      if (!structured.some((question) => sameIdentity(question, current)))
        throw new Error("index:cancel-identity-mismatch");
      await this.#checkpoints.saveQuestion(toIndexed(current));
      collected.push(current);
      await this.#checkpoints.saveSnapshot(
        toSnapshot(collected, "partial", current.position),
      );
    }
    const complete =
      !failed &&
      !abortController.signal.aborted &&
      hasContiguousPositions(collected, structured.length);
    let snapshot = toSnapshot(
      collected,
      complete ? "complete" : "partial",
      collected.at(-1)?.position,
    );
    await this.#checkpoints.saveSnapshot(snapshot);
    if (
      abortController.signal.aborted &&
      snapshot.completeness === "complete"
    ) {
      snapshot = { ...snapshot, completeness: "partial" };
      await this.#checkpoints.saveSnapshot(snapshot);
    }
    return snapshot;
  }

  private async walkTo(
    targetPosition: number,
    kind: "next" | "previous",
    found: Map<number, QuestionIdentity>,
    signal: AbortSignal,
    onCheckpoint: (identity: QuestionIdentity) => void,
  ): Promise<void> {
    while (this.#site.readIdentity().position !== targetPosition) {
      await this.waitUntilResumed(signal);
      if (signal.aborted) return;
      const result = await this.#navigation.navigate({ kind }, 8_000, signal);
      found.set(result.identity.position, result.identity);
      onCheckpoint(result.identity);
      await this.#checkpoints.saveQuestion(toIndexed(result.identity));
      await this.#checkpoints.saveSnapshot(
        toSnapshot(
          [...found.values()].sort(byPosition),
          "partial",
          result.identity.position,
        ),
      );
    }
  }

  private async restoreOrigin(
    origin: QuestionIdentity,
    found: Map<number, QuestionIdentity>,
    signal: AbortSignal,
  ): Promise<void> {
    let current = this.#site.readIdentity();
    if (
      current.position !== origin.position &&
      this.#site.supportsDirectSelection?.()
    ) {
      const result = await this.#navigation.navigate(
        {
          kind: "select",
          position: origin.position,
          expectedQuestionId: origin.questionId,
        },
        8_000,
        signal,
      );
      current = this.#site.readIdentity();
      if (
        !sameIdentity(result.identity, current) ||
        !sameIdentity(current, origin)
      )
        throw new Error("index:restore-mismatch");
      found.set(current.position, current);
      await this.#checkpoints.saveQuestion(toIndexed(current));
      return;
    }
    while (current.position !== origin.position) {
      const kind = current.position < origin.position ? "next" : "previous";
      const result = await this.#navigation.navigate({ kind }, 8_000, signal);
      current = result.identity;
      found.set(current.position, current);
      await this.#checkpoints.saveQuestion(toIndexed(current));
    }
    if (current.questionId !== origin.questionId)
      throw new Error("index:restore-mismatch");
  }

  private async waitUntilResumed(signal: AbortSignal): Promise<void> {
    while (this.#paused && !signal.aborted) {
      await new Promise<void>((resolve) => {
        const finish = () => {
          signal.removeEventListener("abort", finish);
          this.#resumeWaiters.delete(finish);
          resolve();
        };
        this.#resumeWaiters.add(finish);
        signal.addEventListener("abort", finish, { once: true });
      });
    }
  }

  private releaseResumeWaiters(): void {
    for (const resume of this.#resumeWaiters) resume();
    this.#resumeWaiters.clear();
  }
}

function resumeFound(
  questions: IndexedQuestion[],
  origin: QuestionIdentity,
): Map<number, QuestionIdentity> {
  const found = new Map<number, QuestionIdentity>();
  const ids = new Map<string, number>();
  for (const question of questions) {
    if (
      question.predictionEdition !== origin.predictionEdition ||
      question.siteTotal !== origin.total ||
      question.sitePosition > origin.total
    )
      continue;
    const existingAtPosition = found.get(question.sitePosition);
    const existingPosition = ids.get(question.questionId);
    if (
      (existingAtPosition &&
        existingAtPosition.questionId !== question.questionId) ||
      (existingPosition !== undefined &&
        existingPosition !== question.sitePosition)
    ) {
      return new Map();
    }
    found.set(question.sitePosition, {
      predictionEdition: question.predictionEdition,
      questionId: question.questionId,
      position: question.sitePosition,
      total: question.siteTotal,
      tags: question.tags,
    });
    ids.set(question.questionId, question.sitePosition);
  }
  return found;
}

function validResumeCheckpoint(
  snapshot: IndexSnapshot | null | undefined,
  origin: QuestionIdentity,
): number {
  if (
    snapshot?.predictionEdition !== origin.predictionEdition ||
    snapshot.siteTotal !== origin.total ||
    snapshot.checkpointPosition === undefined
  )
    return origin.position;
  return snapshot.checkpointPosition;
}

function traversalTargets(
  origin: QuestionIdentity,
  found: Map<number, QuestionIdentity>,
  checkpointPosition: number,
): number[] {
  const missing = Array.from(
    { length: origin.total },
    (_, index) => index + 1,
  ).filter((position) => !found.has(position));
  const below = missing.filter((position) => position < origin.position);
  const above = missing.filter((position) => position > origin.position);
  const lowerTarget = below.length ? Math.min(...below) : null;
  const upperTarget = above.length ? Math.max(...above) : null;
  if (lowerTarget !== null && upperTarget !== null) {
    return checkpointPosition >= origin.position
      ? [upperTarget, lowerTarget, origin.position]
      : [lowerTarget, upperTarget, origin.position];
  }
  if (upperTarget !== null) return [upperTarget, origin.position];
  if (lowerTarget !== null) return [lowerTarget, origin.position];
  return [];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "index:unknown-failure";
}

function waitForPreflight(
  preflight: Promise<unknown>,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) {
    void preflight.catch(() => undefined);
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      callback();
    };
    const onAbort = () => finish(resolve);
    signal.addEventListener("abort", onAbort, { once: true });
    void preflight.then(
      () => finish(resolve),
      (error) => finish(() => reject(error)),
    );
  });
}

function toIndexed(identity: QuestionIdentity): IndexedQuestion {
  return {
    predictionEdition: identity.predictionEdition,
    questionId: identity.questionId,
    sitePosition: identity.position,
    siteTotal: identity.total,
    tags: identity.tags,
    discoveredAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

function toSnapshot(
  identities: QuestionIdentity[],
  completeness: "complete" | "partial",
  checkpointPosition?: number,
): IndexSnapshot {
  const first = identities[0];
  if (!first) throw new Error("index:empty");
  const snapshot: IndexSnapshot = {
    predictionEdition: first.predictionEdition,
    orderedQuestionIds: identities
      .sort(byPosition)
      .map((question) => question.questionId),
    siteTotal: first.total,
    completeness,
    schemaVersion: 1,
  };
  if (checkpointPosition !== undefined)
    snapshot.checkpointPosition = checkpointPosition;
  return snapshot;
}

function byPosition(a: QuestionIdentity, b: QuestionIdentity): number {
  return a.position - b.position;
}

function sameIdentity(
  left: QuestionIdentity,
  right: QuestionIdentity,
): boolean {
  return (
    left.predictionEdition === right.predictionEdition &&
    left.questionId === right.questionId &&
    left.position === right.position &&
    left.total === right.total
  );
}

function hasContiguousPositions(
  values: QuestionIdentity[],
  total: number,
): boolean {
  const positions = new Set(values.map((value) => value.position));
  const questionIds = new Set(values.map((value) => value.questionId));
  return (
    positions.size === total &&
    questionIds.size === total &&
    Array.from({ length: total }, (_, index) => index + 1).every((n) =>
      positions.has(n),
    )
  );
}
