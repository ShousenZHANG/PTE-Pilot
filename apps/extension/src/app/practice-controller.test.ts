import { describe, expect, it, vi } from "vitest";

describe("PracticeController operation context", () => {
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
