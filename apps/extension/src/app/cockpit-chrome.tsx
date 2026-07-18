import {
  enumerateSegments,
  isActionablePhase,
  isTransitionFocusState,
} from "./cockpit-presentation";
import { HelpPanel } from "./panels/HelpPanel";
import type {
  CockpitViewState,
  PracticeController,
} from "./practice-controller";

type ControllerRef = React.RefObject<PracticeController | null>;

export function ScoreSkeleton(): React.JSX.Element {
  return (
    <section className="review review--skeleton" aria-hidden="true">
      <header className="review__head">
        <strong className="review__title">AI 评分</strong>
        <span className="review__legend">正在评分…</span>
      </header>
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </section>
  );
}

export function ReviewCard({
  review,
  focused,
  reviewRef,
}: {
  review: NonNullable<CockpitViewState["review"]>;
  focused: boolean;
  reviewRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element {
  const scorePercent =
    review.totalWords > 0
      ? Math.round((review.correctCount / review.totalWords) * 100)
      : 100;
  return (
    <section
      className="review"
      ref={reviewRef}
      tabIndex={focused ? 0 : -1}
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
        <p className="review__translation" data-testid="review-translation">
          {review.translation}
        </p>
      )}
      <p className="review__next">
        <kbd>Enter</kbd> 下一题 · <kbd>T</kbd> 重做 · <kbd>K</kbd> 上一题 ·{" "}
        <kbd>R</kbd> 重播
      </p>
    </section>
  );
}

export function ExamFooter({
  state,
  autoPlayIn,
  phaseStatusRef,
  controllerRef,
  onMenuToggle,
}: {
  state: CockpitViewState;
  autoPlayIn: number | null;
  phaseStatusRef: React.RefObject<HTMLSpanElement | null>;
  controllerRef: ControllerRef;
  onMenuToggle: () => void;
}): React.JSX.Element {
  const identity = state.identity;
  return (
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
          onClick={onMenuToggle}
        >
          菜单 <kbd>Esc</kbd>
        </button>
        <button
          type="button"
          className="fbtn"
          disabled={
            !isActionablePhase(state.phase) || !identity || autoPlayIn !== null
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
            !isActionablePhase(state.phase) || !identity || autoPlayIn !== null
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
  );
}

export function IndexControlBar({
  indexStatus,
  controllerRef,
}: {
  indexStatus: CockpitViewState["indexStatus"];
  controllerRef: ControllerRef;
}): React.JSX.Element {
  return (
    <section className="index-control" aria-live="polite">
      <strong>
        {indexStatus === "PAUSED" ? "索引已暂停" : "正在建立完整索引"}
      </strong>
      <span>
        {indexStatus === "PAUSED" ? "Enter / R 继续" : "Esc 暂停"}
        {" · "}X 取消
      </span>
      {indexStatus === "PAUSED" ? (
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
  );
}

export function RecoveryCard({
  fault,
  keymap,
  showHelp,
  onRetry,
  onOriginalSite,
  onHelp,
}: {
  fault: NonNullable<CockpitViewState["fault"]>;
  keymap: CockpitViewState["keymap"];
  showHelp: boolean;
  onRetry: () => void;
  onOriginalSite: () => void;
  onHelp: () => void;
}): React.JSX.Element {
  return (
    <section className="recovery" role="alert">
      <strong>{fault.code}</strong>
      <p>{fault.message}</p>
      <button type="button" data-testid="recovery-retry" onClick={onRetry}>
        <kbd>R</kbd> 重试
      </button>
      <button
        type="button"
        data-testid="recovery-original-site"
        onClick={onOriginalSite}
      >
        <kbd>O</kbd> 返回原网页
      </button>
      <button type="button" data-testid="recovery-help" onClick={onHelp}>
        <kbd>?</kbd> 诊断帮助
      </button>
      {fault.code === "DESYNC" && (
        <p>
          <kbd>Alt {keymap.next?.toUpperCase()}</kbd> 下一题 ·{" "}
          <kbd>Alt {keymap.previous?.toUpperCase()}</kbd> 上一题
        </p>
      )}
      {showHelp && (
        <div className="recovery__help">
          <HelpPanel keymap={keymap} />
        </div>
      )}
    </section>
  );
}
