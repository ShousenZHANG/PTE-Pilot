import { describe, expect, test, vi } from "vitest";
import type { AudioCaptureBrowserApi } from "./audio-capture";
import { startAudioCaptureBackground } from "./audio-capture";

const TOKEN = "2cf34580-06e8-49cb-bd20-ab88ba7f5d0f";
const binding = {
  questionId: "q-1",
  navigationEpoch: 3,
  captureToken: TOKEN,
};

function createBrowser() {
  const messageListeners = new Set<
    (raw: unknown, sender: unknown) => unknown
  >();
  const beforeListeners = new Set<(details: unknown) => unknown>();
  const headerListeners = new Set<(details: unknown) => unknown>();
  const sent: unknown[] = [];
  const browserApi = {
    runtime: {
      id: "extension-id",
      onMessage: {
        addListener: (listener: (raw: unknown, sender: unknown) => unknown) =>
          messageListeners.add(listener),
        removeListener: (
          listener: (raw: unknown, sender: unknown) => unknown,
        ) => messageListeners.delete(listener),
      },
    },
    webRequest: {
      onBeforeRequest: {
        addListener: (listener: (details: unknown) => unknown) =>
          beforeListeners.add(listener),
        removeListener: (listener: (details: unknown) => unknown) =>
          beforeListeners.delete(listener),
      },
      onHeadersReceived: {
        addListener: (listener: (details: unknown) => unknown) =>
          headerListeners.add(listener),
        removeListener: (listener: (details: unknown) => unknown) =>
          headerListeners.delete(listener),
      },
    },
    tabs: {
      sendMessage: vi.fn(async (_tabId: number, message: unknown) => {
        sent.push(message);
      }),
    },
  } as unknown as AudioCaptureBrowserApi;
  return {
    browserApi,
    sent,
    message: (raw: unknown, url = trustedUrl()) =>
      [...messageListeners][0]?.(raw, {
        id: "extension-id",
        tab: { id: 7 },
        url,
      }),
    before: (details: unknown) => [...beforeListeners][0]?.(details),
    headers: (details: unknown) => [...headerListeners][0]?.(details),
  };
}

function trustedUrl() {
  return "https://www.fireflyau.com/ptehome/exercise?pageSource=yc";
}

function begin(armedAt = 1_000) {
  return {
    requestId: "f9daaee0-fadc-4491-a9ca-74e040a0168c",
    action: "audio/captureBegin",
    binding,
    armedAt,
  };
}

describe("Firefly audio capture background", () => {
  test("accepts the live exercise sender after pageSource is stripped", async () => {
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);

    await expect(
      harness.message(begin(), "https://www.fireflyau.com/ptehome/exercise"),
    ).resolves.toMatchObject({ ok: true, action: "audio/captureBegin" });

    stop();
  });

  test("requires exact weekly-prediction sender URL", async () => {
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);

    await expect(
      harness.message(
        begin(),
        "https://www.fireflyau.com/ptehome/exercise?pageSource=other",
      ),
    ).resolves.toMatchObject({ ok: false, reason: "untrusted-sender" });

    stop();
  });

  test.each([
    "https://www.fireflyau.com/ptehome/exercise?pageSource=",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=other",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=yc",
    "http://www.fireflyau.com/ptehome/exercise?pageSource=yc",
    "https://www.fireflyau.com:444/ptehome/exercise?pageSource=yc",
    "https://evil.fireflyau.com/ptehome/exercise?pageSource=yc",
    "https://www.fireflyau.com/ptehome/other?pageSource=yc",
  ])("rejects untrusted audio sender URL %s", async (url) => {
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);

    await expect(harness.message(begin(), url)).resolves.toMatchObject({
      ok: false,
      reason: "untrusted-sender",
    });

    stop();
  });

  test("binds at request start and emits one redacted exact observation", async () => {
    vi.useFakeTimers();
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);
    await harness.message(begin());

    harness.before({
      tabId: 7,
      requestId: "media-1",
      url: "https://upload.fireflyau.com/wfd/secret.mp3",
      timeStamp: 1_001,
      type: "media",
    });
    harness.headers({
      tabId: 7,
      requestId: "media-1",
      url: "https://upload.fireflyau.com/wfd/secret.mp3",
      timeStamp: 1_010,
      statusCode: 206,
      responseHeaders: [{ name: "content-type", value: "audio/mpeg" }],
    });
    await vi.advanceTimersByTimeAsync(250);

    expect(harness.sent).toEqual([
      {
        action: "audio/captureResult",
        binding,
        armedAt: 1_000,
        startedAt: 1_001,
        status: "unique",
        candidateCount: 1,
      },
    ]);
    expect(JSON.stringify(harness.sent)).not.toContain("secret.mp3");

    stop();
    vi.useRealTimers();
  });

  test("rejects requests that started before arm and reports zero candidates", async () => {
    vi.useFakeTimers();
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);
    await harness.message(begin());

    harness.before({
      tabId: 7,
      requestId: "old-media",
      url: "https://upload.fireflyau.com/wfd/old.mp3",
      timeStamp: 999,
      type: "media",
    });
    harness.headers({
      tabId: 7,
      requestId: "old-media",
      url: "https://upload.fireflyau.com/wfd/old.mp3",
      timeStamp: 1_010,
      statusCode: 200,
      responseHeaders: [{ name: "content-type", value: "audio/mpeg" }],
    });
    await vi.advanceTimersByTimeAsync(4_000);

    expect(harness.sent).toEqual([
      expect.objectContaining({
        binding,
        status: "missing",
        candidateCount: 0,
        startedAt: null,
      }),
    ]);

    stop();
    vi.useRealTimers();
  });

  test("exact cancel cannot disarm another question binding", async () => {
    vi.useFakeTimers();
    const harness = createBrowser();
    const stop = startAudioCaptureBackground(harness.browserApi);
    await harness.message(begin());
    await harness.message({
      requestId: "9ee6ddc2-2db8-410b-8455-65d9667431df",
      action: "audio/captureCancel",
      binding: { ...binding, questionId: "q-2" },
    });

    harness.before({
      tabId: 7,
      requestId: "media-1",
      url: "https://upload.fireflyau.com/wfd/secret.mp3",
      timeStamp: 1_001,
      type: "media",
    });
    harness.headers({
      tabId: 7,
      requestId: "media-1",
      url: "https://upload.fireflyau.com/wfd/secret.mp3",
      timeStamp: 1_010,
      statusCode: 200,
      responseHeaders: [{ name: "content-type", value: "audio/mpeg" }],
    });
    await vi.advanceTimersByTimeAsync(250);

    expect(harness.sent).toHaveLength(1);
    stop();
    vi.useRealTimers();
  });
});
