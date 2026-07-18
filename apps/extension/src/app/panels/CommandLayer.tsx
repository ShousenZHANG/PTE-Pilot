import type { KeyboardAction } from "../keyboard";
import type {
  CockpitViewState,
  PracticeController,
} from "../practice-controller";
import { HelpPanel } from "./HelpPanel";
import { RankedReview } from "./RankedReview";
import { SettingsPanel } from "./SettingsPanel";
import { WordTrainer } from "./WordTrainer";

export type Panel = "none" | "words" | "settings" | "help" | "ranked";

export function CommandLayer({
  panel,
  state,
  controller,
  busy,
  onAction,
  onChoose,
  onStartWrong,
  onExitQueue,
  commandRef,
}: {
  panel: Panel;
  state: CockpitViewState;
  controller: PracticeController | null;
  busy: boolean;
  onAction: (action: KeyboardAction) => void;
  onChoose: (questionId: string) => void;
  onStartWrong: (questionIds: string[]) => void;
  onExitQueue: () => void;
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
          <kbd>Q</kbd> 错题集
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
            queueActive={state.reviewQueue !== null}
            onChoose={onChoose}
            onStartWrong={onStartWrong}
            onExitQueue={onExitQueue}
          />
        )}
        {panel === "help" && <HelpPanel keymap={state.keymap} />}
      </div>
    </aside>
  );
}
