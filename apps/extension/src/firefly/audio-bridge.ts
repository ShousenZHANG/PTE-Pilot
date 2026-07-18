export interface BridgeAudioState {
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  readyState: number;
  /** performance.now() when the state arrived. */
  at: number;
}

export type BridgeCommand =
  | "play"
  | "pause"
  | "restart"
  | "stop"
  | "prewarm"
  | "query";

const COMMAND_SOURCE = "pte-pilot-audio-cmd";
const STATE_SOURCE = "pte-pilot-audio-state";

/*
 * Isolated-world client of the MAIN-world audio hook. Commands go out and
 * state comes back over postMessage; the latest state is cached so the
 * broker can answer synchronous questions (paused? how far?) without a
 * round trip.
 */
export class MainWorldAudioBridge {
  #last: BridgeAudioState | null = null;
  readonly #listeners = new Set<(state: BridgeAudioState) => void>();

  constructor(private readonly target: Window | null = defaultWindow()) {
    target?.addEventListener("message", (event) => {
      if (event.source !== target) return;
      const data = event.data as {
        source?: string;
        state?: Omit<BridgeAudioState, "at">;
      } | null;
      if (!data || data.source !== STATE_SOURCE || !data.state) return;
      const state: BridgeAudioState = {
        currentTime: Number(data.state.currentTime) || 0,
        duration: Number(data.state.duration) || 0,
        paused: Boolean(data.state.paused),
        ended: Boolean(data.state.ended),
        readyState: Number(data.state.readyState) || 0,
        at: performance.now(),
      };
      this.#last = state;
      for (const listener of this.#listeners) listener(state);
    });
  }

  command(op: BridgeCommand): void {
    this.target?.postMessage(
      { source: COMMAND_SOURCE, op },
      this.target.location.origin,
    );
  }

  onState(listener: (state: BridgeAudioState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  state(): BridgeAudioState | null {
    return this.#last;
  }
}

function defaultWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}
