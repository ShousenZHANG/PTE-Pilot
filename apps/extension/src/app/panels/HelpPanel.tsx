export function HelpPanel({
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
