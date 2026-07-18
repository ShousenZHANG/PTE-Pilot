import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExamFooter,
  IndexControlBar,
  RecoveryCard,
  ReviewCard,
  ScoreSkeleton,
} from "./cockpit-chrome";
import {
  useAudioProgress,
  useAutoPlayCountdown,
  useQuestionTimer,
} from "./cockpit-hooks";
import {
  audioLabel,
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
  const reviewReadyAtRef = useRef(0);
  const enterReleasedRef = useRef(true);
  const previousPhaseRef = useRef(INITIAL_STATE.phase);
  const liveDraftRef = useRef("");
  const [open, setOpen] = useState(true);
  const [panel, setPanelState] = useState<Panel>("none");
  const [commandBusy, setCommandBusy] = useState(false);
  const [onboardDismissed, setOnboardDismissed] = useState(false);
  const [state, setState] = useState<CockpitViewState>(INITIAL_STATE);

  const timerIdentityKey = state.identity
    ? `${state.identity.predictionEdition}:${state.identity.questionId}`
    : "";
  const { autoPlayIn, autoPlayInRef } = useAutoPlayCountdown({
    open,
    phase: state.phase,
    audioStatus: state.audioStatus,
    timerIdentityKey,
    controllerRef,
    audioBoxRef,
    audioFillRef,
  });
  useQuestionTimer(timerIdentityKey, timerRef);
  useAudioProgress({
    open,
    audioStatus: state.audioStatus,
    controllerRef,
    audioBoxRef,
    audioFillRef,
    audioTimeRef,
  });

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
    [closeCommand, setPanel, autoPlayInRef],
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
    autoPlayInRef,
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
            }}
          />
          <span className="answer-foot">
            <output ref={wordCountRef}>Total Word Count: 0</output>
            <span>
              <kbd>Ctrl Enter</kbd> 提交
            </span>
          </span>
        </label>

        {state.phase === "SUBMITTING" && !review && <ScoreSkeleton />}

        {review && (
          <ReviewCard
            review={review}
            focused={state.phase === "REVIEW"}
            reviewRef={reviewRef}
          />
        )}
      </section>

      <ExamFooter
        state={state}
        autoPlayIn={autoPlayIn}
        phaseStatusRef={phaseStatusRef}
        controllerRef={controllerRef}
        onMenuToggle={() => {
          if (state.phase === "COMMAND") closeCommand();
          else openCommand();
        }}
      />

      {(state.indexStatus === "INDEXING" || state.indexStatus === "PAUSED") && (
        <IndexControlBar
          indexStatus={state.indexStatus}
          controllerRef={controllerRef}
        />
      )}

      {state.fault && (
        <RecoveryCard
          fault={state.fault}
          keymap={state.keymap}
          showHelp={panel === "help"}
          onRetry={() => {
            setPanel("none");
            void controllerRef.current?.initialize();
          }}
          onOriginalSite={() => {
            setPanel("none");
            toggleOpen(false);
          }}
          onHelp={() => setPanel("help")}
        />
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
