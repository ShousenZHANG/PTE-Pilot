import type { AttemptError } from "@pte-pilot/contracts";

export interface WordDiffResult {
  expectedTokens: string[];
  actualTokens: string[];
  correctCount: number;
  accuracy: number;
  errors: AttemptError[];
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

function classify(expected: string, actual: string): AttemptError["type"] {
  if (stem(expected) === stem(actual)) return "word_form";
  const expectedWord = normalized(expected);
  const actualWord = normalized(actual);
  const distance = levenshtein(expectedWord, actualWord);
  const spellingLimit = Math.max(
    1,
    Math.floor(Math.max(expectedWord.length, actualWord.length) * 0.25),
  );
  return distance <= spellingLimit ? "spelling" : "substitution";
}

function sameMultiset(
  expected: readonly string[],
  actual: readonly string[],
): boolean {
  if (expected.length !== actual.length) return false;
  const left = expected.map(normalized).sort();
  const right = actual.map(normalized).sort();
  return left.every((word, index) => word === right[index]);
}

function lcsPairs(
  expected: readonly string[],
  actual: readonly string[],
): Array<readonly [number, number]> {
  const table = Array.from({ length: expected.length + 1 }, () =>
    Array<number>(actual.length + 1).fill(0),
  );
  for (let row = expected.length - 1; row >= 0; row -= 1) {
    for (let column = actual.length - 1; column >= 0; column -= 1) {
      const currentRow = table[row];
      if (!currentRow) continue;
      currentRow[column] =
        normalized(expected[row] ?? "") === normalized(actual[column] ?? "")
          ? (table[row + 1]?.[column + 1] ?? 0) + 1
          : Math.max(
              table[row + 1]?.[column] ?? 0,
              currentRow[column + 1] ?? 0,
            );
    }
  }

  const pairs: Array<readonly [number, number]> = [];
  let row = 0;
  let column = 0;
  while (row < expected.length && column < actual.length) {
    if (normalized(expected[row] ?? "") === normalized(actual[column] ?? "")) {
      pairs.push([row, column]);
      row += 1;
      column += 1;
    } else if (
      (table[row + 1]?.[column] ?? 0) >= (table[row]?.[column + 1] ?? 0)
    ) {
      row += 1;
    } else {
      column += 1;
    }
  }
  return pairs;
}

function accuracyFor(
  correctCount: number,
  expectedCount: number,
  actualCount: number,
): number {
  const denominator = Math.max(expectedCount, actualCount);
  return denominator === 0 ? 1 : correctCount / denominator;
}

export function diffWords(
  expectedText: string,
  actualText: string,
): WordDiffResult {
  const expectedTokens = tokenizeWords(expectedText);
  const actualTokens = tokenizeWords(actualText);

  if (sameMultiset(expectedTokens, actualTokens)) {
    const errors = expectedTokens.flatMap<AttemptError>((expected, index) => {
      const actual = actualTokens[index] ?? "";
      return normalized(expected) === normalized(actual)
        ? []
        : [{ expected, actual, type: "order" }];
    });
    const correctCount = expectedTokens.length - errors.length;
    return {
      expectedTokens,
      actualTokens,
      correctCount,
      accuracy: accuracyFor(
        correctCount,
        expectedTokens.length,
        actualTokens.length,
      ),
      errors,
    };
  }

  const pairs = lcsPairs(expectedTokens, actualTokens);
  const errors: AttemptError[] = [];
  let expectedCursor = 0;
  let actualCursor = 0;
  const boundaries: Array<readonly [number, number]> = [
    ...pairs,
    [expectedTokens.length, actualTokens.length],
  ];
  for (const [expectedMatch, actualMatch] of boundaries) {
    const expectedGap = expectedTokens.slice(expectedCursor, expectedMatch);
    const actualGap = actualTokens.slice(actualCursor, actualMatch);
    const paired = Math.min(expectedGap.length, actualGap.length);
    for (let index = 0; index < paired; index += 1) {
      const expected = expectedGap[index];
      const actual = actualGap[index];
      if (expected !== undefined && actual !== undefined) {
        errors.push({ expected, actual, type: classify(expected, actual) });
      }
    }
    for (const expected of expectedGap.slice(paired)) {
      errors.push({ expected, actual: "", type: "missing" });
    }
    for (const actual of actualGap.slice(paired)) {
      errors.push({ expected: "", actual, type: "extra" });
    }
    expectedCursor = expectedMatch + 1;
    actualCursor = actualMatch + 1;
  }

  const correctCount = pairs.length;
  return {
    expectedTokens,
    actualTokens,
    correctCount,
    accuracy: accuracyFor(
      correctCount,
      expectedTokens.length,
      actualTokens.length,
    ),
    errors,
  };
}
