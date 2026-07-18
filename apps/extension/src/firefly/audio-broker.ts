import type { PracticeMode } from "../domain/types";
import type { BridgeAudioState, BridgeCommand } from "./audio-bridge";

export interface AudioSitePort {
  readQuestionIdFast(): string | null;
  siteAudioElements(): HTMLAudioElement[];
  playAudio(): void;
  pauseAudio(): void;
  audioBridgeAvailable?(): boolean;
  audioBridgeState?(): BridgeAudioState | null;
  audioBridgeCommand?(op: BridgeCommand): void;
  onAudioBridgeState?(listener: (state: BridgeAudioState) => void): () => void;
}

export interface AudioSnapshot {
  currentTime: number;
  duration: number;
  playing: boolean;
}

const HAVE_FUTURE_DATA = 3;

export class AudioBrokerError extends Error {
  readonly code = "AUDIO_ERROR" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AudioBrokerError";
  }
}

/*
 * Drives the Firefly question audio through the page's own <audio> element
 * whenever exactly one exists. Direct element control removes the site
 * player's start-up delay: play() begins immediately and a restart is a
 * currentTime reset instead of a UI round trip. Clicking the site's play
 * control remains as the fallback when no unique element is found.
 */
export class AudioBroker extends EventTarget {
  readonly #site: AudioSitePort;
  #binding: { questionId: string; navigationEpoch: number } | null = null;
  #mode: PracticeMode = "practice";
  #state = "EMPTY";
  #examStartConsumed = false;
  #element: HTMLAudioElement | null = null;
  #detachElement: (() => void) | null = null;
  #detachBridge: (() => void) | null = null;

  constructor(site: AudioSitePort) {
    super();
    this.#site = site;
  }

  get state(): string {
    return this.#state;
  }

  bind(questionId: string, navigationEpoch: number): void {
    this.releaseElement();
    this.#detachBridge?.();
    this.#detachBridge = null;
    this.stopSiteAudio();
    this.#binding = { questionId, navigationEpoch };
    this.#examStartConsumed = false;
    this.setState("EMPTY");
    const binding = this.#binding;
    this.#detachBridge =
      this.#site.onAudioBridgeState?.((state) => {
        if (this.#binding !== binding || this.#element) return;
        this.applyBridgeState(state);
      }) ?? null;
    this.warmUp();
  }

  /*
   * State mirroring for the MAIN-world bridge path, where no element is
   * reachable and truth arrives as posted snapshots.
   */
  private applyBridgeState(state: BridgeAudioState): void {
    if (state.ended) {
      if (this.#state !== "EMPTY") this.setState("ENDED");
      return;
    }
    if (!state.paused) {
      this.setState(
        state.readyState < HAVE_FUTURE_DATA ? "BUFFERING" : "PLAYING",
      );
      return;
    }
    if (this.#state === "PLAYING" || this.#state === "BUFFERING")
      this.setState("PAUSED");
  }

  private bridgeUsable(): boolean {
    return this.#site.audioBridgeAvailable?.() ?? false;
  }

  /*
   * Ask the browser to buffer the whole clip once the question is bound.
   * Deliberately no load(): the site may still be swapping in the new
   * question's src, and forcing a load here races that swap, aborts
   * in-flight play() calls, and wipes the duration the progress readout
   * relies on. preload=auto is honoured when the site sets the new src.
   */
  private warmUp(): void {
    const element = this.adoptElement();
    if (element && element.preload !== "auto") element.preload = "auto";
  }

  setMode(mode: PracticeMode): void {
    this.#mode = mode;
  }

  /*
   * Idempotent and cheap; called repeatedly during the pre-play countdown
   * because the site often inserts the audio element some time after bind,
   * and a warm-up that ran too early would otherwise have missed it.
   */
  prewarm(): void {
    this.warmUp();
    if (!this.#element) {
      this.#site.audioBridgeCommand?.("prewarm");
      this.#site.audioBridgeCommand?.("query");
    }
  }

  snapshot(): AudioSnapshot | null {
    const element = this.#element;
    if (element && Number.isFinite(element.duration)) {
      return {
        currentTime: element.currentTime,
        duration: element.duration,
        playing: !element.paused && !element.ended,
      };
    }
    const bridged = this.#site.audioBridgeState?.();
    if (bridged && bridged.duration > 0) {
      return {
        currentTime: bridged.currentTime,
        duration: bridged.duration,
        playing: !bridged.paused && !bridged.ended,
      };
    }
    return null;
  }

  async play(): Promise<void> {
    const binding = this.requireBinding();
    try {
      this.assertCurrent(binding);
      const element = this.adoptElement();
      if (element) {
        if (!element.paused && !element.ended) {
          element.pause();
          this.setState("PAUSED");
          return;
        }
        this.assertExamPlayAvailable();
        if (element.readyState < HAVE_FUTURE_DATA) this.setState("BUFFERING");
        await element.play();
        this.assertCurrent(binding);
        if (this.#mode === "exam") this.#examStartConsumed = true;
        this.setState("PLAYING");
        return;
      }
      if (this.bridgeUsable()) {
        const bridged = this.#site.audioBridgeState?.();
        if (bridged && !bridged.paused && !bridged.ended) {
          this.#site.audioBridgeCommand?.("pause");
          this.setState("PAUSED");
          return;
        }
        this.assertExamPlayAvailable();
        this.#site.audioBridgeCommand?.("play");
        if (this.#mode === "exam") this.#examStartConsumed = true;
        this.setState(
          bridged && bridged.readyState >= HAVE_FUTURE_DATA
            ? "PLAYING"
            : "BUFFERING",
        );
        return;
      }
      if (this.#state === "PLAYING") {
        this.#site.pauseAudio();
        this.setState("PAUSED");
        return;
      }
      this.assertExamPlayAvailable();
      this.#site.playAudio();
      this.assertCurrent(binding);
      if (this.#mode === "exam") this.#examStartConsumed = true;
      this.setState("PLAYING");
    } catch (error) {
      if (this.handleBenignPlaybackError(binding, error)) return;
      this.failClosed(binding);
      throw toAudioError(error);
    }
  }

  async restart(): Promise<void> {
    const binding = this.requireBinding();
    try {
      this.assertCurrent(binding);
      if (this.#mode === "exam" && this.#examStartConsumed) {
        throw new AudioBrokerError("audio:exam-play-consumed");
      }
      const element = this.adoptElement();
      if (element) {
        element.currentTime = 0;
        if (element.paused || element.ended) {
          if (element.readyState < HAVE_FUTURE_DATA) this.setState("BUFFERING");
          await element.play();
        }
        this.assertCurrent(binding);
        if (this.#mode === "exam") this.#examStartConsumed = true;
        this.setState("PLAYING");
        return;
      }
      if (this.bridgeUsable()) {
        this.#site.audioBridgeCommand?.("restart");
        if (this.#mode === "exam") this.#examStartConsumed = true;
        const bridged = this.#site.audioBridgeState?.();
        this.setState(
          bridged && bridged.readyState >= HAVE_FUTURE_DATA
            ? "PLAYING"
            : "BUFFERING",
        );
        return;
      }
      this.#site.playAudio();
      this.assertCurrent(binding);
      if (this.#mode === "exam") this.#examStartConsumed = true;
      this.setState("PLAYING");
    } catch (error) {
      if (this.handleBenignPlaybackError(binding, error)) return;
      this.failClosed(binding);
      throw toAudioError(error);
    }
  }

  /*
   * Two failure shapes are routine, not faults: the browser refusing
   * autoplay before a user gesture, and play() being interrupted by a
   * pause() during rapid keystrokes or a question switch. Neither may
   * surface as AUDIO_ERROR.
   */
  private handleBenignPlaybackError(
    binding: { questionId: string; navigationEpoch: number },
    error: unknown,
  ): boolean {
    if (!(error instanceof DOMException) || this.#binding !== binding)
      return false;
    if (error.name === "NotAllowedError") {
      this.setState("READY");
      throw new AudioBrokerError("audio:needs-gesture", { cause: error });
    }
    if (error.name === "NotSupportedError") {
      // The site has not attached a playable source yet (lazy src).
      this.setState("EMPTY");
      throw new AudioBrokerError("audio:not-ready", { cause: error });
    }
    if (error.name === "AbortError") {
      const element = this.#element;
      if (element && !element.paused && !element.ended)
        this.setState("PLAYING");
      else if (this.#state === "BUFFERING") this.setState("PAUSED");
      return true;
    }
    return false;
  }

  pause(): void {
    const binding = this.requireBinding();
    this.assertCurrent(binding);
    const element = this.adoptElement();
    if (element) {
      if (!element.paused) element.pause();
    } else if (this.bridgeUsable()) {
      this.#site.audioBridgeCommand?.("pause");
    } else {
      this.#site.pauseAudio();
    }
    this.setState("PAUSED");
  }

  dispose(): void {
    this.invalidate();
  }

  invalidate(): void {
    this.releaseElement();
    this.#detachBridge?.();
    this.#detachBridge = null;
    this.stopSiteAudio();
    this.#binding = null;
    this.setState("EMPTY");
  }

  /*
   * Adopt the page's unique audio element and mirror its lifecycle events so
   * the cockpit state stays truthful even when the site pauses or finishes
   * playback on its own.
   */
  private adoptElement(): HTMLAudioElement | null {
    const elements = this.#site.siteAudioElements();
    const candidates =
      elements.length === 1
        ? elements
        : elements.filter((element) => element.currentSrc || element.src);
    // Voice switching can leave several sourced elements behind. Prefer the
    // one that is actually playing, then the most-loaded one — that is the
    // element the site is really driving. bind() already stopped the rest.
    const element =
      candidates.find((item) => !item.paused && !item.ended) ??
      [...candidates].sort((a, b) => b.readyState - a.readyState)[0] ??
      null;
    if (element === this.#element) return element;
    this.releaseElement();
    if (!element) return null;
    const binding = this.#binding;
    const isCurrent = () => this.#binding === binding && binding !== null;
    const onEnded = () => {
      if (isCurrent()) this.setState("ENDED");
    };
    const onPause = () => {
      if (isCurrent() && !element.ended && this.#state === "PLAYING")
        this.setState("PAUSED");
    };
    const onPlay = () => {
      if (isCurrent()) this.setState("PLAYING");
    };
    const onWaiting = () => {
      if (isCurrent() && this.#state === "PLAYING") this.setState("BUFFERING");
    };
    const onPlaying = () => {
      if (isCurrent()) this.setState("PLAYING");
    };
    element.addEventListener("ended", onEnded);
    element.addEventListener("pause", onPause);
    element.addEventListener("play", onPlay);
    element.addEventListener("waiting", onWaiting);
    element.addEventListener("playing", onPlaying);
    this.#element = element;
    this.#detachElement = () => {
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("waiting", onWaiting);
      element.removeEventListener("playing", onPlaying);
    };
    return element;
  }

  private releaseElement(): void {
    this.#detachElement?.();
    this.#detachElement = null;
    this.#element = null;
  }

  private requireBinding(): { questionId: string; navigationEpoch: number } {
    if (!this.#binding) throw new AudioBrokerError("audio:not-bound");
    return this.#binding;
  }

  /*
   * Latency-critical guard: uses the cheap id read instead of a full page
   * scan. A null read (transient DOM) trusts the binding — navigation
   * always rebinds or invalidates, which is the primary anti-cross-question
   * defence.
   */
  private assertCurrent(binding: {
    questionId: string;
    navigationEpoch: number;
  }): void {
    if (this.#binding !== binding)
      throw new AudioBrokerError("audio:stale-binding");
    const currentId = this.#site.readQuestionIdFast();
    if (currentId !== null && currentId !== binding.questionId) {
      throw new AudioBrokerError("audio:stale-binding");
    }
  }

  private assertExamPlayAvailable(): void {
    if (this.#mode === "exam" && this.#examStartConsumed) {
      throw new AudioBrokerError("audio:exam-play-consumed");
    }
  }

  private stopSiteAudio(): void {
    this.#site.audioBridgeCommand?.("stop");
    for (const audio of this.#site.siteAudioElements()) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Media without a seekable range rejects seeking; pause is enough.
      }
    }
  }

  /*
   * Only native elements are stopped here: the site's play control is a
   * toggle, so "pausing" through it while nothing plays would start audio.
   */
  private failClosed(binding: {
    questionId: string;
    navigationEpoch: number;
  }): void {
    if (this.#binding !== binding) return;
    this.stopSiteAudio();
    this.setState("AUDIO_ERROR");
  }

  private setState(state: string): void {
    this.#state = state;
    this.dispatchEvent(new CustomEvent("statechange", { detail: state }));
  }
}

function toAudioError(error: unknown): AudioBrokerError {
  if (error instanceof AudioBrokerError) return error;
  const message = error instanceof Error ? error.message : "audio:unknown";
  return new AudioBrokerError(message, { cause: error });
}
