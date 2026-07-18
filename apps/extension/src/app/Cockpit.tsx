import { useCallback, useEffect, useRef, useState } from "react";
import {
  audioLabel,
  enumerateSegments,
  formatAudioClock,
  isActionablePhase,
  isEditableEventTarget,
  isTransitionFocusState,
  updateWordCount,
} from "./cockpit-presentation";
import { CommandSessionGate } from "./command-session";
import {
  DEFAULT_ALT_KEYMAP,
  type KeyboardAction,
  routeKeyboard,
} from "./keyboard";
import { PageIsolation, trapTab } from "./page-isolation";
import { CommandLayer, type Panel } from "./panels/CommandLayer";
import { HelpPanel } from "./panels/HelpPanel";
import {
  type CockpitViewState,
  canPersistPredictionEdition,
  PracticeController,
} from "./practice-controller";

export { CommandSessionGate } from "./command-session";

const INITIAL_STATE: CockpitViewState = {
  phase: "PROBING",
  mode: "practice",
  identity: null,
  draft: "",
  review: null,
  audioStatus: "EMPTY",
  indexStatus: "IDLE",
  siteStatus: "正在验证萤火虫页面",
  notice: "",
  marked: false,
  words: [],
  rankedEntries: [],
  reviewQueue: null,
  keymap: { ...DEFAULT_ALT_KEYMAP },
  fault: null,
};

export function Cockpit(): React.JSX.Element | null {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioBoxRef = useRef<HTMLDivElement>(null);
  const audioFillRef = useRef<HTMLElement>(null);
  const audioTimeRef = useRef<HTMLSpanElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const commandRef = useRef<HTMLElement>(null);
  const phaseStatusRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const wordCountRef = useRef<HTMLOutputElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<PracticeController | null>(null);
  const isolationRef = useRef(new PageIsolation());
  const commandSessionRef = useRef(new CommandSessionGate());
  const panelRef = useRef<Panel>("none");
  const openRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewReadyAtRef = useRef(0);
  const enterReleasedRef = useRef(true);
  const previousPhaseRef = useRef(INITIAL_STATE.phase);
  const liveDraftRef = useRef("");
  const [open, setOpen] = useState(true);
  const [panel, setPanelState] = useState<Panel>("none");
  const [commandBusy, setCommandBusy] = useState(false);
  const [autoPlayIn, setAutoPlayInState] = useState<number | null>(null);
  const autoPlayInRef = useRef<number | null>(null);
  const setAutoPlayIn = useCallback((value: number | null): void => {
    autoPlayInRef.current = value;
    setAutoPlayInState(value);
  }, []);
  const [onboardDismissed, setOnboardDismissed] = useState(false);
  const countdownQuestionRef = useRef("");
  const autoPlayDeadlineRef = useRef(0);
  const [state, setState] = useState<CockpitViewState>(INITIAL_STATE);

  const setPanel = useCallback((nextPanel: Panel): void => {
    panelRef.current = nextPanel;
    setPanelState(nextPanel);
  }, []);

  const invalidateCommandSession = useCallback((): void => {
    commandSessionRef.current.invalidate();
    setCommandBusy(false);
  }, []);

  const closeCommand = useCallback((): void => {
    invalidateCommandSession();
    setPanel("none");
    const controller = controllerRef.current;
    controller?.setCommand(false);
    const returnPhase = controller?.state.phase;
    requestAnimationFrame(() => {
      if (returnPhase === "REVIEW") reviewRef.current?.focus();
      else textareaRef.current?.focus();
    });
  }, [invalidateCommandSession, setPanel]);

  const openCommand = useCallback((): void => {
    const controller = controllerRef.current;
    if (
      !controller ||
      (controller.state.phase !== "ANSWERING" &&
        controller.state.phase !== "REVIEW")
    )
      return;
    commandSessionRef.current.open();
    setCommandBusy(false);
    setPanel("none");
    controller.setCommand(true);
  }, [setPanel]);

  const toggleOpen = useCallback(
    (next?: boolean): void => {
      const target = next ?? !openRef.current;
      if (target === openRef.current) return;
      openRef.current = target;
      invalidateCommandSession();
      setPanel("none");
      if (!target) {
        if (controllerRef.current?.state.indexStatus === "INDEXING")
          controllerRef.current.pauseIndex();
        liveDraftRef.current =
          textareaRef.current?.value ?? liveDraftRef.current;
        void controllerRef.current?.flushDraft().catch(() => undefined);
      } else if (controllerRef.current?.state.phase === "COMMAND") {
        commandSessionRef.current.open();
      }
      setOpen(target);
    },
    [invalidateCommandSession, setPanel],
  );

  const clearTextarea = useCallback((): void => {
    liveDraftRef.current = "";
    if (textareaRef.current) {
      textareaRef.current.value = "";
      updateWordCount(textareaRef.current, wordCountRef.current);
      textareaRef.current.focus();
    }
  }, []);

  const runCommandAction = useCallback(
    async (action: KeyboardAction, session: number): Promise<void> => {
      const controller = controllerRef.current;
      const gate = commandSessionRef.current;
      const isCurrent = () =>
        gate.isCurrent(session) &&
        controllerRef.current === controller &&
        controller?.state.phase === "COMMAND";
      if (!controller || !isCurrent()) return;

      if (action === "close-command" || action === "focus-input") {
        closeCommand();
        return;
      }
      if (gate.busy) return;

      const leaveForNavigation = (): boolean => {
        if (!isCurrent()) return false;
        gate.invalidate();
        setCommandBusy(false);
        setPanel("none");
        return true;
      };
      const runBusy = async <T,>(
        operation: () => Promise<T>,
        onSuccess: (result: T) => void,
      ): Promise<void> => {
        if (!gate.start(session)) return;
        setCommandBusy(true);
        try {
          const result = await operation();
          if (isCurrent()) onSuccess(result);
        } finally {
          if (gate.finish(session)) setCommandBusy(false);
        }
      };

      if (action === "play" || action === "restart") {
        if (autoPlayInRef.current !== null) return;
        await runBusy(
          () =>
            action === "play" ? controller.play() : controller.restartAudio(),
          closeCommand,
        );
      } else if (action === "mark") {
        await runBusy(() => controller.toggleMarked(), closeCommand);
      } else if (action === "toggle-mode") {
        const mode = controller.state.mode === "practice" ? "exam" : "practice";
        await runBusy(() => controller.setMode(mode), closeCommand);
      } else if (action === "word-library") {
        await runBusy(
          () => controller.loadWords(),
          () => setPanel("words"),
        );
      } else if (action === "ranked-review") {
        await runBusy(
          () => controller.loadRankedReview(),
          (loaded) => {
            if (loaded === true) setPanel("ranked");
          },
        );
      } else if (action === "settings") {
        setPanel("settings");
      } else if (action === "help") {
        setPanel("help");
      } else if (action === "next" || action === "previous") {
        if (!leaveForNavigation()) return;
        await controller.navigate(action);
      } else if (action === "build-index") {
        if (!leaveForNavigation()) return;
        await controller.buildFullIndex();
      }
    },
    [closeCommand, setPanel],
  );

  const navigateFromRankedReview = useCallback(
    async (questionId: string, session: number): Promise<void> => {
      const controller = controllerRef.current;
      const gate = commandSessionRef.current;
      if (
        !controller ||
        !gate.isCurrent(session) ||
        gate.busy ||
        controller.state.phase !== "COMMAND"
      )
        return;
      gate.invalidate();
      setCommandBusy(false);
      setPanel("none");
      await controller.navigateToQuestion(questionId);
    },
    [setPanel],
  );

  const startWrongDrive = useCallback(
    async (questionIds: string[], session: number): Promise<void> => {
      const controller = controllerRef.current;
      const gate = commandSessionRef.current;
      if (
        !controller ||
        !gate.isCurrent(session) ||
        gate.busy ||
        controller.state.phase !== "COMMAND"
      )
        return;
      gate.invalidate();
      setCommandBusy(false);
      setPanel("none");
      await controller.startWrongDrive(questionIds);
    },
    [setPanel],
  );

  useEffect(() => {
    const controller = new PracticeController(
      () => textareaRef.current?.value ?? liveDraftRef.current,
    );
    controllerRef.current = controller;
    const onState = (event: Event) => {
      const next = (event as CustomEvent<CockpitViewState>).detail;
      if (
        next.phase === "REVIEW" &&
        previousPhaseRef.current === "SUBMITTING"
      ) {
        reviewReadyAtRef.current = performance.now() + 400;
      }
      previousPhaseRef.current = next.phase;
      setState(next);
    };
    controller.addEventListener("statechange", onState);
    void controller.initialize();
    return () => {
      commandSessionRef.current.invalidate();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      void controller.flushDraft().catch(() => undefined);
      controller.removeEventListener("statechange", onState);
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !state.identity) return;
    liveDraftRef.current = state.draft;
    textarea.value = state.draft;
    updateWordCount(textarea, wordCountRef.current);
  }, [state.identity, state.draft]);

  useEffect(() => {
    if (!open) return;
    const textarea = textareaRef.current;
    if (textarea && textarea.value !== liveDraftRef.current) {
      textarea.value = liveDraftRef.current;
      updateWordCount(textarea, wordCountRef.current);
    }
  }, [open]);

  const timerIdentityKey = state.identity
    ? `${state.identity.predictionEdition}:${state.identity.questionId}`
    : "";

  /*
   * Exam-style lead-in: a fresh question arms a short countdown and then
   * auto-plays, exactly like the real test driver. Alt+P (or the footer
   * button) skips the wait; any status change cancels the countdown.
   */
  useEffect(() => {
    if (
      !open ||
      state.phase !== "ANSWERING" ||
      state.audioStatus !== "EMPTY" ||
      !timerIdentityKey
    ) {
      if (state.audioStatus !== "EMPTY") setAutoPlayIn(null);
      return;
    }
    if (countdownQuestionRef.current === timerIdentityKey) return;
    countdownQuestionRef.current = timerIdentityKey;
    autoPlayDeadlineRef.current = performance.now() + AUTO_PLAY_LEAD_MS;
    controllerRef.current?.prewarmAudio();
    setAutoPlayIn(AUTO_PLAY_LEAD_MS / 1_000);
  }, [open, state.phase, state.audioStatus, timerIdentityKey, setAutoPlayIn]);

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
  }, [countdownActive, open, setAutoPlayIn]);
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
  }, [timerIdentityKey]);

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
    if (state.audioStatus !== "PLAYING" && state.audioStatus !== "BUFFERING")
      return;
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [state.audioStatus, open]);

  useEffect(() => {
    if (!open) return;
    if (state.phase === "ANSWERING")
      textareaRef.current?.focus({ preventScroll: true });
    if (state.phase === "REVIEW")
      reviewRef.current?.focus({ preventScroll: true });
    if (state.phase === "COMMAND")
      commandRef.current?.focus({ preventScroll: true });
    if (isTransitionFocusState(state.phase, state.indexStatus))
      phaseStatusRef.current?.focus({ preventScroll: true });
  }, [state.phase, state.indexStatus, open]);

  useEffect(() => {
    if (!open || state.phase !== "COMMAND" || panel !== "none" || commandBusy)
      return;
    const session = commandSessionRef.current.current;
    const timer = setTimeout(() => {
      const gate = commandSessionRef.current;
      if (
        gate.isCurrent(session) &&
        !gate.busy &&
        panelRef.current === "none" &&
        controllerRef.current?.state.phase === "COMMAND"
      )
        closeCommand();
    }, 1_500);
    return () => clearTimeout(timer);
  }, [closeCommand, commandBusy, open, panel, state.phase]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (open) isolationRef.current.enable(root);
    else isolationRef.current.disable();
    return () => isolationRef.current.disable();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const routed = routeKeyboard(event, {
        phase: state.phase,
        overlayOpen: open,
        nowMs: performance.now(),
        reviewReadyAtMs: reviewReadyAtRef.current,
        enterReleased: enterReleasedRef.current,
        keymap: state.keymap,
        editingCommandField: isEditableEventTarget(event),
        indexStatus: state.indexStatus,
      });
      if (routed.consume) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (routed.action) void act(routed.action);
      else if (open && rootRef.current) trapTab(event, rootRef.current);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Enter") enterReleasedRef.current = true;
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
    };

    async function act(action: KeyboardAction): Promise<void> {
      const controller = controllerRef.current;
      if (action === "toggle-overlay") {
        toggleOpen();
        return;
      }
      if (!controller) return;
      if (controller.state.phase === "COMMAND") {
        await runCommandAction(action, commandSessionRef.current.current);
        return;
      }
      if (action === "submit") {
        enterReleasedRef.current = false;
        await controller.submit();
      } else if (action === "play") {
        if (autoPlayInRef.current !== null) return;
        await controller.play();
      } else if (action === "restart") {
        if (autoPlayInRef.current !== null) return;
        await controller.restartAudio();
      } else if (action === "next") await controller.navigate("next");
      else if (action === "previous") await controller.navigate("previous");
      else if (action === "mark") {
        await controller.toggleMarked();
      } else if (action === "open-command") openCommand();
      else if (action === "close-command") closeCommand();
      else if (action === "redo") {
        await controller.redo();
        clearTextarea();
      } else if (action === "help") setPanel("help");
      else if (action === "retry") {
        setPanel("none");
        await controller.initialize();
      } else if (action === "original-site") {
        setPanel("none");
        toggleOpen(false);
      } else if (action === "pause-index") controller.pauseIndex();
      else if (action === "resume-index") controller.resumeIndex();
      else if (action === "cancel-index") controller.cancelIndex();
    }
  }, [
    clearTextarea,
    closeCommand,
    open,
    openCommand,
    runCommandAction,
    setPanel,
    state.keymap,
    state.indexStatus,
    state.phase,
    toggleOpen,
  ]);

  if (!open) return null;
  const identity = state.identity;
  const review = state.review;
  const scorePercent = review
    ? review.totalWords > 0
      ? Math.round((review.correctCount / review.totalWords) * 100)
      : 100
    : 0;
  const writable = state.phase === "ANSWERING";
  const renderedCommandSession = commandSessionRef.current.current;

  return (
    <main
      className={`cockpit cockpit--${state.mode}`}
      ref={rootRef}
      data-testid="pte-pilot-root"
      data-phase={state.phase}
      aria-label="PTE Pilot WFD 练习舱"
    >
      <header className="exam-header">
        <div className="exam-header__title">
          <strong>PTE Academic</strong>
          <span>Listening · Write From Dictation</span>
        </div>
        <div className="exam-header__meta">
          <span className="exam-timer" role="timer" aria-label="本题用时">
            <i aria-hidden="true" />
            <span ref={timerRef}>00:00</span>
          </span>
          <span className="exam-counter" data-testid="question-position">
            {identity ? `${identity.position}/${identity.total}` : "—"}
          </span>
          <span className="exam-qid" data-testid="question-id">
            {identity ? `#${identity.questionId}` : ""}
          </span>
          <button
            className="quiet-button"
            type="button"
            onClick={() => toggleOpen(false)}
            aria-label="返回萤火虫原网页"
          >
            <kbd>Alt Shift P</kbd> 关闭
          </button>
        </div>
      </header>

      <section
        className={`practice-deck${state.review ? " practice-deck--review" : ""}`}
      >
        <p className="instructions">
          You will hear a sentence. Type the sentence in the box below exactly
          as you hear it. Write as much of the sentence as you can. You will
          hear the sentence only once.
        </p>

        {identity &&
          !canPersistPredictionEdition(identity.predictionEdition) &&
          !onboardDismissed &&
          isActionablePhase(state.phase) && (
            <aside className="onboard" data-testid="onboarding">
              <div className="onboard__text">
                <strong>第一步：建立索引</strong>
                <span>
                  建立后自动记录错题与错词，解锁本地复习、间隔重复和打字训练。
                  当前页共 {identity.total} 题
                  {identity.total > 300
                    ? "——题量较大，建议先在萤火虫切到周预测页再建。"
                    : "，一次建好长期使用。"}
                </span>
              </div>
              <button
                type="button"
                className="onboard__go"
                onClick={() => void controllerRef.current?.buildFullIndex()}
              >
                一键建立索引
              </button>
              <button
                type="button"
                className="onboard__later"
                onClick={() => setOnboardDismissed(true)}
              >
                稍后
              </button>
            </aside>
          )}

        <div
          className="audio-box"
          data-audio={state.audioStatus}
          ref={audioBoxRef}
        >
          <div className="audio-box__row">
            <strong data-testid="audio-status">
              {audioLabel(state.audioStatus, state.mode, autoPlayIn)}
            </strong>
            <span className="audio-time" ref={audioTimeRef} />
            <span className="key-hints" aria-hidden="true">
              <kbd>Alt {state.keymap.restart?.toUpperCase()}</kbd> 从头重播
            </span>
          </div>
          <div className="audio-track" aria-hidden="true">
            <i className="audio-fill" ref={audioFillRef} />
          </div>
        </div>

        <label className="answer-shell">
          <span className="sr-only">输入听到的完整句子</span>
          <textarea
            ref={textareaRef}
            data-testid="answer-input"
            defaultValue=""
            readOnly={!writable}
            aria-readonly={!writable}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            placeholder={
              state.mode === "exam"
                ? ""
                : "听完即写。Enter 换行，Ctrl+Enter 提交，Esc 命令层。"
            }
            onInput={(event) => {
              liveDraftRef.current = event.currentTarget.value;
              updateWordCount(event.currentTarget, wordCountRef.current);
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              saveTimerRef.current = setTimeout(
                () => void controllerRef.current?.flushDraft(),
                120,
              );
            }}
            onBlur={() => void controllerRef.current?.flushDraft()}
          />
          <span className="answer-foot">
            <output ref={wordCountRef}>Total Word Count: 0</output>
            <span>
              <kbd>Ctrl Enter</kbd> 提交
            </span>
          </span>
        </label>

        {state.phase === "SUBMITTING" && !review && (
          <section className="review review--skeleton" aria-hidden="true">
            <header className="review__head">
              <strong className="review__title">AI 评分</strong>
              <span className="review__legend">正在评分…</span>
            </header>
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </section>
        )}

        {review && (
          <section
            className="review"
            ref={reviewRef}
            tabIndex={state.phase === "REVIEW" ? 0 : -1}
            data-testid="review-result"
            aria-live="polite"
          >
            <header className="review__head">
              <strong className="review__title">AI 评分</strong>
              <span className="review__legend" aria-hidden="true">
                <span className="w-ok">Correct</span>
                <del className="w-err">Error</del>
                <em className="w-omit">(Omit)</em>
              </span>
              <span className="review__pill" data-testid="review-score">
                {review.correctCount}/{review.totalWords}
              </span>
            </header>
            <div className="score-bar" aria-hidden="true">
              <i style={{ width: `${scorePercent}%` }} />
            </div>
            <p className="score-line" data-testid="score-line">
              {enumerateSegments(review.segments).map(({ segment, id }) => {
                if (segment.kind === "correct")
                  return (
                    <span key={id} className="w-ok">
                      {segment.text}{" "}
                    </span>
                  );
                if (segment.kind === "omit")
                  return (
                    <em key={id} className="w-omit">
                      ({segment.text}){" "}
                    </em>
                  );
                return (
                  <del key={id} className="w-err">
                    {segment.text}{" "}
                  </del>
                );
              })}
            </p>
            <p className="review__answer" data-testid="review-answer">
              {review.answerText}
            </p>
            {review.translation && (
              <p
                className="review__translation"
                data-testid="review-translation"
              >
                {review.translation}
              </p>
            )}
            <p className="review__next">
              <kbd>Enter</kbd> 下一题 · <kbd>T</kbd> 重做 · <kbd>K</kbd> 上一题
              · <kbd>R</kbd> 重播
            </p>
          </section>
        )}
      </section>

      <footer className="exam-footer">
        <div className="status-cluster">
          <span
            ref={phaseStatusRef}
            data-testid="practice-state"
            role="status"
            aria-live="polite"
            tabIndex={
              isTransitionFocusState(state.phase, state.indexStatus) ? 0 : -1
            }
          >
            <i />
            {state.phase}
          </span>
          <span data-testid="site-status">{state.siteStatus}</span>
          {state.indexStatus !== "IDLE" && (
            <span data-testid="index-status">索引 {state.indexStatus}</span>
          )}
          {state.reviewQueue && (
            <span className="queue-chip" data-testid="review-queue">
              错题循环 {state.reviewQueue.position}/{state.reviewQueue.total}
            </span>
          )}
          <span
            key={state.notice}
            data-testid="practice-notice"
            aria-live="polite"
          >
            {state.notice}
          </span>
        </div>
        <nav className="footer-menu" aria-label="快捷操作">
          <button
            type="button"
            className="fbtn"
            disabled={!isActionablePhase(state.phase)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (state.phase === "COMMAND") closeCommand();
              else openCommand();
            }}
          >
            菜单 <kbd>Esc</kbd>
          </button>
          <button
            type="button"
            className="fbtn"
            disabled={
              !isActionablePhase(state.phase) ||
              !identity ||
              autoPlayIn !== null
            }
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void controllerRef.current?.play()}
          >
            播放 <kbd>Alt {state.keymap.play?.toUpperCase()}</kbd>
          </button>
          <button
            type="button"
            className="fbtn"
            disabled={
              !isActionablePhase(state.phase) ||
              !identity ||
              autoPlayIn !== null
            }
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void controllerRef.current?.restartAudio()}
          >
            重播 <kbd>Alt {state.keymap.restart?.toUpperCase()}</kbd>
          </button>
          <button
            type="button"
            className="fbtn"
            disabled={!isActionablePhase(state.phase) || !identity}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void controllerRef.current?.toggleMarked()}
          >
            {state.marked ? "已标记" : "标记"}{" "}
            <kbd>Alt {state.keymap.mark?.toUpperCase()}</kbd>
          </button>
        </nav>
        <div className="exam-footer__actions">
          <span
            className={`mode-chip mode-chip--${state.mode}`}
            data-testid="practice-mode"
          >
            {state.mode === "practice" ? "Practice" : "Exam"}
          </span>
          <button
            type="button"
            className="btn-next"
            disabled={state.phase !== "ANSWERING" && state.phase !== "REVIEW"}
            onClick={() => {
              const controller = controllerRef.current;
              if (!controller) return;
              if (controller.state.phase === "ANSWERING")
                void controller.submit();
              else if (controller.state.phase === "REVIEW")
                void controller.navigate("next");
            }}
          >
            Next
          </button>
        </div>
      </footer>

      {(state.indexStatus === "INDEXING" || state.indexStatus === "PAUSED") && (
        <section className="index-control" aria-live="polite">
          <strong>
            {state.indexStatus === "PAUSED" ? "索引已暂停" : "正在建立完整索引"}
          </strong>
          <span>
            {state.indexStatus === "PAUSED" ? "Enter / R 继续" : "Esc 暂停"}
            {" · "}X 取消
          </span>
          {state.indexStatus === "PAUSED" ? (
            <button
              type="button"
              onClick={() => controllerRef.current?.resumeIndex()}
            >
              继续
            </button>
          ) : (
            <button
              type="button"
              onClick={() => controllerRef.current?.pauseIndex()}
            >
              暂停
            </button>
          )}
          <button
            type="button"
            onClick={() => controllerRef.current?.cancelIndex()}
          >
            取消
          </button>
        </section>
      )}

      {state.fault && (
        <section className="recovery" role="alert">
          <strong>{state.fault.code}</strong>
          <p>{state.fault.message}</p>
          <button
            type="button"
            data-testid="recovery-retry"
            onClick={() => {
              setPanel("none");
              void controllerRef.current?.initialize();
            }}
          >
            <kbd>R</kbd> 重试
          </button>
          <button
            type="button"
            data-testid="recovery-original-site"
            onClick={() => {
              setPanel("none");
              toggleOpen(false);
            }}
          >
            <kbd>O</kbd> 返回原网页
          </button>
          <button
            type="button"
            data-testid="recovery-help"
            onClick={() => setPanel("help")}
          >
            <kbd>?</kbd> 诊断帮助
          </button>
          {state.fault.code === "DESYNC" && (
            <p>
              <kbd>Alt {state.keymap.next?.toUpperCase()}</kbd> 下一题 ·{" "}
              <kbd>Alt {state.keymap.previous?.toUpperCase()}</kbd> 上一题
            </p>
          )}
          {panel === "help" && (
            <div className="recovery__help">
              <HelpPanel keymap={state.keymap} />
            </div>
          )}
        </section>
      )}

      {state.phase === "COMMAND" && (
        <CommandLayer
          panel={panel}
          state={state}
          controller={controllerRef.current}
          busy={commandBusy}
          onAction={(action) =>
            void runCommandAction(action, renderedCommandSession)
          }
          onChoose={(questionId) =>
            void navigateFromRankedReview(questionId, renderedCommandSession)
          }
          onStartWrong={(questionIds) =>
            void startWrongDrive(questionIds, renderedCommandSession)
          }
          onExitQueue={() => controllerRef.current?.exitWrongDrive()}
          commandRef={commandRef}
        />
      )}
    </main>
  );
}

/*
 * Exam-style enforced lead-in: playback cannot be started or restarted
 * during the countdown, exactly like the real test driver.
 */
const AUTO_PLAY_LEAD_MS = 5_000;
