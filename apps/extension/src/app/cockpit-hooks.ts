import { useCallback, useEffect, useRef, useState } from "react";
import { formatAudioClock } from "./cockpit-presentation";
import type {
  CockpitViewState,
  PracticeController,
} from "./practice-controller";

/*
 * Exam-style enforced lead-in: playback cannot be started or restarted
 * during the countdown, exactly like the real test driver.
 */
export const AUTO_PLAY_LEAD_MS = 5_000;

type ControllerRef = React.RefObject<PracticeController | null>;

/*
 * Exam-style lead-in: a fresh question arms a short countdown and then
 * auto-plays, exactly like the real test driver. Alt+P (or the footer
 * button) skips the wait; any status change cancels the countdown. The
 * countdown drains the audio progress bar via direct DOM writes so the
 * 100ms tick never causes a React render beyond the seconds readout.
 */
export function useAutoPlayCountdown(options: {
  open: boolean;
  phase: CockpitViewState["phase"];
  audioStatus: string;
  timerIdentityKey: string;
  controllerRef: ControllerRef;
  audioBoxRef: React.RefObject<HTMLDivElement | null>;
  audioFillRef: React.RefObject<HTMLElement | null>;
}): {
  autoPlayIn: number | null;
  autoPlayInRef: React.RefObject<number | null>;
} {
  const {
    open,
    phase,
    audioStatus,
    timerIdentityKey,
    controllerRef,
    audioBoxRef,
    audioFillRef,
  } = options;
  const [autoPlayIn, setAutoPlayInState] = useState<number | null>(null);
  const autoPlayInRef = useRef<number | null>(null);
  const setAutoPlayIn = useCallback((value: number | null): void => {
    autoPlayInRef.current = value;
    setAutoPlayInState(value);
  }, []);
  // One countdown per EMPTY audio session: a question switch or a redo
  // resets the status to EMPTY and therefore arms a fresh lead-in, while a
  // failed auto-play (still EMPTY) never re-arms into a loop.
  const armedRef = useRef(false);
  const autoPlayDeadlineRef = useRef(0);

  useEffect(() => {
    if (
      !open ||
      phase !== "ANSWERING" ||
      audioStatus !== "EMPTY" ||
      !timerIdentityKey
    ) {
      armedRef.current = false;
      setAutoPlayIn(null);
      return;
    }
    if (armedRef.current) return;
    armedRef.current = true;
    autoPlayDeadlineRef.current = performance.now() + AUTO_PLAY_LEAD_MS;
    controllerRef.current?.prewarmAudio();
    setAutoPlayIn(AUTO_PLAY_LEAD_MS / 1_000);
  }, [
    open,
    phase,
    audioStatus,
    timerIdentityKey,
    setAutoPlayIn,
    controllerRef,
  ]);

  const countdownActive = autoPlayIn !== null;
  useEffect(() => {
    if (!countdownActive || !open) return;
    // Deadline-based so the displayed seconds never drift from real time.
    if (audioBoxRef.current) audioBoxRef.current.dataset.countdown = "true";
    const interval = setInterval(() => {
      // The site may insert the audio element after bind; keep re-warming so
      // the clip is fully buffered by the time the countdown fires.
      controllerRef.current?.prewarmAudio();
      const remainingMs = autoPlayDeadlineRef.current - performance.now();
      if (audioFillRef.current) {
        const percent = Math.max(
          0,
          Math.min(100, (remainingMs / AUTO_PLAY_LEAD_MS) * 100),
        );
        audioFillRef.current.style.width = `${percent.toFixed(1)}%`;
      }
      const remaining = Math.ceil(remainingMs / 1_000);
      if (remaining <= 0) {
        setAutoPlayIn(null);
        void controllerRef.current?.autoPlayAudio();
        return;
      }
      if (autoPlayInRef.current !== null) setAutoPlayIn(remaining);
    }, 100);
    return () => {
      clearInterval(interval);
      if (audioBoxRef.current) delete audioBoxRef.current.dataset.countdown;
      if (audioFillRef.current) audioFillRef.current.style.width = "";
    };
  }, [
    countdownActive,
    open,
    setAutoPlayIn,
    audioBoxRef,
    audioFillRef,
    controllerRef,
  ]);

  return { autoPlayIn, autoPlayInRef };
}

/** Per-question elapsed-time clock, written straight to the DOM. */
export function useQuestionTimer(
  timerIdentityKey: string,
  timerRef: React.RefObject<HTMLSpanElement | null>,
): void {
  useEffect(() => {
    if (timerRef.current) timerRef.current.textContent = "00:00";
    if (!timerIdentityKey) return;
    const startedAt = performance.now();
    const interval = setInterval(() => {
      const element = timerRef.current;
      if (!element) return;
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
      element.textContent = `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
    }, 1_000);
    return () => clearInterval(interval);
  }, [timerIdentityKey, timerRef]);
}

/*
 * Real playback progress polled from the audio broker while audio is
 * live; fill width and clock text are direct DOM writes (no re-render).
 */
export function useAudioProgress(options: {
  open: boolean;
  audioStatus: string;
  controllerRef: ControllerRef;
  audioBoxRef: React.RefObject<HTMLDivElement | null>;
  audioFillRef: React.RefObject<HTMLElement | null>;
  audioTimeRef: React.RefObject<HTMLSpanElement | null>;
}): void {
  const {
    open,
    audioStatus,
    controllerRef,
    audioBoxRef,
    audioFillRef,
    audioTimeRef,
  } = options;
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const snap = controllerRef.current?.audioSnapshot() ?? null;
      const box = audioBoxRef.current;
      const fill = audioFillRef.current;
      const time = audioTimeRef.current;
      if (box) box.dataset.live = snap ? "true" : "false";
      if (!fill || !time) return;
      if (snap && snap.duration > 0) {
        const percent = Math.min(100, (snap.currentTime / snap.duration) * 100);
        fill.style.width = `${percent.toFixed(1)}%`;
        time.textContent = `${formatAudioClock(snap.currentTime)} / ${formatAudioClock(snap.duration)}`;
      } else {
        fill.style.width = "";
        time.textContent = "";
      }
    };
    update();
    if (audioStatus !== "PLAYING" && audioStatus !== "BUFFERING") return;
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [
    audioStatus,
    open,
    controllerRef,
    audioBoxRef,
    audioFillRef,
    audioTimeRef,
  ]);
}
