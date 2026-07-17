import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeMode } from "../domain/types";
import {
  type DrillState,
  drillSkip,
  drillType,
  startDrill,
} from "../practice/word-drill";
import {
  type ConfigurableKeyAction,
  DEFAULT_ALT_KEYMAP,
  findKeymapCollisions,
  type KeyboardAction,
  routeKeyboard,
} from "./keyboard";
import { PageIsolation, trapTab } from "./page-isolation";
import {
  type CockpitViewState,
  canPersistPredictionEdition,
  PracticeController,
  type RankedReviewEntry,
} from "./practice-controller";

type Panel = "none" | "words" | "settings" | "help" | "ranked";

export class CommandSessionGate {
  #nonce = 0;
  #busy = false;

  get current(): number {
    return this.#nonce;
  }

  get busy(): boolean {
    return this.#busy;
  }

  open(): number {
    this.#nonce += 1;
    this.#busy = false;
    return this.#nonce;
  }

  invalidate(): void {
    this.#nonce += 1;
    this.#busy = false;
  }

  isCurrent(session: number): boolean {
    return session === this.#nonce;
  }

  start(session: number): boolean {
    if (!this.isCurrent(session) || this.#busy) return false;
    this.#busy = true;
    return true;
  }

  finish(session: number): boolean {
    if (!this.isCurrent(session)) return false;
    this.#busy = false;
    return true;
  }
}

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
  const [autoPlayIn, setAutoPlayIn] = useState<number | null>(null);
  const [onboardDismissed, setOnboardDismissed] = useState(false);
  const countdownQuestionRef = useRef("");
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

      if (action === "play") {
        await runBusy(() => controller.play(), closeCommand);
      } else if (action === "restart") {
        await runBusy(() => controller.restartAudio(), closeCommand);
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
    setAutoPlayIn(3);
  }, [open, state.phase, state.audioStatus, timerIdentityKey]);

  useEffect(() => {
    if (autoPlayIn === null || !open) return;
    if (autoPlayIn <= 0) {
      setAutoPlayIn(null);
      void controllerRef.current?.autoPlayAudio();
      return;
    }
    const timer = setTimeout(
      () => setAutoPlayIn((value) => (value === null ? null : value - 1)),
      1_000,
    );
    return () => clearTimeout(timer);
  }, [autoPlayIn, open]);
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
        await controller.play();
      } else if (action === "restart") {
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
                : "听完即写。Enter 提交，Esc 打开命令层。"
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
              <kbd>Enter</kbd> 提交
            </span>
          </span>
        </label>

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
          <span data-testid="practice-notice" aria-live="polite">
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
            disabled={!isActionablePhase(state.phase) || !identity}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void controllerRef.current?.play()}
          >
            播放 <kbd>Alt {state.keymap.play?.toUpperCase()}</kbd>
          </button>
          <button
            type="button"
            className="fbtn"
            disabled={!isActionablePhase(state.phase) || !identity}
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
          commandRef={commandRef}
        />
      )}
    </main>
  );
}

function CommandLayer({
  panel,
  state,
  controller,
  busy,
  onAction,
  onChoose,
  commandRef,
}: {
  panel: Panel;
  state: CockpitViewState;
  controller: PracticeController | null;
  busy: boolean;
  onAction: (action: KeyboardAction) => void;
  onChoose: (questionId: string) => void;
  commandRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element {
  return (
    <aside
      className="command-layer"
      ref={commandRef}
      tabIndex={-1}
      data-testid="command-layer"
      aria-label="命令层"
      aria-busy={busy}
    >
      <nav className="command-menu">
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("toggle-mode")}
        >
          <kbd>E</kbd> 切换模式
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("ranked-review")}
        >
          <kbd>Q</kbd> 本地复习
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("word-library")}
        >
          <kbd>W</kbd> 错词库
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("settings")}
        >
          <kbd>S</kbd> 设置
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("build-index")}
        >
          <kbd>B</kbd> 建立完整索引
        </button>
        <button type="button" disabled={busy} onClick={() => onAction("help")}>
          <kbd>?</kbd> 键位
        </button>
      </nav>
      <div className="command-panel">
        {panel === "none" && (
          <p>
            按单键执行命令；按 <kbd>I</kbd> 或 <kbd>Esc</kbd> 回到输入。
          </p>
        )}
        {panel === "words" && <WordTrainer words={state.words} />}
        {panel === "settings" && controller && (
          <SettingsPanel controller={controller} state={state} />
        )}
        {panel === "ranked" && (
          <RankedReview
            entries={state.rankedEntries}
            current={state.identity?.questionId}
            onChoose={onChoose}
          />
        )}
        {panel === "help" && <HelpPanel keymap={state.keymap} />}
      </div>
    </aside>
  );
}

function WordTrainer({
  words,
}: {
  words: CockpitViewState["words"];
}): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(words.slice(0, 10).map((word) => word.key)),
  );
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [rejectTick, setRejectTick] = useState(0);
  const selectedCount = words.filter((word) => selected.has(word.key)).length;

  const toggle = (key: string): void => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const begin = (): void => {
    const list = words
      .filter((word) => selected.has(word.key) && word.expected)
      .map((word) => ({ key: word.key, expected: word.expected }));
    if (list.length === 0) return;
    setRejectTick(0);
    setDrill(startDrill(list));
  };

  if (drill?.completed) {
    const perfect = drill.results.filter(
      (result) => !result.skipped && result.errors === 0,
    ).length;
    return (
      <section data-testid="word-library">
        <h2>训练完成</h2>
        <p data-testid="drill-summary">
          {drill.results.length} 词 · 全对 {perfect} · 错键 {drill.totalErrors}
        </p>
        <div className="drill-actions">
          <button
            type="button"
            // biome-ignore lint/a11y/noAutofocus: keyboard-first panel handoff
            autoFocus
            onClick={() => {
              setRejectTick(0);
              setDrill(startDrill(drill.words));
            }}
          >
            再来一轮
          </button>
          <button type="button" onClick={() => setDrill(null)}>
            返回错词列表
          </button>
        </div>
      </section>
    );
  }

  if (drill) {
    const word = drill.words[drill.index];
    return (
      <section data-testid="word-library" data-drill-stage="typing">
        <h2>打字训练</h2>
        <p className="drill-meta">
          {drill.index + 1}/{drill.words.length} · 错键 {drill.totalErrors} ·
          输入正确自动下一词 · <kbd>Enter</kbd> 跳过 · <kbd>Esc</kbd> 退出
        </p>
        <p
          key={`${drill.index}:${rejectTick}`}
          className={`drill-word${rejectTick > 0 ? " drill-word--shake" : ""}`}
          data-testid="word-drill"
        >
          {enumerateChars(word?.expected ?? "").map(
            ({ char, id }, position) => (
              <span
                key={id}
                className={
                  position < drill.typed.length
                    ? "drill-char drill-char--hit"
                    : "drill-char"
                }
              >
                {char}
              </span>
            ),
          )}
        </p>
        <input
          className="drill-input"
          value={drill.typed}
          // biome-ignore lint/a11y/noAutofocus: drill is a typing surface
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="输入当前单词"
          onChange={(event) => {
            const step = drillType(drill, event.currentTarget.value);
            setDrill(step.state);
            if (step.rejected) setRejectTick((tick) => tick + 1);
            else if (step.advanced) setRejectTick(0);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            setRejectTick(0);
            setDrill(drillSkip(drill));
          }}
        />
      </section>
    );
  }

  return (
    <section data-testid="word-library">
      <h2>错词库</h2>
      {words.length === 0 ? (
        <p>还没有错词。</p>
      ) : (
        <>
          <p className="drill-hint">
            勾选高频错词，刷题前先做一轮打字训练热手。
          </p>
          <ol className="word-pick">
            {words.map((word) => (
              <li key={word.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(word.key)}
                    onChange={() => toggle(word.key)}
                  />
                  <strong>{word.expected || "∅"}</strong>
                  <span>
                    {word.actual || "∅"} · {word.type} · {word.occurrences}
                  </span>
                </label>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="drill-start"
            data-testid="drill-start"
            disabled={selectedCount === 0}
            onClick={begin}
          >
            开始打字训练（{selectedCount} 词）
          </button>
        </>
      )}
    </section>
  );
}

function enumerateChars(word: string): Array<{ char: string; id: string }> {
  const seen = new Map<string, number>();
  return [...word].map((char) => {
    const occurrence = (seen.get(char) ?? 0) + 1;
    seen.set(char, occurrence);
    return { char, id: `${char}:${occurrence}` };
  });
}

type ReviewFilter = "all" | "wrong" | "new" | "due";

const REVIEW_FILTERS: Array<{ id: ReviewFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "wrong", label: "只看错题" },
  { id: "due", label: "到期" },
  { id: "new", label: "未做" },
];

function matchesReviewFilter(
  entry: RankedReviewEntry,
  filter: ReviewFilter,
): boolean {
  if (filter === "wrong") return entry.wrong;
  if (filter === "due") return entry.due;
  if (filter === "new") return !entry.attempted;
  return true;
}

function RankedReview({
  entries,
  current,
  onChoose,
}: {
  entries: RankedReviewEntry[];
  current: string | undefined;
  onChoose: (questionId: string) => void;
}): React.JSX.Element {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const attempted = entries.filter((entry) => entry.attempted).length;
  const wrong = entries.filter((entry) => entry.wrong).length;
  const due = entries.filter((entry) => entry.due).length;
  const visible = entries.filter((entry) => matchesReviewFilter(entry, filter));
  return (
    <section data-testid="ranked-review">
      <h2>本地复习</h2>
      <p className="review-stats" data-testid="review-stats">
        已练 {attempted}/{entries.length} · 错题 {wrong} · 到期 {due}
      </p>
      <fieldset className="review-filters" aria-label="复习筛选">
        {REVIEW_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`chip${filter === id ? " chip--on" : ""}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
            {id === "wrong" ? `（${wrong}）` : ""}
          </button>
        ))}
      </fieldset>
      {visible.length === 0 ? (
        <p className="review-empty">
          {filter === "wrong" ? "没有错题——继续保持。" : "该筛选下暂无题目。"}
        </p>
      ) : (
        <ol className="rank-list">
          {visible.slice(0, 50).map((entry, index) => (
            <li key={entry.questionId}>
              <button
                type="button"
                disabled={entry.questionId === current}
                onClick={() => onChoose(entry.questionId)}
              >
                <span>#{index + 1}</span>
                {entry.questionId}
                {entry.wrong ? <em className="tag tag--wrong">错题</em> : null}
                {!entry.attempted ? <em className="tag">未做</em> : null}
                {entry.due && !entry.wrong ? (
                  <em className="tag tag--due">到期</em>
                ) : null}
                {entry.marked ? <em className="tag tag--marked">★</em> : null}
                {entry.questionId === current ? " · 当前" : ""}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SettingsPanel({
  controller,
  state,
}: {
  controller: PracticeController;
  state: CockpitViewState;
}): React.JSX.Element {
  const [keymap, setKeymap] = useState({
    ...DEFAULT_ALT_KEYMAP,
    ...state.keymap,
  });
  const [result, setResult] = useState("");
  const collisions = findKeymapCollisions(keymap);
  const validKeys = Object.values(keymap).every((key) => /^[a-z]$/iu.test(key));
  return (
    <section data-testid="settings-panel">
      <h2>设置</h2>
      <div className="settings-grid">
        {(Object.keys(DEFAULT_ALT_KEYMAP) as ConfigurableKeyAction[]).map(
          (command) => (
            <label key={command}>
              Alt + {commandLabel(command)}
              <input
                value={keymap[command]}
                maxLength={1}
                aria-label={`${command} shortcut`}
                onChange={(event) =>
                  setKeymap({
                    ...keymap,
                    [command]: event.currentTarget.value.toLowerCase(),
                  })
                }
              />
            </label>
          ),
        )}
      </div>
      {(!validKeys || collisions.length > 0) && (
        <p className="field-error">每项须为不同的单个字母。</p>
      )}
      <button
        type="button"
        disabled={!validKeys || collisions.length > 0}
        onClick={async () => {
          setResult(
            (await controller.saveKeymap(keymap))
              ? "快捷键已保存"
              : "快捷键冲突",
          );
        }}
      >
        保存快捷键
      </button>

      <p aria-live="polite">{result}</p>
      <p>快捷键只保存在本机浏览器中。</p>
    </section>
  );
}

function HelpPanel({
  keymap,
}: {
  keymap: Record<string, string>;
}): React.JSX.Element {
  return (
    <section data-testid="help-panel">
      <h2>全键盘</h2>
      <p>
        <kbd>Alt {keymap.play?.toUpperCase()}</kbd> 播放 ·{" "}
        <kbd>Alt {keymap.restart?.toUpperCase()}</kbd> 重播 ·{" "}
        <kbd>
          Alt {keymap.next?.toUpperCase()}/{keymap.previous?.toUpperCase()}
        </kbd>{" "}
        切题 · <kbd>Alt {keymap.mark?.toUpperCase()}</kbd> 标记
      </p>
      <p>
        结果页：<kbd>Enter/J</kbd> 下一题 · <kbd>K</kbd> 上一题 · <kbd>T</kbd>{" "}
        重做。全局 <kbd>Alt Shift P</kbd> 显示/隐藏。
      </p>
      <p>
        命令层：<kbd>B</kbd> 建立完整索引；索引中 <kbd>Esc</kbd> 暂停、
        <kbd>Enter/R</kbd> 继续、<kbd>X</kbd> 取消。
      </p>
    </section>
  );
}

const ACTIONABLE_PHASES = new Set(["ANSWERING", "REVIEW", "COMMAND"]);

function isActionablePhase(phase: CockpitViewState["phase"]): boolean {
  return ACTIONABLE_PHASES.has(phase);
}

function isTransitionFocusState(
  phase: CockpitViewState["phase"],
  indexStatus: CockpitViewState["indexStatus"],
): boolean {
  return (
    phase === "PROBING" ||
    phase === "SUBMITTING" ||
    phase === "NAVIGATING" ||
    phase === "RESETTING" ||
    indexStatus === "DISCOVERING" ||
    indexStatus === "INDEXING" ||
    indexStatus === "PAUSED"
  );
}

function commandLabel(command: ConfigurableKeyAction): string {
  return {
    play: "播放",
    restart: "重播",
    next: "下一题",
    previous: "上一题",
    mark: "标记",
  }[command];
}

function isEditableEventTarget(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0];
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function enumerateSegments(
  segments: NonNullable<CockpitViewState["review"]>["segments"],
): Array<{
  segment: NonNullable<CockpitViewState["review"]>["segments"][number];
  id: string;
}> {
  const seen = new Map<string, number>();
  return segments.map((segment) => {
    const base = `${segment.kind}:${segment.text}`;
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    return { segment, id: `${base}:${occurrence}` };
  });
}

function updateWordCount(
  textarea: HTMLTextAreaElement,
  output: HTMLOutputElement | null,
): void {
  if (!output) return;
  const count = textarea.value.trim()
    ? textarea.value.trim().split(/\s+/u).length
    : 0;
  const next = `Total Word Count: ${count}`;
  if (output.value === next) return;
  output.value = next;
}

function formatAudioClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

function audioLabel(
  status: string,
  mode: PracticeMode,
  autoPlayIn: number | null,
): string {
  const label =
    status === "EMPTY" && autoPlayIn !== null
      ? `Beginning in ${autoPlayIn}s`
      : status === "BUFFERING"
        ? "BUFFERING · 正在加载音频"
        : status;
  return mode === "exam" ? `Status: ${label} · 单次播放` : `Status: ${label}`;
}
