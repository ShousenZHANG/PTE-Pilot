import type { PracticePhase } from "../domain/types";

export type ConfigurableKeyAction =
  | "play"
  | "restart"
  | "next"
  | "previous"
  | "mark";

export const DEFAULT_ALT_KEYMAP: Record<ConfigurableKeyAction, string> = {
  play: "p",
  restart: "r",
  next: "j",
  previous: "k",
  mark: "m",
};

export type KeyboardAction =
  | "toggle-overlay"
  | "submit"
  | ConfigurableKeyAction
  | "open-command"
  | "close-command"
  | "redo"
  | "toggle-mode"
  | "ranked-review"
  | "word-library"
  | "settings"
  | "build-index"
  | "focus-input"
  | "help"
  | "retry"
  | "original-site"
  | "pause-index"
  | "resume-index"
  | "cancel-index";

export interface KeyboardContext {
  phase: PracticePhase;
  overlayOpen: boolean;
  nowMs: number;
  reviewReadyAtMs: number;
  enterReleased: boolean;
  keymap?: Record<string, string>;
  editingCommandField?: boolean;
  indexStatus?: string;
}

export interface RoutedKey {
  action: KeyboardAction | null;
  consume: boolean;
}

type RoutedEvent = Pick<
  KeyboardEvent,
  | "key"
  | "code"
  | "altKey"
  | "shiftKey"
  | "ctrlKey"
  | "metaKey"
  | "repeat"
  | "isComposing"
>;

export function routeKeyboard(
  event: RoutedEvent,
  context: KeyboardContext,
): RoutedKey {
  const lower = event.key.toLocaleLowerCase("en-AU");
  const globalToggle =
    lower === "p" &&
    event.altKey &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey;
  if (globalToggle) {
    return {
      action: event.repeat || event.isComposing ? null : "toggle-overlay",
      consume: true,
    };
  }
  if (
    !context.overlayOpen ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return { action: null, consume: false };
  }

  const mapped = { ...DEFAULT_ALT_KEYMAP, ...context.keymap };
  if (
    context.phase === "COMMAND" &&
    context.editingCommandField &&
    event.key !== "Escape"
  ) {
    return { action: null, consume: false };
  }
  const routed = routeForPhase(event, context, mapped);
  if (event.repeat && routed.action) return { action: null, consume: true };
  return routed;
}

function routeForPhase(
  event: RoutedEvent,
  context: KeyboardContext,
  keymap: Record<string, string>,
): RoutedKey {
  const lower = event.key.toLocaleLowerCase("en-AU");
  if (context.phase === "ANSWERING") {
    if (noModifiers(event) && event.key === "Enter") return action("submit");
    if (noModifiers(event) && event.key === "Escape")
      return action("open-command");
    if (onlyAlt(event)) {
      for (const command of Object.keys(
        DEFAULT_ALT_KEYMAP,
      ) as ConfigurableKeyAction[]) {
        if (lower === keymap[command]?.toLocaleLowerCase("en-AU"))
          return action(command);
      }
    }
    return { action: null, consume: false };
  }

  if (context.phase === "REVIEW") {
    if (!noModifiers(event)) return { action: null, consume: false };
    const reviewAction =
      event.key === "Enter" || lower === "j"
        ? "next"
        : lower === "k"
          ? "previous"
          : event.code === "Space"
            ? "play"
            : lower === "r"
              ? "restart"
              : lower === "t"
                ? "redo"
                : lower === "m"
                  ? "mark"
                  : event.key === "Escape"
                    ? "open-command"
                    : null;
    if (!reviewAction) return { action: null, consume: false };
    const ready =
      context.enterReleased && context.nowMs >= context.reviewReadyAtMs;
    return ready ? action(reviewAction) : { action: null, consume: true };
  }

  if (context.phase === "COMMAND") {
    if (!noModifiers(event) && !(event.key === "?" && event.shiftKey))
      return { action: null, consume: false };
    if (event.key === "Escape") return action("close-command");
    if (lower === "p") return action("play");
    if (lower === "r") return action("restart");
    if (lower === "j") return action("next");
    if (lower === "k") return action("previous");
    if (lower === "m") return action("mark");
    if (lower === "e") return action("toggle-mode");
    if (lower === "q") return action("ranked-review");
    if (lower === "w") return action("word-library");
    if (lower === "s") return action("settings");
    if (lower === "b") return action("build-index");
    if (lower === "i") return action("focus-input");
    if (event.key === "?") return action("help");
    return { action: null, consume: false };
  }

  if (context.phase === "NAVIGATING") {
    if (!noModifiers(event)) return { action: null, consume: false };
    if (context.indexStatus === "INDEXING") {
      if (event.key === "Escape") return action("pause-index");
      if (lower === "x") return action("cancel-index");
    }
    if (context.indexStatus === "PAUSED") {
      if (event.key === "Enter" || lower === "r") return action("resume-index");
      if (lower === "x") return action("cancel-index");
    }
    return { action: null, consume: false };
  }

  if (context.phase === "DESYNC" && onlyAlt(event)) {
    if (lower === keymap.next?.toLocaleLowerCase("en-AU"))
      return action("next");
    if (lower === keymap.previous?.toLocaleLowerCase("en-AU"))
      return action("previous");
  }

  if (new Set(["AUTH_REQUIRED", "DESYNC", "SITE_CHANGED"]).has(context.phase)) {
    if (!noModifiers(event) && !(event.key === "?" && event.shiftKey))
      return { action: null, consume: false };
    if (lower === "r") return action("retry");
    if (lower === "o") return action("original-site");
    if (event.key === "?") return action("help");
  }
  return { action: null, consume: false };
}

export function findKeymapCollisions(
  keymap: Record<string, string>,
): string[][] {
  const byKey = new Map<string, string[]>();
  for (const [command, key] of Object.entries(keymap)) {
    const normalized = key.trim().toLocaleLowerCase("en-AU");
    if (!normalized) continue;
    const commands = byKey.get(normalized) ?? [];
    commands.push(command);
    byKey.set(normalized, commands);
  }
  return [...byKey.values()].filter((commands) => commands.length > 1);
}

export function isValidKeymap(keymap: Record<string, string>): boolean {
  return (
    Object.values(keymap).every((key) => /^[a-z]$/iu.test(key.trim())) &&
    findKeymapCollisions(keymap).length === 0
  );
}

function action(value: KeyboardAction): RoutedKey {
  return { action: value, consume: true };
}

function noModifiers(
  event: Pick<KeyboardEvent, "altKey" | "shiftKey" | "ctrlKey" | "metaKey">,
): boolean {
  return !event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;
}

function onlyAlt(
  event: Pick<KeyboardEvent, "altKey" | "shiftKey" | "ctrlKey" | "metaKey">,
): boolean {
  return event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;
}
