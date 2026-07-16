import type { AttemptError } from "@pte-pilot/contracts";

export interface DeterministicReview {
  accuracy: number;
  errors: AttemptError[];
}

export function reviewWords(
  actualSentence: string,
  expectedSentence: string,
): DeterministicReview {
  const actual = tokenize(actualSentence);
  const expected = tokenize(expectedSentence);
  const matrix = buildDistanceMatrix(expected, actual);
  const errors: AttemptError[] = [];
  let row = expected.length;
  let column = actual.length;

  while (row > 0 || column > 0) {
    const expectedWord = expected[row - 1];
    const actualWord = actual[column - 1];
    if (
      row > 0 &&
      column > 0 &&
      normalizeWord(expectedWord ?? "") === normalizeWord(actualWord ?? "")
    ) {
      row -= 1;
      column -= 1;
      continue;
    }
    const deletion =
      row > 0
        ? (matrix[row - 1]?.[column] ?? Number.POSITIVE_INFINITY)
        : Infinity;
    const insertion =
      column > 0
        ? (matrix[row]?.[column - 1] ?? Number.POSITIVE_INFINITY)
        : Infinity;
    const substitution =
      row > 0 && column > 0
        ? (matrix[row - 1]?.[column - 1] ?? Number.POSITIVE_INFINITY)
        : Infinity;

    if (substitution <= deletion && substitution <= insertion) {
      errors.unshift({
        expected: expectedWord ?? "",
        actual: actualWord ?? "",
        type: classifyReplacement(
          expectedWord ?? "",
          actualWord ?? "",
          expected,
          actual,
        ),
      });
      row -= 1;
      column -= 1;
    } else if (deletion <= insertion) {
      errors.unshift({
        expected: expectedWord ?? "",
        actual: "",
        type: "missing",
      });
      row -= 1;
    } else {
      errors.unshift({ expected: "", actual: actualWord ?? "", type: "extra" });
      column -= 1;
    }
  }

  const denominator = Math.max(expected.length, actual.length, 1);
  return {
    accuracy: Math.max(0, (denominator - errors.length) / denominator),
    errors,
  };
}

function tokenize(sentence: string): string[] {
  return sentence
    .normalize("NFKC")
    .trim()
    .split(/\s+/u)
    .map((word) => word.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ""))
    .filter(Boolean);
}

function normalizeWord(word: string): string {
  return word.normalize("NFKC").toLocaleLowerCase("en-AU");
}

function buildDistanceMatrix(expected: string[], actual: string[]): number[][] {
  const matrix = Array.from({ length: expected.length + 1 }, () =>
    Array.from({ length: actual.length + 1 }, () => 0),
  );
  for (let row = 0; row <= expected.length; row += 1) {
    const rowValues = matrix[row];
    if (rowValues) rowValues[0] = row;
  }
  const first = matrix[0];
  if (first) {
    for (let column = 0; column <= actual.length; column += 1)
      first[column] = column;
  }
  for (let row = 1; row <= expected.length; row += 1) {
    for (let column = 1; column <= actual.length; column += 1) {
      const cost =
        normalizeWord(expected[row - 1] ?? "") ===
        normalizeWord(actual[column - 1] ?? "")
          ? 0
          : 1;
      const current = matrix[row];
      if (!current) continue;
      current[column] = Math.min(
        (matrix[row - 1]?.[column] ?? 0) + 1,
        (current[column - 1] ?? 0) + 1,
        (matrix[row - 1]?.[column - 1] ?? 0) + cost,
      );
    }
  }
  return matrix;
}

function classifyReplacement(
  expected: string,
  actual: string,
  expectedWords: string[],
  actualWords: string[],
): AttemptError["type"] {
  const normalizedExpected = normalizeWord(expected);
  const normalizedActual = normalizeWord(actual);
  if (
    expectedWords.some((word) => normalizeWord(word) === normalizedActual) &&
    actualWords.some((word) => normalizeWord(word) === normalizedExpected)
  ) {
    return "order";
  }
  if (stem(normalizedExpected) === stem(normalizedActual)) return "word_form";
  if (editDistance(normalizedExpected, normalizedActual) <= 2)
    return "spelling";
  return "substitution";
}

function stem(word: string): string {
  return word.replace(/(?:ing|ed|es|s)$/u, "");
}

function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previous = row[0] ?? 0;
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const old = row[rightIndex] ?? 0;
      row[rightIndex] = Math.min(
        (row[rightIndex] ?? 0) + 1,
        (row[rightIndex - 1] ?? 0) + 1,
        previous + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return row[right.length] ?? 0;
}
