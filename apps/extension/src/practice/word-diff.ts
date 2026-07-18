import type { AttemptError } from "@pte-pilot/contracts";
import type { ScoreSegment } from "../domain/types";

export interface WordDiffResult {
  expectedTokens: string[];
  actualTokens: string[];
  correctCount: number;
  accuracy: number;
  errors: AttemptError[];
  segments: ScoreSegment[];
}

export function tokenizeWords(value: string): string[] {
  return value
    .normalize("NFKC")
    .replace(/[’]/gu, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

const normalized = (value: string): string => value.toLocaleLowerCase("en-AU");

function levenshtein(left: string, right: string): number {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  const current = Array<number>(right.length + 1).fill(0);
  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        (previous[column] ?? 0) + 1,
        (current[column - 1] ?? 0) + 1,
        (previous[column - 1] ?? 0) + cost,
      );
    }
    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column] ?? 0;
    }
  }
  return previous[right.length] ?? 0;
}

function stem(value: string): string {
  const word = normalized(value);
  for (const suffix of ["ing", "ied", "ed", "es", "s"] as const) {
    if (word.length - suffix.length < 3 || !word.endsWith(suffix)) continue;
    return suffix === "ied"
      ? `${word.slice(0, -suffix.length)}y`
      : word.slice(0, -suffix.length);
  }
  return word;
}

/*
 * A missed answer word and a wrong typed word are only paired when they are
 * plausibly the same word (shared stem, or within the spelling distance
 * budget). Distant words stay a separate omission plus an extra word, which
 * matches how the exam scorer presents them.
 */
function pairType(
  expected: string,
  actual: string,
): AttemptError["type"] | null {
  if (stem(expected) === stem(actual)) return "word_form";
  const expectedWord = normalized(expected);
  const actualWord = normalized(actual);
  const limit = Math.max(
    1,
    Math.floor(Math.max(expectedWord.length, actualWord.length) * 0.25),
  );
  return levenshtein(expectedWord, actualWord) <= limit ? "spelling" : null;
}

/*
 * Real PTE Write From Dictation scoring: one point for every answer word
 * that appears (correctly spelled) anywhere in the response. Word order is
 * irrelevant and wrong or extra words are never penalised — probing
 * abbreviations before the sentence cost nothing. The rendered line mirrors
 * the exam report: the response in typed order with hits in green and
 * misses struck through, and each omitted answer word inserted in brackets
 * before its closest misspelling (or appended when none exists).
 */
export function diffWords(
  expectedText: string,
  actualText: string,
): WordDiffResult {
  const expectedTokens = tokenizeWords(expectedText);
  const actualTokens = tokenizeWords(actualText);

  const pool = new Map<string, string[]>();
  for (const token of expectedTokens) {
    const key = normalized(token);
    const queue = pool.get(key);
    if (queue) queue.push(token);
    else pool.set(key, [token]);
  }

  const marks = actualTokens.map((token) => {
    const queue = pool.get(normalized(token));
    if (queue && queue.length > 0) {
      queue.shift();
      return { token, hit: true };
    }
    return { token, hit: false };
  });
  const correctCount = marks.filter((mark) => mark.hit).length;

  const leftovers: Array<{ display: string; pairedIndex: number | null }> = [];
  for (const queue of pool.values()) {
    for (const display of queue) {
      leftovers.push({ display, pairedIndex: null });
    }
  }

  const errors: AttemptError[] = [];
  marks.forEach((mark, index) => {
    if (mark.hit) return;
    let best: {
      leftover: (typeof leftovers)[number];
      distance: number;
    } | null = null;
    for (const leftover of leftovers) {
      if (leftover.pairedIndex !== null) continue;
      if (pairType(leftover.display, mark.token) === null) continue;
      const distance = levenshtein(
        normalized(leftover.display),
        normalized(mark.token),
      );
      if (!best || distance < best.distance) best = { leftover, distance };
    }
    if (best) {
      best.leftover.pairedIndex = index;
      errors.push({
        expected: best.leftover.display,
        actual: mark.token,
        type: pairType(best.leftover.display, mark.token) ?? "spelling",
      });
    } else {
      errors.push({ expected: "", actual: mark.token, type: "extra" });
    }
  });
  for (const leftover of leftovers) {
    if (leftover.pairedIndex === null) {
      errors.push({ expected: leftover.display, actual: "", type: "missing" });
    }
  }

  const insertions = new Map<number, string[]>();
  const trailing: string[] = [];
  for (const leftover of leftovers) {
    if (leftover.pairedIndex !== null) {
      const queue = insertions.get(leftover.pairedIndex);
      if (queue) queue.push(leftover.display);
      else insertions.set(leftover.pairedIndex, [leftover.display]);
    } else {
      trailing.push(leftover.display);
    }
  }

  const segments: ScoreSegment[] = [];
  marks.forEach((mark, index) => {
    for (const omitted of insertions.get(index) ?? []) {
      segments.push({ kind: "omit", text: omitted });
    }
    segments.push({ kind: mark.hit ? "correct" : "error", text: mark.token });
  });
  for (const omitted of trailing) {
    segments.push({ kind: "omit", text: omitted });
  }

  return {
    expectedTokens,
    actualTokens,
    correctCount,
    accuracy:
      expectedTokens.length === 0 ? 1 : correctCount / expectedTokens.length,
    errors,
    segments,
  };
}
