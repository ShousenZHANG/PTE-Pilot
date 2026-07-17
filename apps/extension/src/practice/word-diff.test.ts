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

  test("segments mirror the exam score line with omit and error marks", () => {
    const result = diffWords(
      "A good architectural structure should be useful durable and beautiful",
      "a good architechture should be useful durable and",
    );

    expect(result.correctCount).toBe(7);
    expect(result.expectedTokens).toHaveLength(10);
    expect(result.segments).toEqual([
      { kind: "correct", text: "A" },
      { kind: "correct", text: "good" },
      { kind: "omit", text: "architectural" },
      { kind: "error", text: "architechture" },
      { kind: "omit", text: "structure" },
      { kind: "correct", text: "should" },
      { kind: "correct", text: "be" },
      { kind: "correct", text: "useful" },
      { kind: "correct", text: "durable" },
      { kind: "correct", text: "and" },
      { kind: "omit", text: "beautiful" },
    ]);
  });

  test("segments keep every correct word when order is the only mistake", () => {
    const result = diffWords("first second", "second first");
    expect(
      result.segments.filter((segment) => segment.kind === "correct"),
    ).toHaveLength(0);
    expect(result.segments).toEqual([
      { kind: "omit", text: "first" },
      { kind: "error", text: "second" },
      { kind: "omit", text: "second" },
      { kind: "error", text: "first" },
    ]);
  });
});
