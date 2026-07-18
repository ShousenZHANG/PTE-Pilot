import { describe, expect, test } from "vitest";
import { isTrainableWord } from "./word-filter";

describe("word-library admission", () => {
  test("accepts long content words", () => {
    for (const word of [
      "important",
      "economic",
      "assignments",
      "Feedback",
      "sustainable",
    ]) {
      expect(isTrainableWord(word)).toBe(true);
    }
  });

  test("rejects probe letters and short words", () => {
    for (const word of ["a", "b", "of", "an", "the", "it", "up"]) {
      expect(isTrainableWord(word)).toBe(false);
    }
  });

  test("rejects long function words regardless of length", () => {
    for (const word of [
      "before",
      "between",
      "should",
      "their",
      "because",
      "There",
    ]) {
      expect(isTrainableWord(word)).toBe(false);
    }
  });

  test("rejects empty and whitespace input", () => {
    expect(isTrainableWord("")).toBe(false);
    expect(isTrainableWord("   ")).toBe(false);
  });
});
