import { useState } from "react";
import {
  type DrillState,
  drillSkip,
  drillType,
  startDrill,
} from "../../practice/word-drill";
import type { CockpitViewState } from "../practice-controller";

export function WordTrainer({
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
