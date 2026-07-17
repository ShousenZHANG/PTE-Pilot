import { describe, expect, it, vi } from "vitest";

describe("PracticeController operation context", () => {
  it("persists a verified bootstrap as one complete runtime index", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    const RuntimeIndexCheckpoints = module.RuntimeIndexCheckpoints as new (
      runtime: unknown,
    ) => {
      adoptBootstrap(result: unknown): Promise<void>;
      hasCompleteEdition(edition: string, total: number): boolean;
      isCompleteFor(identity: unknown): boolean;
    };
    const saveIndexSnapshot = vi.fn(async () => undefined);
    const checkpoints = new RuntimeIndexCheckpoints({ saveIndexSnapshot });
    const edition = "yc-set-3-0123456789abcdef";
    const questions = [1, 2, 3].map((position) => ({
      predictionEdition: edition,
      questionId: `q-${position}`,
      sitePosition: position,
      siteTotal: 3,
      tags: [],
      discoveredAt: new Date(0).toISOString(),
      schemaVersion: 1,
    }));
    const snapshot = {
      predictionEdition: edition,
      orderedQuestionIds: ["q-1", "q-2", "q-3"],
      siteTotal: 3,
      completeness: "complete" as const,
      schemaVersion: 1,
    };

    await checkpoints.adoptBootstrap({ edition, snapshot, questions });

    expect(saveIndexSnapshot).toHaveBeenCalledOnce();
    expect(saveIndexSnapshot).toHaveBeenCalledWith(snapshot, questions);
    expect(checkpoints.hasCompleteEdition(edition, 3)).toBe(true);
    expect(
      checkpoints.isCompleteFor({
        predictionEdition: edition,
        questionId: "q-2",
        position: 2,
        total: 3,
        tags: [],
      }),
    ).toBe(true);
  });

  it("starts an in-memory session for the exact missing set identity diagnostic", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    expect(module.predictionEditionStartupMode).toBeTypeOf("function");
    const startupMode = module.predictionEditionStartupMode as (
      probe: unknown,
    ) => "verified" | "session" | "reject";

    expect(
      startupMode({
        ok: false,
        diagnostic: {
          code: "INVALID_QUESTION",
          detail: "question:prediction-edition-unverified",
        },
      }),
    ).toBe("session");
    for (const detail of [
      "question:prediction-edition-ambiguous",
      "question:prediction-total-changed",
      "input:missing",
    ]) {
      expect(
        startupMode({
          ok: false,
          diagnostic: { code: "SITE_CHANGED", detail },
        }),
      ).toBe("reject");
    }
    expect(startupMode({ ok: true })).toBe("verified");
  });

  it("allows persistence only for non-session prediction editions", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    expect(module.canPersistPredictionEdition).toBeTypeOf("function");
    const canPersist = module.canPersistPredictionEdition as (
      edition: string,
    ) => boolean;

    expect(canPersist("session:current-tab-token")).toBe(false);
    expect(canPersist("provisional:bootstrap-token")).toBe(false);
    expect(canPersist("yc-set-192-0123456789abcdef")).toBe(true);
    expect(canPersist("weekly-2026-W29")).toBe(true);
  });

  it("keeps incrementally visited session questions in memory", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    expect(module.SessionIndexCheckpoints).toBeTypeOf("function");
    const SessionIndexCheckpoints =
      module.SessionIndexCheckpoints as new () => {
        saveQuestion(question: unknown): Promise<void>;
        saveSnapshot(snapshot: unknown): Promise<void>;
        resumeQuestions(): Array<{ questionId: string }>;
        readonly snapshot: { orderedQuestionIds: string[] } | null;
      };
    const checkpoints = new SessionIndexCheckpoints();
    const question = (position: number) => ({
      predictionEdition: "session:tab-token",
      questionId: `q-${position}`,
      sitePosition: position,
      siteTotal: 3,
      tags: [],
      discoveredAt: new Date(0).toISOString(),
      schemaVersion: 1,
    });
    const partial = (position: number) => ({
      predictionEdition: "session:tab-token",
      orderedQuestionIds: [`q-${position}`],
      siteTotal: 3,
      completeness: "partial" as const,
      checkpointPosition: position,
      schemaVersion: 1,
    });

    await checkpoints.saveQuestion(question(2));
    await checkpoints.saveSnapshot(partial(2));
    await checkpoints.saveQuestion(question(1));
    await checkpoints.saveSnapshot(partial(1));

    expect(
      checkpoints.resumeQuestions().map((item) => item.questionId),
    ).toEqual(["q-1", "q-2"]);
    expect(checkpoints.snapshot?.orderedQuestionIds).toEqual(["q-1", "q-2"]);
  });

  it("invalidates redo completion when identity, epoch, or generation changes", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    expect(module.isSameControllerOperation).toBeTypeOf("function");
    const isSameControllerOperation = module.isSameControllerOperation as (
      captured: {
        predictionEdition: string;
        questionId: string;
        position: number;
        total: number;
        navigationEpoch: number;
        initializeGeneration: number;
      },
      current: {
        predictionEdition: string | undefined;
        questionId: string | undefined;
        position: number | undefined;
        total: number | undefined;
        navigationEpoch: number;
        initializeGeneration: number;
      },
    ) => boolean;
    const captured = {
      predictionEdition: "weekly-2026-W29",
      questionId: "131020",
      position: 12,
      total: 192,
      navigationEpoch: 4,
      initializeGeneration: 2,
    };

    expect(isSameControllerOperation(captured, captured)).toBe(true);
    expect(
      isSameControllerOperation(captured, {
        ...captured,
        questionId: "131021",
      }),
    ).toBe(false);
    expect(
      isSameControllerOperation(captured, {
        ...captured,
        position: 13,
      }),
    ).toBe(false);
    expect(
      isSameControllerOperation(captured, {
        ...captured,
        navigationEpoch: 5,
      }),
    ).toBe(false);
    expect(
      isSameControllerOperation(captured, {
        ...captured,
        initializeGeneration: 3,
      }),
    ).toBe(false);
  });

  it("drops an old redo timeout after its controller context becomes stale", async () => {
    const module = (await import("./practice-controller")) as unknown as Record<
      string,
      unknown
    >;
    expect(module.runGuardedControllerOperation).toBeTypeOf("function");
    const runGuardedControllerOperation =
      module.runGuardedControllerOperation as (options: {
        run: () => Promise<void>;
        isCurrent: () => boolean;
        onSuccess: () => void;
        onError: (error: unknown) => void;
      }) => Promise<void>;
    let rejectRedo: ((error: Error) => void) | undefined;
    let current = true;
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const redo = runGuardedControllerOperation({
      run: () =>
        new Promise<void>((_resolve, reject) => {
          rejectRedo = reject;
        }),
      isCurrent: () => current,
      onSuccess,
      onError,
    });

    current = false;
    rejectRedo?.(new Error("operation:timeout"));
    await redo;

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
