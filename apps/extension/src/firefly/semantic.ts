export type ControlName =
  | "previous"
  | "next"
  | "score"
  | "answer"
  | "redo"
  | "play"
  | "pause";

const EXACT_CONTROL_LABELS: Record<ControlName, ReadonlySet<string>> = {
  previous: new Set(["上一题", "Previous", "Prev"]),
  next: new Set(["下一题", "Next"]),
  score: new Set(["评分", "Score"]),
  answer: new Set(["答案", "Answer"]),
  redo: new Set(["重做", "Redo", "Try again"]),
  play: new Set(["Play", "播放"]),
  pause: new Set(["Pause", "暂停"]),
};

export function normalizeLabel(value: string | null | undefined): string {
  return value?.replace(/\s+/gu, " ").trim() ?? "";
}

export function matchesControlLabel(
  control: ControlName,
  label: string,
): boolean {
  return EXACT_CONTROL_LABELS[control].has(normalizeLabel(label));
}

export function resolveUnique<T>(items: readonly T[], capability: string): T {
  if (items.length !== 1) {
    throw new Error(
      `${capability}:${items.length === 0 ? "missing" : "ambiguous"}`,
    );
  }
  const item = items[0];
  if (item === undefined) {
    throw new Error(`${capability}:missing`);
  }
  return item;
}

export function parsePositionLabel(
  value: string,
): { position: number; total: number } | null {
  const normalized = normalizeLabel(value);
  const match = /^(?:WFD\s*)?(\d+)\s*\/\s*(\d+)$/iu.exec(normalized);
  if (!match) return null;
  const position = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isSafeInteger(position) || !Number.isSafeInteger(total))
    return null;
  if (position < 1 || total < 1 || position > total) return null;
  return { position, total };
}

export function parseQuestionId(value: string): string | null {
  const normalized = normalizeLabel(value);
  const match = /^#?(\d{4,12})$/u.exec(normalized);
  return match?.[1] ?? null;
}
