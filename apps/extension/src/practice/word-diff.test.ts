import { describe, expect, test } from "vitest";
import { diffWords } from "./word-diff";

describe("diffWords", () => {
  test.each([
    ["write the sentence", "write sentence", "missing"],
    ["write sentence", "write the sentence", "extra"],
    ["write the sentence", "write the sentense", "spelling"],
    ["many students arrived", "many student arrived", "word_form"],
    ["the lecture starts", "the seminar starts", "substitution"],
  ] as const)("classifies %s against %s as %s", (expected, actual, type) => {
    expect(diffWords(expected, actual).errors).toContainEqual(
      expect.objectContaining({ type }),
    );
  });

  test("marks reordered words without treating them as new vocabulary", () => {
    expect(
      diffWords("the lecture starts", "lecture the starts").errors,
    ).toEqual([
      { expected: "the", actual: "lecture", type: "order" },
      { expected: "lecture", actual: "the", type: "order" },
    ]);
  });

  test("normalizes case and punctuation but preserves display tokens", () => {
    const result = diffWords("Students arrive.", "students arrive");
    expect(result.accuracy).toBe(1);
    expect(result.expectedTokens).toEqual(["Students", "arrive"]);
  });

  test("penalizes extra words and remains deterministic", () => {
    const first = diffWords("write sentence", "write sentence now");
    expect(first.accuracy).toBeCloseTo(2 / 3);
    expect(first.errors).toContainEqual({
      expected: "",
      actual: "now",
      type: "extra",
    });
    expect(diffWords("write sentence", "write sentence now")).toEqual(first);
  });
});
