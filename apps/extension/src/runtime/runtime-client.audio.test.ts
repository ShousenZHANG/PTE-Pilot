import { AudioBindingKeySchema } from "@pte-pilot/contracts";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { AudioCaptureEvent } from "./audio-messages";
import { RuntimeClient } from "./runtime-client";

const binding = AudioBindingKeySchema.parse({
  questionId: "q-1",
  navigationEpoch: 3,
  captureToken: "2cf34580-06e8-49cb-bd20-ab88ba7f5d0f",
});

afterEach(() => vi.unstubAllGlobals());

describe("RuntimeClient audio capture", () => {
  test("subscribes before ARM and delivers redacted capture result", async () => {
    const listeners = new Set<(raw: unknown) => unknown>();
    const sendMessage = vi.fn(async (request: Record<string, unknown>) => {
      expect(listeners.size).toBe(1);
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
      };
    });
    vi.stubGlobal("browser", {
      runtime: {
        sendMessage,
        onMessage: {
          addListener: (listener: (raw: unknown) => unknown) =>
            listeners.add(listener),
          removeListener: (listener: (raw: unknown) => unknown) =>
            listeners.delete(listener),
        },
      },
    });
    const client = new RuntimeClient(100);

    const handle = await client.beginAudioCapture(binding, 1_000);
    const observed: AudioCaptureEvent = {
      action: "audio/captureResult",
      binding,
      armedAt: 1_000,
      startedAt: 1_001,
      status: "unique",
      candidateCount: 1,
    };
    [...listeners][0]?.(observed);

    await expect(handle.observation).resolves.toEqual(observed);
    expect(listeners.size).toBe(0);
    expect(sendMessage).toHaveBeenCalledWith({
      requestId: expect.any(String),
      action: "audio/captureBegin",
      binding,
      armedAt: 1_000,
    });
  });

  test("ignores stale token event until exact result arrives", async () => {
    const listeners = new Set<(raw: unknown) => unknown>();
    vi.stubGlobal("browser", {
      runtime: {
        sendMessage: async (request: Record<string, unknown>) => ({
          requestId: request.requestId,
          ok: true,
          action: request.action,
        }),
        onMessage: {
          addListener: (listener: (raw: unknown) => unknown) =>
            listeners.add(listener),
          removeListener: (listener: (raw: unknown) => unknown) =>
            listeners.delete(listener),
        },
      },
    });
    const client = new RuntimeClient(100);
    const handle = await client.beginAudioCapture(binding, 1_000);
    [...listeners][0]?.({
      action: "audio/captureResult",
      binding: {
        ...binding,
        captureToken: "a498fe99-3875-491e-a102-11c7ed087909",
      },
      armedAt: 1_000,
      startedAt: 1_001,
      status: "unique",
      candidateCount: 1,
    });
    const exact = {
      action: "audio/captureResult",
      binding,
      armedAt: 1_000,
      startedAt: 1_001,
      status: "unique",
      candidateCount: 1,
    } as const;
    [...listeners][0]?.(exact);

    await expect(handle.observation).resolves.toEqual(exact);
  });
});
