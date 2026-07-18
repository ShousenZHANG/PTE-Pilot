import { defineContentScript } from "wxt/utils/define-content-script";

export const AUDIO_COMMAND_SOURCE = "pte-pilot-audio-cmd";
export const AUDIO_STATE_SOURCE = "pte-pilot-audio-state";

/*
 * MAIN-world hook. The site creates its playback audio with new Audio()
 * without inserting it into the DOM, so the isolated world can never reach
 * it directly. This script patches the Audio constructor and play() to
 * track every instance, and bridges commands/state over postMessage, which
 * crosses JS worlds with structured cloning.
 */
export default defineContentScript({
  matches: ["https://www.fireflyau.com/ptehome/exercise*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    const tracked = new Set<HTMLAudioElement>();
    let active: HTMLAudioElement | null = null;

    const report = (element: HTMLAudioElement): void => {
      window.postMessage(
        {
          source: AUDIO_STATE_SOURCE,
          state: {
            currentTime: element.currentTime,
            duration: Number.isFinite(element.duration) ? element.duration : 0,
            paused: element.paused,
            ended: element.ended,
            readyState: element.readyState,
          },
        },
        window.location.origin,
      );
    };

    const register = (element: HTMLAudioElement): void => {
      if (tracked.has(element)) return;
      tracked.add(element);
      for (const type of [
        "play",
        "playing",
        "pause",
        "ended",
        "timeupdate",
        "loadedmetadata",
        "waiting",
      ]) {
        element.addEventListener(type, () => {
          if (type === "play" || type === "playing") active = element;
          if (active === element) report(element);
        });
      }
    };

    const originalPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function patchedPlay(
      this: HTMLAudioElement,
    ) {
      register(this);
      active = this;
      const result = originalPlay.apply(this);
      report(this);
      return result;
    };

    const OriginalAudio = window.Audio;
    const PatchedAudio = function (this: unknown, src?: string) {
      const element =
        src === undefined ? new OriginalAudio() : new OriginalAudio(src);
      register(element);
      active ??= element;
      return element;
    };
    PatchedAudio.prototype = OriginalAudio.prototype;
    window.Audio = PatchedAudio as unknown as typeof Audio;

    const pickTarget = (): HTMLAudioElement | null =>
      active ??
      [...tracked].at(-1) ??
      document.querySelector<HTMLAudioElement>("audio");

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const data = event.data as { source?: string; op?: string } | null;
      if (!data || data.source !== AUDIO_COMMAND_SOURCE) return;
      const element = pickTarget();
      if (!element) return;
      switch (data.op) {
        case "play":
          void element.play().catch(() => undefined);
          break;
        case "pause":
          element.pause();
          break;
        case "restart":
          try {
            element.currentTime = 0;
          } catch {
            // Not seekable yet; play() will start from the beginning anyway.
          }
          void element.play().catch(() => undefined);
          break;
        case "stop":
          element.pause();
          try {
            element.currentTime = 0;
          } catch {
            // Not seekable yet.
          }
          break;
        case "prewarm":
          element.preload = "auto";
          report(element);
          break;
        case "query":
          report(element);
          break;
        default:
          break;
      }
    });
  },
});
