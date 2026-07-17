export type QueueStep =
  | { kind: "go"; questionId: string; position: number }
  | { kind: "finished" }
  | { kind: "hold" };

/*
 * Pure navigation over a fixed wrong-question queue. Stepping next past the
 * end finishes the round; stepping previous before the start holds. A
 * current question that is not in the queue restarts from the beginning.
 */
export function stepQueue(
  queue: readonly string[],
  currentQuestionId: string,
  direction: "next" | "previous",
): QueueStep {
  if (queue.length === 0) return { kind: "finished" };
  const index = queue.indexOf(currentQuestionId);
  if (index === -1) {
    const first = queue[0];
    return first
      ? { kind: "go", questionId: first, position: 1 }
      : { kind: "finished" };
  }
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  if (nextIndex >= queue.length) return { kind: "finished" };
  if (nextIndex < 0) return { kind: "hold" };
  const target = queue[nextIndex];
  return target
    ? { kind: "go", questionId: target, position: nextIndex + 1 }
    : { kind: "finished" };
}

export function queuePosition(
  queue: readonly string[],
  currentQuestionId: string,
): number | null {
  const index = queue.indexOf(currentQuestionId);
  return index === -1 ? null : index + 1;
}
