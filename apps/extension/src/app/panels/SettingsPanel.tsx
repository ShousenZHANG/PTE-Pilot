import { useState } from "react";
import {
  type ConfigurableKeyAction,
  DEFAULT_ALT_KEYMAP,
  findKeymapCollisions,
} from "../keyboard";
import type {
  CockpitViewState,
  PracticeController,
} from "../practice-controller";

export function SettingsPanel({
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

function commandLabel(command: ConfigurableKeyAction): string {
  return {
    play: "播放",
    restart: "重播",
    next: "下一题",
    previous: "上一题",
    mark: "标记",
  }[command];
}
