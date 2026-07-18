import { describe, expect, test } from "vitest";
import { diffWords, tokenizeWords } from "./word-diff";

describe("tokenizeWords", () => {
  test("strips punctuation, keeps apostrophes, splits on whitespace", () => {
    expect(tokenizeWords("It's a test, isn't it?")).toEqual([
      "It's",
      "a",
      "test",
      "isn't",
      "it",
    ]);
  });
});

describe("diffWords — real exam bag-of-words scoring", () => {
  test("word order is irrelevant: shuffled answers score full marks", () => {
    const result = diffWords("first second third", "third first second");
    expect(result.correctCount).toBe(3);
    expect(result.accuracy).toBe(1);
    expect(result.errors).toEqual([]);
  });

  test("extra and probe words are never penalised", () => {
    const result = diffWords("write sentence", "write sentence now");
    expect(result.correctCount).toBe(2);
    expect(result.accuracy).toBe(1);
    expect(result.errors).toContainEqual({
      expected: "",
      actual: "now",
      type: "extra",
    });
  });

  test("case differences do not cost points", () => {
    const result = diffWords("Students arrive.", "students arrive");
    expect(result.correctCount).toBe(2);
    expect(result.accuracy).toBe(1);
  });

  test("replicates the exam report for a probed-abbreviation answer", () => {
    const result = diffWords(
      "All industries are a system of inputs, processes, outputs and feedback.",
      "a i a a s i p o a f All industries are an system a of inputs processes ouputs and feedback",
    );

    expect(result.expectedTokens).toHaveLength(11);
    expect(result.correctCount).toBe(10);
    expect(result.errors).toContainEqual({
      expected: "outputs",
      actual: "ouputs",
      type: "spelling",
    });
    expect(
      result.errors.filter((error) => error.type === "missing"),
    ).toHaveLength(0);

    // The omitted word is bracketed right before its misspelling.
    const kinds = result.segments.map(
      (segment) => `${segment.kind}:${segment.text}`,
    );
    const omitIndex = kinds.indexOf("omit:outputs");
    expect(kinds[omitIndex + 1]).toBe("error:ouputs");
    // The first probe letter "a" consumes the answer's "a" and counts.
    expect(kinds[0]).toBe("correct:a");
  });

  test("a distant wrong word stays an omission plus an extra word", () => {
    const result = diffWords(
      "Students should submit their assignments before Friday",
      "Students should submit their assignments by Friday",
    );
    expect(result.correctCount).toBe(6);
    expect(result.accuracy).toBeCloseTo(6 / 7);
    expect(result.errors).toContainEqual({
      expected: "before",
      actual: "",
      type: "missing",
    });
    expect(result.errors).toContainEqual({
      expected: "",
      actual: "by",
      type: "extra",
    });
    const kinds = result.segments.map(
      (segment) => `${segment.kind}:${segment.text}`,
    );
    expect(kinds).toContain("error:by");
    expect(kinds).toContain("omit:before");
  });

  test("pairs near-misses for the word library (stem and spelling)", () => {
    const wordForm = diffWords("they walked home", "they walk home");
    expect(wordForm.errors).toContainEqual({
      expected: "walked",
      actual: "walk",
      type: "word_form",
    });

    const spelling = diffWords("economic growth", "econimic growth");
    expect(spelling.correctCount).toBe(1);
    expect(spelling.errors).toContainEqual({
      expected: "economic",
      actual: "econimic",
      type: "spelling",
    });
  });

  test("duplicate answer words need duplicate hits", () => {
    const result = diffWords("the more the better", "the more better");
    expect(result.correctCount).toBe(3);
    expect(result.errors).toContainEqual({
      expected: "the",
      actual: "",
      type: "missing",
    });
  });

  test("is deterministic for identical input", () => {
    const first = diffWords("write sentence", "write sentence now");
    expect(diffWords("write sentence", "write sentence now")).toEqual(first);
  });
});
