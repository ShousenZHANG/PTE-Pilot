import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeMode } from "../domain/types";
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
  PracticeController,
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
  rankedQuestionIds: [],
  keymap: { ...DEFAULT_ALT_KEYMAP },
  fault: null,
};

const WAVE_BARS = Array.from({ length: 24 }, (_, index) => `wave-${index + 1}`);

export function Cockpit(): React.JSX.Element | null {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerShellRef = useRef<HTMLLabelElement>(null);
  const impactFlipRef = useRef(false);
  const reviewRef = useRef<HTMLElement>(null);
  const commandRef = useRef<HTMLElement>(null);
  const phaseStatusRef = useRef<HTMLSpanElement>(null);
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
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            P
          </span>
          <span>PTE Pilot</span>
        </div>
        <dl className="question-meta">
          <div>
            <dt>模式</dt>
            <dd data-testid="practice-mode">
              {state.mode === "practice" ? "Practice" : "Exam"}
            </dd>
          </div>
          <div>
            <dt>题号</dt>
            <dd data-testid="question-id">{identity?.questionId ?? "—"}</dd>
          </div>
          <div>
            <dt>进度</dt>
            <dd data-testid="question-position">
              {identity ? `${identity.position}/${identity.total}` : "—"}
            </dd>
          </div>
        </dl>
        <button
          className="quiet-button"
          type="button"
          onClick={() => toggleOpen(false)}
          aria-label="返回萤火虫原网页"
        >
          <kbd>Alt Shift P</kbd> 关闭
        </button>
      </header>

      <section
        className={`practice-deck${state.review ? " practice-deck--review" : ""}`}
      >
        <div className="audio-ribbon">
          <div
            className={`wave wave--${state.audioStatus.toLocaleLowerCase("en-AU")}`}
            aria-hidden="true"
          >
            {WAVE_BARS.map((bar) => (
              <i key={bar} />
            ))}
          </div>
          <div>
            <span className="eyebrow">萤火虫原音频</span>
            <strong data-testid="audio-status">
              {audioLabel(state.audioStatus, state.mode)}
            </strong>
          </div>
          <div className="key-hints" aria-hidden="true">
            <kbd>Alt {state.keymap.play?.toUpperCase()}</kbd> 播放 / 暂停
            <kbd>Alt {state.keymap.restart?.toUpperCase()}</kbd> 重播
          </div>
        </div>

        <label className="answer-shell" ref={answerShellRef}>
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
                ? "Type exactly what you hear."
                : "听完即写。Enter 提交，Esc 打开命令层。"
            }
            onInput={(event) => {
              liveDraftRef.current = event.currentTarget.value;
              updateWordCount(event.currentTarget, wordCountRef.current);
              impactFlipRef.current = !impactFlipRef.current;
              if (answerShellRef.current) {
                answerShellRef.current.dataset.impact = impactFlipRef.current
                  ? "a"
                  : "b";
              }
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              saveTimerRef.current = setTimeout(
                () => void controllerRef.current?.flushDraft(),
                120,
              );
            }}
            onBlur={() => void controllerRef.current?.flushDraft()}
          />
          <span className="answer-footer">
            <output ref={wordCountRef}>0 words</output>
            <span>
              <kbd>Enter</kbd> 提交
            </span>
          </span>
        </label>

        {state.review && (
          <section
            className="review"
            ref={reviewRef}
            tabIndex={state.phase === "REVIEW" ? 0 : -1}
            data-testid="review-result"
            aria-live="polite"
          >
            <div className="review__score">
              <span>准确率</span>
              <strong>{Math.round(state.review.accuracy * 100)}%</strong>
            </div>
            <div className="error-list">
              {state.review.errors.length === 0 ? (
                <p>全部词正确。</p>
              ) : (
                enumerateErrors(state.review.errors).map(({ error, id }) => (
                  <article key={id} className="error-chip">
                    <span>{error.type}</span>
                    <del>{error.actual || "∅"}</del>
                    <ins>{error.expected || "∅"}</ins>
                  </article>
                ))
              )}
            </div>
            <p className="review__next">
              <kbd>Enter</kbd> 下一题 · <kbd>T</kbd> 重做 · <kbd>K</kbd> 上一题
            </p>
          </section>
        )}
      </section>

      <footer className="statusbar">
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
        {panel === "words" && <WordLibrary words={state.words} />}
        {panel === "settings" && controller && (
          <SettingsPanel controller={controller} state={state} />
        )}
        {panel === "ranked" && (
          <RankedReview
            questionIds={state.rankedQuestionIds}
            current={state.identity?.questionId}
            onChoose={onChoose}
          />
        )}
        {panel === "help" && <HelpPanel keymap={state.keymap} />}
      </div>
    </aside>
  );
}

function WordLibrary({
  words,
}: {
  words: CockpitViewState["words"];
}): React.JSX.Element {
  return (
    <section data-testid="word-library">
      <h2>错词库</h2>
      {words.length === 0 ? (
        <p>还没有错词。</p>
      ) : (
        <ol>
          {words.map((word) => (
            <li key={word.key}>
              <strong>{word.expected || "∅"}</strong>
              <span>
                {word.actual || "∅"} · {word.type} · {word.occurrences}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RankedReview({
  questionIds,
  current,
  onChoose,
}: {
  questionIds: string[];
  current: string | undefined;
  onChoose: (questionId: string) => void;
}): React.JSX.Element {
  return (
    <section data-testid="ranked-review">
      <h2>本地复习</h2>
      <p>根据本机错题、准确率和练习时间排列。</p>
      <ol className="rank-list">
        {questionIds.slice(0, 30).map((questionId, index) => (
          <li key={questionId}>
            <button
              type="button"
              disabled={questionId === current}
              onClick={() => onChoose(questionId)}
            >
              <span>#{index + 1}</span>
              {questionId}
              {questionId === current ? " · 当前" : ""}
            </button>
          </li>
        ))}
      </ol>
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

function enumerateErrors(
  errors: NonNullable<CockpitViewState["review"]>["errors"],
): Array<{
  error: NonNullable<CockpitViewState["review"]>["errors"][number];
  id: string;
}> {
  const seen = new Map<string, number>();
  return errors.map((error) => {
    const base = `${error.type}:${error.expected}:${error.actual}`;
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    return { error, id: `${base}:${occurrence}` };
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
  output.value = `${count} words`;
}

function audioLabel(status: string, mode: PracticeMode): string {
  if (mode === "exam")
    return status === "PLAYING" ? "播放中 · 单次" : `考试单次播放 · ${status}`;
  return status;
}
