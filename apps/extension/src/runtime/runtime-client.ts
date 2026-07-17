import {
  type AttemptEvent,
  type DraftCheckpoint,
  type IndexedQuestion,
  type IndexSnapshot,
  type RankCandidateSnapshot,
  type RestoredSession,
  type RuntimeRequest,
  RuntimeRequestSchema,
  type RuntimeResponse,
  RuntimeResponseSchema,
  type UserSettings,
  type WordStatSummary,
} from "@pte-pilot/contracts";
import type { AudioBindingKey } from "../domain/types";
import {
  type AudioCaptureEvent,
  AudioCaptureEventSchema,
  type AudioCaptureHandle,
  AudioCaptureResponseSchema,
} from "./audio-messages";

type RuntimeAction = RuntimeRequest["action"];

export class RuntimeClient {
  readonly #audioCaptureTimeoutMs: number;
  readonly #audioWaiters = new Map<string, { fail(error: Error): void }>();

  constructor(audioCaptureTimeoutMs = 4_500) {
    this.#audioCaptureTimeoutMs = audioCaptureTimeoutMs;
  }

  async loadDraft(
    predictionEdition: string,
    questionId: string,
  ): Promise<DraftCheckpoint | null> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadDraft",
      predictionEdition,
      questionId,
    });
    return assertAction(response, "storage/loadDraft").draft;
  }

  async saveDraft(draft: DraftCheckpoint): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveDraft",
      draft,
    });
  }

  async commitAttempt(
    predictionEdition: string,
    attempt: AttemptEvent,
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/commitAttempt",
      predictionEdition,
      attempt,
    });
  }

  async setMarked(
    predictionEdition: string,
    questionId: string,
    marked: boolean,
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/setMarked",
      predictionEdition,
      questionId,
      marked,
    });
  }

  async saveSession(question: {
    predictionEdition: string;
    questionId: string;
    position: number;
    total: number;
  }): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveSession",
      question,
    });
  }

  async restoreSession(): Promise<RestoredSession> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/restoreSession",
    });
    return assertAction(response, "storage/restoreSession").session;
  }

  async saveIndexSnapshot(
    snapshot: IndexSnapshot,
    questions: IndexedQuestion[],
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveIndexSnapshot",
      snapshot,
      questions,
    });
  }

  async loadIndexSnapshot(
    predictionEdition: string,
  ): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadIndexSnapshot",
      predictionEdition,
    });
    const result = assertAction(response, "storage/loadIndexSnapshot");
    return { snapshot: result.snapshot, questions: result.questions };
  }

  async getRankCandidates(
    predictionEdition: string,
    questionIds: string[],
  ): Promise<RankCandidateSnapshot> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/getRankCandidates",
      predictionEdition,
      questionIds,
    });
    return assertAction(response, "storage/getRankCandidates").snapshot;
  }

  async loadSettings(): Promise<UserSettings | null> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadSettings",
    });
    return assertAction(response, "storage/loadSettings").settings;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveSettings",
      settings,
    });
  }

  async listWordStats(limit = 200): Promise<WordStatSummary[]> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/listWordStats",
      limit,
    });
    return assertAction(response, "storage/listWordStats").words;
  }

  async beginAudioCapture(
    binding: AudioBindingKey,
    armedAt = Date.now(),
  ): Promise<AudioCaptureHandle> {
    const observation = this.waitForAudioCapture(binding);
    const request = {
      requestId: crypto.randomUUID(),
      action: "audio/captureBegin" as const,
      binding,
      armedAt,
    };
    try {
      const raw = await browser.runtime.sendMessage(request);
      const response = AudioCaptureResponseSchema.parse(raw);
      if (
        !response.ok ||
        response.action !== request.action ||
        response.requestId !== request.requestId
      ) {
        throw new Error(`audio:capture-begin:${response.reason ?? "failed"}`);
      }
    } catch (error) {
      this.#audioWaiters
        .get(binding.captureToken)
        ?.fail(asError(error, "audio:capture-begin:failed"));
      void observation.catch(() => undefined);
      throw error;
    }
    return { armedAt, observation };
  }

  async cancelAudioCapture(binding: AudioBindingKey): Promise<void> {
    this.#audioWaiters
      .get(binding.captureToken)
      ?.fail(new Error("audio:capture-cancelled"));
    const request = {
      requestId: crypto.randomUUID(),
      action: "audio/captureCancel" as const,
      binding,
    };
    const raw = await browser.runtime.sendMessage(request);
    const response = AudioCaptureResponseSchema.parse(raw);
    if (
      !response.ok ||
      response.action !== request.action ||
      response.requestId !== request.requestId
    ) {
      throw new Error(`audio:capture-cancel:${response.reason ?? "failed"}`);
    }
  }

  private waitForAudioCapture(
    binding: AudioBindingKey,
  ): Promise<AudioCaptureEvent> {
    this.#audioWaiters
      .get(binding.captureToken)
      ?.fail(new Error("audio:capture-superseded"));
    return new Promise<AudioCaptureEvent>((resolve, reject) => {
      const listener = (raw: unknown) => {
        const parsed = AudioCaptureEventSchema.safeParse(raw);
        if (
          !parsed.success ||
          !sameAudioBinding(parsed.data.binding, binding)
        ) {
          return undefined;
        }
        cleanup();
        resolve(parsed.data);
        return undefined;
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("audio:capture-timeout"));
      }, this.#audioCaptureTimeoutMs);
      const cleanup = () => {
        clearTimeout(timer);
        browser.runtime.onMessage.removeListener(listener);
        if (this.#audioWaiters.get(binding.captureToken)?.fail === fail) {
          this.#audioWaiters.delete(binding.captureToken);
        }
      };
      const fail = (error: Error) => {
        cleanup();
        reject(error);
      };
      this.#audioWaiters.set(binding.captureToken, { fail });
      browser.runtime.onMessage.addListener(listener);
    });
  }

  private async send(request: RuntimeRequest): Promise<RuntimeResponse> {
    const parsed = RuntimeRequestSchema.parse(request);
    const raw = await browser.runtime.sendMessage(parsed);
    const response = RuntimeResponseSchema.parse(raw);
    if (
      response.requestId !== parsed.requestId ||
      response.action !== parsed.action
    ) {
      throw new Error("runtime:response-mismatch");
    }
    if (!response.ok) throw new Error(`runtime:${response.reason}`);
    return response;
  }
}

function sameAudioBinding(
  left: AudioBindingKey,
  right: AudioBindingKey,
): boolean {
  return (
    left.captureToken === right.captureToken &&
    left.questionId === right.questionId &&
    left.navigationEpoch === right.navigationEpoch
  );
}

function asError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

function assertAction<A extends RuntimeAction>(
  response: RuntimeResponse,
  action: A,
): Extract<RuntimeResponse, { ok: true; action: A }> {
  if (!response.ok || response.action !== action)
    throw new Error("runtime:action-mismatch");
  return response as Extract<RuntimeResponse, { ok: true; action: A }>;
}
