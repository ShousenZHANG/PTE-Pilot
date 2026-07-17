import { describe, expect, test } from "vitest";
import { drillSkip, drillType, startDrill } from "./word-drill";

const words = [
  { key: "before:by:substitution", expected: "before" },
  { key: "beautiful::missing", expected: "beautiful" },
];

describe("word drill", () => {
  test("accepts case-insensitive prefixes and keeps the raw typing", () => {
    let state = startDrill(words);
    const step = drillType(state, "Bef");
    expect(step.rejected).toBe(false);
    expect(step.state.typed).toBe("Bef");
    state = step.state;
    expect(drillType(state, "Befx").rejected).toBe(true);
  });

  test("rejected keystrokes count errors without losing progress", () => {
    const state = startDrill(words);
    const wrong = drillType(state, "x");
    expect(wrong.rejected).toBe(true);
    expect(wrong.state.typed).toBe("");
    expect(wrong.state.totalErrors).toBe(1);
    expect(wrong.state.index).toBe(0);
  });

  test("completing a word advances and completing the set finishes", () => {
    let state = startDrill(words);
    const first = drillType(state, "before");
    expect(first.advanced).toBe(true);
    state = first.state;
    expect(state.index).toBe(1);
    expect(state.typed).toBe("");
    expect(state.results).toEqual([
      { expected: "before", errors: 0, skipped: false },
    ]);

    const second = drillType(state, "BEAUTIFUL");
    expect(second.advanced).toBe(true);
    expect(second.state.completed).toBe(true);
    expect(second.state.results).toHaveLength(2);
  });

  test("skip records the word as skipped with its error count", () => {
    let state = startDrill(words);
    state = drillType(state, "z").state;
    state = drillSkip(state);
    expect(state.index).toBe(1);
    expect(state.results[0]).toEqual({
      expected: "before",
      errors: 1,
      skipped: true,
    });
    expect(state.wordErrors).toBe(0);
  });

  test("empty selection starts already completed", () => {
    expect(startDrill([]).completed).toBe(true);
  });
});
