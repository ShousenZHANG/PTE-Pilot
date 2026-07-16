import { describe, expect, it } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import type { NavigationCoordinator } from "./navigation-coordinator";
import { QuestionIndexer } from "./question-indexer";

function identity(position: number): QuestionIdentity {
  return {
    predictionEdition: "weekly-2026-W29",
    questionId: `q-${position}`,
    position,
    total: 3,
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
