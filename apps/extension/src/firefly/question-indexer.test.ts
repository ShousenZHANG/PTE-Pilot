import { describe, expect, it } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import type {
  NavigationCoordinator,
  NavigationIntent,
} from "./navigation-coordinator";
import { type IndexSitePort, QuestionIndexer } from "./question-indexer";

function identity(position: number, total = 3): QuestionIdentity {
  return {
    predictionEdition: "weekly-2026-W29",
    questionId: `q-${position}`,
    position,
    total,
    tags: [],
  };
}

function setup(resumed: QuestionIdentity[] = []) {
  let current = identity(1);
  let navigationCalls = 0;
  let releaseFirst: (() => void) | undefined;
  const firstNavigation = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const savedSnapshots: Array<{
    completeness: "complete" | "partial";
    checkpointPosition?: number;
    orderedQuestionIds: string[];
  }> = [];
  const navigation = {
    async navigate(intent: { kind: "next" | "previous" }) {
      navigationCalls += 1;
      if (navigationCalls === 1) await firstNavigation;
      current = identity(current.position + (intent.kind === "next" ? 1 : -1));
      return { identity: current, epoch: navigationCalls };
    },
  } as NavigationCoordinator;
  const indexer = new QuestionIndexer(
    {
      readIdentity: () => current,
      questionOptions: () => null,
    },
    navigation,
    {
      resumeSnapshot: () =>
        resumed.length
          ? {
              predictionEdition: resumed[0]?.predictionEdition ?? "",
              orderedQuestionIds: resumed.map((value) => value.questionId),
              siteTotal: resumed[0]?.total ?? 1,
              completeness: "partial",
              checkpointPosition: resumed.at(-1)?.position ?? 1,
              schemaVersion: 1,
            }
          : null,
      resumeQuestions: () =>
        resumed.map((value) => ({
          predictionEdition: value.predictionEdition,
          questionId: value.questionId,
          sitePosition: value.position,
          siteTotal: value.total,
          tags: value.tags,
          discoveredAt: new Date(0).toISOString(),
          schemaVersion: 1,
        })),
      saveQuestion: async () => undefined,
      saveSnapshot: async (snapshot) => {
        savedSnapshots.push({
          completeness: snapshot.completeness,
          orderedQuestionIds: snapshot.orderedQuestionIds,
          ...(snapshot.checkpointPosition === undefined
            ? {}
            : { checkpointPosition: snapshot.checkpointPosition }),
        });
      },
    },
  );
  return {
    indexer,
    releaseFirst: () => releaseFirst?.(),
    calls: () => navigationCalls,
    current: () => current,
    savedSnapshots,
  };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("test:condition-not-reached");
}

describe("QuestionIndexer", () => {
  it("hard-cancels an in-flight traversal without restoring or clicking again", async () => {
    let current = identity(1);
    const intents: NavigationIntent[] = [];
    let navigationStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      navigationStarted = resolve;
    });
    const navigation = {
      navigate(
        intent: NavigationIntent,
        _timeoutMs?: number,
        signal?: AbortSignal,
      ) {
        intents.push(intent);
        current = identity(2);
        navigationStarted?.();
        return new Promise<never>((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new Error("navigation:aborted")),
            { once: true },
          );
        });
      },
    } as unknown as NavigationCoordinator;
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => current,
        questionOptions: () => null,
      },
      navigation,
      {
        saveQuestion: async () => undefined,
        saveSnapshot: async () => undefined,
      },
    );

    const traversal = indexer.controlledTraversal();
    await started;
    expect(indexer.hardCancel()).toBe(true);

    await expect(traversal).resolves.toMatchObject({ completeness: "partial" });
    expect(intents).toEqual([{ kind: "next" }]);
    expect(current).toEqual(identity(2));
  });

  it("dispose hard-cancels traversal and skips origin restoration", async () => {
    let current = identity(1);
    let navigationCalls = 0;
    let navigationStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      navigationStarted = resolve;
    });
    const navigation = {
      navigate(
        _intent: NavigationIntent,
        _timeoutMs?: number,
        signal?: AbortSignal,
      ) {
        navigationCalls += 1;
        current = identity(2);
        navigationStarted?.();
        return new Promise<never>((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new Error("navigation:aborted")),
            { once: true },
          );
        });
      },
    } as unknown as NavigationCoordinator;
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => current,
        questionOptions: () => null,
      },
      navigation,
      {
        saveQuestion: async () => undefined,
        saveSnapshot: async () => undefined,
      },
    );

    const traversal = indexer.controlledTraversal();
    await started;
    indexer.dispose();

    await expect(traversal).resolves.toMatchObject({ completeness: "partial" });
    expect(navigationCalls).toBe(1);
    expect(current).toEqual(identity(2));
  });

  it("pauses between verified native navigation steps and resumes", async () => {
    const fixture = setup();
    const traversal = fixture.indexer.controlledTraversal();
    await waitFor(() => fixture.calls() === 1);

    expect(fixture.indexer.pause()).toBe(true);
    fixture.releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fixture.calls()).toBe(1);

    expect(fixture.indexer.resume()).toBe(true);
    const snapshot = await traversal;
    expect(snapshot.completeness).toBe("complete");
    expect(snapshot.orderedQuestionIds).toEqual(["q-1", "q-2", "q-3"]);
    expect(fixture.current().questionId).toBe("q-1");
  });

  it("cancels a paused traversal, restores origin, and keeps a partial snapshot", async () => {
    const fixture = setup();
    const traversal = fixture.indexer.controlledTraversal();
    await waitFor(() => fixture.calls() === 1);

    fixture.indexer.pause();
    fixture.releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fixture.indexer.cancel()).toBe(true);

    const snapshot = await traversal;
    expect(snapshot.completeness).toBe("partial");
    expect(snapshot.checkpointPosition).toBe(2);
    expect(fixture.current().questionId).toBe("q-1");
    expect(fixture.savedSnapshots.at(-1)?.completeness).toBe("partial");
  });

  it("merges persisted partial questions when a resumed traversal is cancelled", async () => {
    const fixture = setup([identity(3)]);
    const traversal = fixture.indexer.controlledTraversal();
    await waitFor(() => fixture.calls() === 1);

    fixture.indexer.pause();
    fixture.releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.indexer.cancel();

    const snapshot = await traversal;
    expect(snapshot.completeness).toBe("partial");
    expect(snapshot.orderedQuestionIds).toEqual(["q-1", "q-2", "q-3"]);
    expect(snapshot.checkpointPosition).toBe(2);
  });

  it("finishes a fully covered persisted checkpoint without replaying known pages", async () => {
    const fixture = setup([identity(2), identity(3)]);

    const snapshot = await fixture.indexer.controlledTraversal();

    expect(snapshot.completeness).toBe("complete");
    expect(snapshot.orderedQuestionIds).toEqual(["q-1", "q-2", "q-3"]);
    expect(fixture.calls()).toBe(0);
  });

  it("restores the origin with one verified direct selection when supported", async () => {
    let current = identity(1);
    const intents: NavigationIntent[] = [];
    const savedQuestions: string[] = [];
    const site = {
      readIdentity: () => current,
      questionOptions: () => null,
      supportsDirectSelection: () => true,
    } as IndexSitePort & { supportsDirectSelection(): boolean };
    const navigation = {
      async navigate(intent: NavigationIntent) {
        intents.push(intent);
        const position =
          intent.kind === "select"
            ? intent.position
            : current.position + (intent.kind === "next" ? 1 : -1);
        current = identity(position);
        return { identity: current, epoch: intents.length };
      },
    } as NavigationCoordinator;
    const indexer = new QuestionIndexer(site, navigation, {
      saveQuestion: async (question) => {
        savedQuestions.push(question.questionId);
      },
      saveSnapshot: async () => undefined,
    });

    const snapshot = await indexer.controlledTraversal();

    expect(snapshot.completeness).toBe("complete");
    expect(current).toEqual(identity(1));
    expect(intents).toEqual([
      { kind: "select", position: 2 },
      { kind: "select", position: 3 },
      { kind: "select", position: 1, expectedQuestionId: "q-1" },
    ]);
    expect(savedQuestions.at(-1)).toBe("q-1");
  });

  it("rejects a direct restore whose returned identity differs from the origin", async () => {
    let current = identity(1);
    const site = {
      readIdentity: () => current,
      questionOptions: () => null,
      supportsDirectSelection: () => true,
    } as IndexSitePort & { supportsDirectSelection(): boolean };
    const navigation = {
      async navigate(intent: NavigationIntent) {
        if (intent.kind === "select") {
          current = {
            ...identity(intent.position),
            predictionEdition: "wrong-edition",
          };
        } else {
          current = identity(
            current.position + (intent.kind === "next" ? 1 : -1),
          );
        }
        return { identity: current, epoch: 1 };
      },
    } as NavigationCoordinator;
    const indexer = new QuestionIndexer(site, navigation, {
      saveQuestion: async () => undefined,
      saveSnapshot: async () => undefined,
    });

    const snapshot = await indexer.controlledTraversal();

    expect(snapshot.completeness).toBe("partial");
    expect(indexer.failureReason).toBe("index:restore-mismatch");
  });

  it("direct-selects every missing position from a middle origin and checkpoints each result", async () => {
    let current = identity(3, 5);
    const intents: NavigationIntent[] = [];
    const savedQuestions: number[] = [];
    const checkpointPositions: Array<number | undefined> = [];
    const site = {
      readIdentity: () => current,
      questionOptions: () => null,
      supportsDirectSelection: () => true,
    } as IndexSitePort & { supportsDirectSelection(): boolean };
    const navigation = {
      async navigate(intent: NavigationIntent) {
        intents.push(intent);
        const position =
          intent.kind === "select"
            ? intent.position
            : current.position + (intent.kind === "next" ? 1 : -1);
        current = identity(position, 5);
        return { identity: current, epoch: intents.length };
      },
    } as NavigationCoordinator;
    const indexer = new QuestionIndexer(site, navigation, {
      saveQuestion: async (question) => {
        savedQuestions.push(question.sitePosition);
      },
      saveSnapshot: async (snapshot) => {
        checkpointPositions.push(snapshot.checkpointPosition);
      },
    });

    const snapshot = await indexer.controlledTraversal();

    expect(snapshot.completeness).toBe("complete");
    expect(current).toEqual(identity(3, 5));
    expect(intents).toEqual([
      { kind: "select", position: 1 },
      { kind: "select", position: 2 },
      { kind: "select", position: 4 },
      { kind: "select", position: 5 },
      { kind: "select", position: 3, expectedQuestionId: "q-3" },
    ]);
    expect(savedQuestions).toEqual([3, 1, 2, 4, 5, 3]);
    expect(checkpointPositions.slice(0, 4)).toEqual([1, 2, 4, 5]);
  });

  it("keeps step navigation when direct selection is unsupported", async () => {
    let current = identity(2);
    const intents: NavigationIntent[] = [];
    const navigation = {
      async navigate(intent: NavigationIntent) {
        intents.push(intent);
        if (intent.kind === "select") throw new Error("unexpected-select");
        current = identity(
          current.position + (intent.kind === "next" ? 1 : -1),
        );
        return { identity: current, epoch: intents.length };
      },
    } as NavigationCoordinator;
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => current,
        questionOptions: () => null,
      },
      navigation,
      {
        saveQuestion: async () => undefined,
        saveSnapshot: async () => undefined,
      },
    );

    const snapshot = await indexer.controlledTraversal();

    expect(snapshot.completeness).toBe("complete");
    expect(current).toEqual(identity(2));
    expect(intents.every((intent) => intent.kind !== "select")).toBe(true);
  });

  it("can pause and cancel a structured selector index while checkpoints are saving", async () => {
    let saveCalls = 0;
    let releaseSave: (() => void) | undefined;
    const firstSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    const snapshots: Array<"complete" | "partial"> = [];
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => identity(1),
        questionOptions: () => [identity(1), identity(2), identity(3)],
      },
      {} as NavigationCoordinator,
      {
        saveQuestion: async () => {
          saveCalls += 1;
          if (saveCalls === 1) await firstSave;
        },
        saveSnapshot: async (snapshot) => {
          snapshots.push(snapshot.completeness);
        },
      },
    );
    const traversal = indexer.controlledTraversal();
    await waitFor(() => saveCalls === 1);

    expect(indexer.pause()).toBe(true);
    expect(indexer.cancel()).toBe(true);
    releaseSave?.();

    const snapshot = await traversal;
    expect(snapshot.completeness).toBe("partial");
    expect(snapshot.orderedQuestionIds).toEqual(["q-1"]);
    expect(snapshots.at(-1)).toBe("partial");
  });

  it("treats cancel before the first structured checkpoint as a safe partial result", async () => {
    let releaseStart: (() => void) | undefined;
    const startGate = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => identity(1),
        questionOptions: () => [identity(1), identity(2), identity(3)],
      },
      {} as NavigationCoordinator,
      {
        saveQuestion: async () => undefined,
        saveSnapshot: async () => undefined,
      },
    );

    const traversal = indexer.controlledTraversal(startGate);
    expect(indexer.cancel()).toBe(true);
    releaseStart?.();

    await expect(traversal).resolves.toMatchObject({
      completeness: "partial",
      orderedQuestionIds: ["q-1"],
    });
  });

  it("does not wait for a permanently pending preflight after cancellation", async () => {
    const neverFinishes = new Promise<void>(() => undefined);
    const indexer = new QuestionIndexer(
      {
        readIdentity: () => identity(1),
        questionOptions: () => [identity(1), identity(2), identity(3)],
      },
      {} as NavigationCoordinator,
      {
        saveQuestion: async () => undefined,
        saveSnapshot: async () => undefined,
      },
    );

    const traversal = indexer.controlledTraversal(neverFinishes);
    expect(indexer.cancel()).toBe(true);

    await expect(traversal).resolves.toMatchObject({
      completeness: "partial",
      orderedQuestionIds: ["q-1"],
    });
  });
});
