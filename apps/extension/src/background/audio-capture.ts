import type { AudioBindingKey } from "@pte-pilot/contracts";
import {
  type AudioCaptureEvent,
  AudioCaptureEventSchema,
  AudioCaptureRequestSchema,
} from "../runtime/audio-messages";

interface RuntimeSender {
  id?: string;
  url?: string;
  tab?: { id?: number };
}

interface RequestDetails {
  tabId: number;
  requestId: string;
  url: string;
  timeStamp: number;
  type: string;
}

interface HeaderDetails extends RequestDetails {
  statusCode: number;
  responseHeaders?: Array<{ name: string; value?: string }>;
}

type RuntimeListener = (
  raw: unknown,
  sender: RuntimeSender,
) => Promise<unknown> | undefined;
type BeforeRequestListener = (details: RequestDetails) => undefined;
type HeadersListener = (details: HeaderDetails) => undefined;

interface BrowserEvent<Listener> {
  addListener(
    listener: Listener,
    filter?: { urls: string[]; types?: string[] },
    extraInfoSpec?: string[],
  ): void;
  removeListener(listener: Listener): void;
}

export interface AudioCaptureBrowserApi {
  runtime: {
    id: string;
    onMessage: BrowserEvent<RuntimeListener>;
  };
  webRequest: {
    onBeforeRequest: BrowserEvent<BeforeRequestListener>;
    onHeadersReceived: BrowserEvent<HeadersListener>;
  };
  tabs: {
    sendMessage(tabId: number, message: AudioCaptureEvent): Promise<unknown>;
  };
}

interface CaptureSession {
  binding: AudioBindingKey;
  tabId: number;
  armedAt: number;
  candidates: Map<string, number>;
  reportTimer?: ReturnType<typeof setTimeout>;
}

interface BoundRequest {
  session: CaptureSession;
  startedAt: number;
  url: string;
}

const CAPTURE_WINDOW_MS = 4_000;
const SETTLE_WINDOW_MS = 250;
const MEDIA_TYPES = ["media", "xmlhttprequest", "other"];
const UPLOAD_PATTERN = "https://upload.fireflyau.com/*";

export function startAudioCaptureBackground(
  browserApi: AudioCaptureBrowserApi,
): () => void {
  const sessions = new Map<number, CaptureSession>();
  const requests = new Map<string, BoundRequest>();

  const clearSession = (session: CaptureSession) => {
    if (session.reportTimer) clearTimeout(session.reportTimer);
    if (sessions.get(session.tabId) === session) sessions.delete(session.tabId);
    for (const [requestId, request] of requests) {
      if (request.session === session) requests.delete(requestId);
    }
  };

  const report = async (session: CaptureSession): Promise<void> => {
    if (sessions.get(session.tabId) !== session) return;
    const starts = [...session.candidates.values()];
    const candidateCount = starts.length;
    const startedAt = candidateCount > 0 ? Math.min(...starts) : null;
    const status =
      candidateCount === 1
        ? "unique"
        : candidateCount === 0
          ? "missing"
          : "ambiguous";
    clearSession(session);
    const event = AudioCaptureEventSchema.parse({
      action: "audio/captureResult",
      binding: session.binding,
      armedAt: session.armedAt,
      startedAt,
      status,
      candidateCount,
    });
    await browserApi.tabs.sendMessage(session.tabId, event).catch(() => {
      // Content context may have navigated away. Capture stays fail closed.
    });
  };

  const onMessage: RuntimeListener = (raw, sender) => {
    const parsed = AudioCaptureRequestSchema.safeParse(raw);
    if (!parsed.success) return undefined;
    const request = parsed.data;
    const tabId = sender.tab?.id;
    if (
      !isTrustedSender(browserApi.runtime.id, sender) ||
      tabId === undefined
    ) {
      return Promise.resolve({
        requestId: request.requestId,
        ok: false,
        action: request.action,
        reason: "untrusted-sender",
      });
    }
    if (request.action === "audio/captureBegin") {
      const previous = sessions.get(tabId);
      if (previous) clearSession(previous);
      const session: CaptureSession = {
        binding: request.binding,
        tabId,
        armedAt: request.armedAt,
        candidates: new Map<string, number>(),
      };
      session.reportTimer = setTimeout(
        () => void report(session),
        CAPTURE_WINDOW_MS,
      );
      sessions.set(tabId, session);
    } else {
      const session = sessions.get(tabId);
      if (session && sameBinding(session.binding, request.binding)) {
        clearSession(session);
      }
    }
    return Promise.resolve({
      requestId: request.requestId,
      ok: true,
      action: request.action,
    });
  };

  const onBeforeRequest: BeforeRequestListener = (details) => {
    const session = sessions.get(details.tabId);
    if (
      !session ||
      details.timeStamp < session.armedAt ||
      !MEDIA_TYPES.includes(details.type) ||
      !isUploadUrl(details.url)
    ) {
      return undefined;
    }
    requests.set(details.requestId, {
      session,
      startedAt: details.timeStamp,
      url: details.url,
    });
    return undefined;
  };

  const onHeadersReceived: HeadersListener = (details) => {
    const request = requests.get(details.requestId);
    requests.delete(details.requestId);
    if (!request || sessions.get(details.tabId) !== request.session)
      return undefined;
    const contentType = details.responseHeaders
      ?.find((header) => header.name.toLowerCase() === "content-type")
      ?.value?.toLowerCase();
    if (
      details.statusCode < 200 ||
      details.statusCode >= 400 ||
      !contentType?.startsWith("audio/")
    ) {
      return undefined;
    }
    const previousStart = request.session.candidates.get(request.url);
    request.session.candidates.set(
      request.url,
      previousStart === undefined
        ? request.startedAt
        : Math.min(previousStart, request.startedAt),
    );
    if (request.session.reportTimer) clearTimeout(request.session.reportTimer);
    request.session.reportTimer = setTimeout(
      () => void report(request.session),
      SETTLE_WINDOW_MS,
    );
    return undefined;
  };

  browserApi.runtime.onMessage.addListener(onMessage);
  browserApi.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
    urls: [UPLOAD_PATTERN],
    types: MEDIA_TYPES,
  });
  browserApi.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    { urls: [UPLOAD_PATTERN], types: MEDIA_TYPES },
    ["responseHeaders"],
  );
  return () => {
    browserApi.runtime.onMessage.removeListener(onMessage);
    browserApi.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
    browserApi.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
    for (const session of sessions.values()) {
      if (session.reportTimer) clearTimeout(session.reportTimer);
    }
    sessions.clear();
    requests.clear();
  };
}

function sameBinding(left: AudioBindingKey, right: AudioBindingKey): boolean {
  return (
    left.captureToken === right.captureToken &&
    left.questionId === right.questionId &&
    left.navigationEpoch === right.navigationEpoch
  );
}

function isUploadUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.host === "upload.fireflyau.com";
  } catch {
    return false;
  }
}

function isTrustedSender(extensionId: string, sender: RuntimeSender): boolean {
  if (sender.id !== extensionId || !sender.url) return false;
  try {
    const url = new URL(sender.url);
    const pageSources = url.searchParams.getAll("pageSource");
    return (
      url.origin === "https://www.fireflyau.com" &&
      url.pathname === "/ptehome/exercise" &&
      pageSources.length === 1 &&
      pageSources[0] === "yc"
    );
  } catch {
    return false;
  }
}
