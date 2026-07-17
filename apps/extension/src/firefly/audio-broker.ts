import type {
  AudioBindingKey,
  AudioState,
  PracticeMode,
  QuestionIdentity,
} from "../domain/types";
import type {
  AudioCaptureEvent,
  AudioCaptureHandle,
} from "../runtime/audio-messages";

export type { AudioCaptureHandle } from "../runtime/audio-messages";

export interface AudioSitePort {
  readIdentity(): QuestionIdentity;
  playAudio(): void;
  pauseAudio(): void;
  restartAudio(): void;
  visibleAudioElements(): HTMLAudioElement[];
}

export interface AudioCapturePort {
  begin(binding: AudioBindingKey): Promise<AudioCaptureHandle>;
  cancel(binding: AudioBindingKey): Promise<void>;
}

export class AudioBrokerError extends Error {
  readonly code = "AUDIO_ERROR" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AudioBrokerError";
  }
}

export class AudioBroker extends EventTarget {
  readonly #site: AudioSitePort;
  readonly #capture: AudioCapturePort;
  readonly #createToken: () => string;
  #binding: AudioBindingKey | null = null;
  #mode: PracticeMode = "practice";
  #state: AudioState = "EMPTY";
  #examStartConsumed = false;
  #captureVerified = false;
  #playOperation: Promise<void> | null = null;

  constructor(
    site: AudioSitePort,
    capture: AudioCapturePort,
    createToken: () => string = () => crypto.randomUUID(),
  ) {
    super();
    this.#site = site;
    this.#capture = capture;
    this.#createToken = createToken;
  }

  get state(): AudioState {
    return this.#state;
  }

  bind(questionId: string, navigationEpoch: number): void {
    if (this.#binding) void this.#capture.cancel(this.#binding);
    this.stopNativeAudio();
    this.#binding = {
      questionId,
      navigationEpoch,
      captureToken: this.#createToken(),
    };
    this.#examStartConsumed = false;
    this.#captureVerified = false;
    this.setState("EMPTY");
  }

  setMode(mode: PracticeMode): void {
    this.#mode = mode;
  }

  async play(): Promise<void> {
    if (this.#playOperation) return this.#playOperation;
    const operation = this.performPlay();
    this.#playOperation = operation;
    try {
      await operation;
    } finally {
      if (this.#playOperation === operation) this.#playOperation = null;
    }
  }

  private async performPlay(): Promise<void> {
    let binding: AudioBindingKey | null = null;
    try {
      binding = this.requireBinding();
      this.assertCurrent(binding);
      const native = this.#site.visibleAudioElements()[0];
      if (native && !native.paused) {
        native.pause();
        this.setState("PAUSED");
        return;
      }
      if (!native && this.#state === "PLAYING") {
        this.#site.pauseAudio();
        this.assertCurrent(binding);
        this.setState("PAUSED");
        return;
      }
      if (this.#mode === "exam" && this.#examStartConsumed) {
        throw new Error("audio:exam-play-consumed");
      }

      if (this.#captureVerified) {
        if (native?.paused) await native.play();
        else this.#site.playAudio();
        this.assertCurrent(binding);
        this.setState("PLAYING");
        return;
      }

      this.setState("RESOLVING");
      const handle = await this.#capture.begin(binding);
      this.assertCurrent(binding);
      if (native?.paused) await native.play();
      else this.#site.playAudio();
      const observation = await handle.observation;
      this.assertObservation(binding, handle, observation);
      this.assertCurrent(binding);
      this.#captureVerified = true;
      if (this.#mode === "exam") this.#examStartConsumed = true;
      this.setState("PLAYING");
    } catch (error) {
      if (binding) {
        await this.#capture.cancel(binding).catch(() => undefined);
      }
      if (binding && this.#binding === binding) {
        this.failClosedPlayback();
        this.setState("AUDIO_ERROR");
      }
      throw toAudioError(error);
    }
  }

  pause(): void {
    const binding = this.requireBinding();
    this.assertCurrent(binding);
    const native = this.#site.visibleAudioElements()[0];
    if (native && !native.paused) native.pause();
    else this.#site.pauseAudio();
    this.assertCurrent(binding);
    this.setState("PAUSED");
  }

  async restart(): Promise<void> {
    const binding = this.requireBinding();
    this.assertCurrent(binding);
    if (this.#mode === "exam" && this.#examStartConsumed) {
      throw new AudioBrokerError("audio:exam-play-consumed");
    }
    try {
      const native = this.#site.visibleAudioElements()[0];
      if (!this.#captureVerified) {
        if (native) {
          if (!native.paused) native.pause();
          native.currentTime = 0;
        }
        await this.play();
        return;
      }
      if (native) {
        if (!native.paused) native.pause();
        native.currentTime = 0;
        await native.play();
      } else {
        this.#site.restartAudio();
      }
      this.assertCurrent(binding);
      this.setState("PLAYING");
    } catch (error) {
      if (this.#binding === binding) {
        this.failClosedPlayback();
        this.setState("AUDIO_ERROR");
      }
      throw toAudioError(error);
    }
  }

  dispose(): void {
    this.invalidate();
  }

  invalidate(): void {
    if (this.#binding) void this.#capture.cancel(this.#binding);
    this.stopNativeAudio();
    this.#binding = null;
    this.#captureVerified = false;
    this.setState("EMPTY");
  }

  private requireBinding(): AudioBindingKey {
    if (!this.#binding) throw new Error("audio:not-bound");
    return this.#binding;
  }

  private assertCurrent(binding: AudioBindingKey): void {
    const current = this.#site.readIdentity();
    if (
      this.#binding !== binding ||
      current.questionId !== binding.questionId
    ) {
      throw new Error("audio:stale-binding");
    }
  }

  private assertObservation(
    binding: AudioBindingKey,
    handle: AudioCaptureHandle,
    observation: AudioCaptureEvent,
  ): void {
    if (
      observation.binding.captureToken !== binding.captureToken ||
      observation.binding.questionId !== binding.questionId ||
      observation.binding.navigationEpoch !== binding.navigationEpoch ||
      observation.armedAt !== handle.armedAt ||
      observation.status !== "unique" ||
      observation.candidateCount !== 1 ||
      observation.startedAt === null ||
      observation.startedAt < handle.armedAt
    ) {
      throw new Error("audio:capture-causal-mismatch");
    }
  }

  private stopNativeAudio(): void {
    for (const audio of this.#site.visibleAudioElements()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  private failClosedPlayback(): void {
    this.stopNativeAudio();
    try {
      this.#site.pauseAudio();
    } catch {
      // Native player may expose only an audio element. It is already stopped.
    }
  }

  private setState(state: AudioState): void {
    this.#state = state;
    this.dispatchEvent(new CustomEvent("statechange", { detail: state }));
  }
}

function toAudioError(error: unknown): AudioBrokerError {
  if (error instanceof AudioBrokerError) return error;
  const message = error instanceof Error ? error.message : "audio:unknown";
  return new AudioBrokerError(message, { cause: error });
}
