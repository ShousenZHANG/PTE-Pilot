import { AudioBindingKeySchema } from "@pte-pilot/contracts";
import { describe, expect, test, vi } from "vitest";
import type { AudioCaptureEvent } from "../runtime/audio-messages";
import {
  AudioBroker,
  type AudioCaptureHandle,
  type AudioCapturePort,
  type AudioSitePort,
} from "./audio-broker";

const TOKEN = "2cf34580-06e8-49cb-bd20-ab88ba7f5d0f";

function binding(
  overrides: {
    questionId?: string;
    navigationEpoch?: number;
    captureToken?: string;
  } = {},
) {
  return AudioBindingKeySchema.parse({
    questionId: "q-1",
    navigationEpoch: 3,
    captureToken: TOKEN,
    ...overrides,
  });
}

function event(overrides: Partial<AudioCaptureEvent> = {}): AudioCaptureEvent {
  return {
    action: "audio/captureResult",
    binding: binding(),
    armedAt: 1_000,
    startedAt: 1_001,
    status: "unique",
    candidateCount: 1,
    ...overrides,
  } as AudioCaptureEvent;
}

function setup(observation: AudioCaptureEvent | Promise<AudioCaptureEvent>) {
  const order: string[] = [];
  const questionId = "q-1";
  const site: AudioSitePort = {
    readIdentity: () => ({
      predictionEdition: "weekly-test",
      questionId,
      position: questionId === "q-1" ? 1 : 2,
      total: 2,
      tags: [],
    }),
    playAudio: vi.fn(() => {
      order.push("site:play");
    }),
    pauseAudio: vi.fn(() => {
      order.push("site:pause");
    }),
    restartAudio: vi.fn(() => {
      order.push("site:restart");
    }),
    visibleAudioElements: () => [],
  };
  const capture: AudioCapturePort = {
    begin: vi.fn(async (): Promise<AudioCaptureHandle> => {
      order.push("capture:arm");
      return { armedAt: 1_000, observation: Promise.resolve(observation) };
    }),
    cancel: vi.fn(async () => {
      order.push("capture:cancel");
    }),
  };
  const broker = new AudioBroker(site, capture, () => TOKEN);
  broker.bind("q-1", 3);
  return {
    broker,
    capture,
    order,
    site,
  };
}

describe("AudioBroker causal capture", () => {
  test("arms before native play and confirms PLAYING only after one exact candidate", async () => {
    let resolveObservation: ((value: AudioCaptureEvent) => void) | undefined;
    const pending = new Promise<AudioCaptureEvent>((resolve) => {
      resolveObservation = resolve;
    });
    const { broker, order } = setup(pending);
    expect(broker.state).toBe("EMPTY");

    const play = broker.play();
    await vi.waitFor(() =>
      expect(order.slice(0, 2)).toEqual(["capture:arm", "site:play"]),
    );
    expect(broker.state).toBe("RESOLVING");
    resolveObservation?.(event());
    await play;

    expect(broker.state).toBe("PLAYING");
  });

  test("coalesces rapid play commands into one causal capture", async () => {
    let resolveObservation: ((value: AudioCaptureEvent) => void) | undefined;
    const pending = new Promise<AudioCaptureEvent>((resolve) => {
      resolveObservation = resolve;
    });
    const { broker, capture, order } = setup(pending);

    const first = broker.play();
    const second = broker.play();
    await vi.waitFor(() =>
      expect(order.slice(0, 2)).toEqual(["capture:arm", "site:play"]),
    );
    expect(capture.begin).toHaveBeenCalledOnce();
    resolveObservation?.(event());
    await Promise.all([first, second]);

    expect(broker.state).toBe("PLAYING");
  });

  test("reuses the verified capture when replaying the same question", async () => {
    const { broker, capture, order } = setup(event());

    await broker.play();
    await broker.restart();

    expect(capture.begin).toHaveBeenCalledOnce();
    expect(order).toContain("site:restart");
    expect(broker.state).toBe("PLAYING");
  });

  test("fails closed when the verified site replay control fails", async () => {
    const { broker, site } = setup(event());
    await broker.play();
    vi.mocked(site.restartAudio).mockImplementation(() => {
      throw new Error("audio:restart:missing");
    });

    await expect(broker.restart()).rejects.toMatchObject({
      code: "AUDIO_ERROR",
      message: "audio:restart:missing",
    });
    expect(broker.state).toBe("AUDIO_ERROR");
  });

  test("requires a fresh causal capture after binding a new question", async () => {
    let questionId = "q-1";
    const site = {
      readIdentity: () => ({
        predictionEdition: "weekly-test",
        questionId,
        position: questionId === "q-1" ? 1 : 2,
        total: 2,
        tags: [],
      }),
      playAudio: vi.fn(),
      pauseAudio: vi.fn(),
      restartAudio: vi.fn(),
      visibleAudioElements: () => [],
    } satisfies AudioSitePort;
    const capture = {
      begin: vi.fn(async (activeBinding: ReturnType<typeof binding>) => ({
        armedAt: 1_000,
        observation: Promise.resolve(
          event({ binding: activeBinding, armedAt: 1_000 }),
        ),
      })),
      cancel: vi.fn(async () => undefined),
    } satisfies AudioCapturePort;
    const tokens = [TOKEN, "a498fe99-3875-491e-a102-11c7ed087909"];
    const broker = new AudioBroker(
      site,
      capture,
      () => tokens.shift() ?? TOKEN,
    );

    broker.bind("q-1", 3);
    await broker.play();
    questionId = "q-2";
    broker.bind("q-2", 4);
    await broker.play();

    expect(capture.begin).toHaveBeenCalledTimes(2);
  });

  test("exam replay refusal preserves the current playback state", async () => {
    const { broker } = setup(event());
    broker.setMode("exam");
    await broker.play();

    await expect(broker.restart()).rejects.toMatchObject({
      code: "AUDIO_ERROR",
      message: "audio:exam-play-consumed",
    });
    expect(broker.state).toBe("PLAYING");
  });

  test.each([
    [
      "zero candidates",
      event({ status: "missing", candidateCount: 0, startedAt: null }),
    ],
    ["multiple candidates", event({ status: "ambiguous", candidateCount: 2 })],
    [
      "old token",
      event({
        binding: binding({
          captureToken: "a498fe99-3875-491e-a102-11c7ed087909",
        }),
      }),
    ],
    ["wrong question", event({ binding: binding({ questionId: "q-2" }) })],
    [
      "wrong navigation epoch",
      event({ binding: binding({ navigationEpoch: 2 }) }),
    ],
    ["request started before arm", event({ startedAt: 999 })],
    ["wrong arm generation", event({ armedAt: 999 })],
  ])("fails closed for %s", async (_name, observation) => {
    const { broker, capture, order } = setup(observation);

    await expect(broker.play()).rejects.toMatchObject({ code: "AUDIO_ERROR" });

    expect(broker.state).toBe("AUDIO_ERROR");
    expect(capture.cancel).toHaveBeenCalledWith(binding());
    expect(order).toContain("site:pause");
  });

  test("fails closed when question changes while capture is resolving", async () => {
    let resolveObservation: ((value: AudioCaptureEvent) => void) | undefined;
    let questionId = "q-1";
    const pending = new Promise<AudioCaptureEvent>((resolve) => {
      resolveObservation = resolve;
    });
    const capture = {
      begin: async () => ({ armedAt: 1_000, observation: pending }),
      cancel: vi.fn(async () => undefined),
    } satisfies AudioCapturePort;
    const site = {
      readIdentity: () => ({
        predictionEdition: "weekly-test",
        questionId,
        position: questionId === "q-1" ? 1 : 2,
        total: 2,
        tags: [],
      }),
      playAudio: () => {
        questionId = "q-2";
      },
      pauseAudio: () => undefined,
      restartAudio: () => undefined,
      visibleAudioElements: () => [],
    } satisfies AudioSitePort;
    const active = new AudioBroker(site, capture, () => TOKEN);
    active.bind("q-1", 3);
    const play = active.play();
    await vi.waitFor(() => expect(questionId).toBe("q-2"));
    resolveObservation?.(event());

    await expect(play).rejects.toMatchObject({ code: "AUDIO_ERROR" });
    expect(active.state).toBe("AUDIO_ERROR");
  });

  test("a rejected old capture cannot pause or mark the newly bound question", async () => {
    let rejectObservation: ((error: Error) => void) | undefined;
    let questionId = "q-1";
    const clicks: string[] = [];
    const pending = new Promise<AudioCaptureEvent>((_resolve, reject) => {
      rejectObservation = reject;
    });
    const capture = {
      begin: async () => ({ armedAt: 1_000, observation: pending }),
      cancel: vi.fn(async () => undefined),
    } satisfies AudioCapturePort;
    const site = {
      readIdentity: () => ({
        predictionEdition: "weekly-test",
        questionId,
        position: questionId === "q-1" ? 1 : 2,
        total: 2,
        tags: [],
      }),
      playAudio: () => clicks.push("play"),
      pauseAudio: () => clicks.push("pause"),
      restartAudio: () => clicks.push("restart"),
      visibleAudioElements: () => [],
    } satisfies AudioSitePort;
    const tokens = [TOKEN, "a498fe99-3875-491e-a102-11c7ed087909"];
    const active = new AudioBroker(
      site,
      capture,
      () => tokens.shift() ?? TOKEN,
    );
    active.bind("q-1", 3);
    const oldPlay = active.play();
    await vi.waitFor(() => expect(clicks).toEqual(["play"]));

    questionId = "q-2";
    active.bind("q-2", 4);
    rejectObservation?.(new Error("old capture rejected"));

    await expect(oldPlay).rejects.toMatchObject({ code: "AUDIO_ERROR" });
    expect(active.state).toBe("EMPTY");
    expect(clicks).toEqual(["play"]);
  });
});
