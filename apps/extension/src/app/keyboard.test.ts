import { describe, expect, it } from "vitest";
import { type KeyboardContext, routeKeyboard } from "./keyboard";

const baseContext: KeyboardContext = {
  phase: "ANSWERING",
  overlayOpen: true,
  nowMs: 1_000,
  reviewReadyAtMs: 0,
  enterReleased: true,
};

function key(
  value: string,
  context: Partial<KeyboardContext> = {},
  modifiers: Partial<KeyboardEvent> = {},
) {
  return routeKeyboard(
    {
      key: value,
      code: value === " " ? "Space" : `Key${value.toUpperCase()}`,
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      repeat: false,
      isComposing: false,
      ...modifiers,
    },
    { ...baseContext, ...context },
  );
}

describe("routeKeyboard", () => {
  it("leaves printable answer input native and routes only explicit shortcuts", () => {
    expect(key("a")).toEqual({ action: null, consume: false });
    expect(key("Enter")).toEqual({ action: "submit", consume: true });
    expect(key("p", {}, { altKey: true })).toEqual({
      action: "play",
      consume: true,
    });
  });

  it("does not execute command keys while editing a settings field", () => {
    expect(key("s", { phase: "COMMAND", editingCommandField: true })).toEqual({
      action: null,
      consume: false,
    });
    expect(
      key("Escape", { phase: "COMMAND", editingCommandField: true }),
    ).toEqual({ action: "close-command", consume: true });
  });

  it("guards review navigation until Enter was released and debounce elapsed", () => {
    expect(
      key("Enter", {
        phase: "REVIEW",
        enterReleased: false,
      }),
    ).toEqual({ action: null, consume: true });
    expect(
      key("Enter", {
        phase: "REVIEW",
        nowMs: 100,
        reviewReadyAtMs: 400,
      }),
    ).toEqual({ action: null, consume: true });
    expect(key("Enter", { phase: "REVIEW" })).toEqual({
      action: "next",
      consume: true,
    });
  });

  it("pauses, resumes, and cancels controlled indexing from the keyboard", () => {
    expect(key("b", { phase: "COMMAND" })).toEqual({
      action: "build-index",
      consume: true,
    });
    expect(
      key("Escape", { phase: "NAVIGATING", indexStatus: "INDEXING" }),
    ).toEqual({ action: "pause-index", consume: true });
    expect(
      key("Enter", { phase: "NAVIGATING", indexStatus: "PAUSED" }),
    ).toEqual({ action: "resume-index", consume: true });
    expect(key("x", { phase: "NAVIGATING", indexStatus: "PAUSED" })).toEqual({
      action: "cancel-index",
      consume: true,
    });
  });

  it("keeps the global overlay toggle available while the overlay is closed", () => {
    expect(
      key("p", { overlayOpen: false }, { altKey: true, shiftKey: true }),
    ).toEqual({ action: "toggle-overlay", consume: true });
  });
});
