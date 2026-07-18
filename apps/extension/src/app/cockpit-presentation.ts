import type { PracticeMode } from "../domain/types";
import type { CockpitViewState } from "./practice-controller";

const ACTIONABLE_PHASES = new Set(["ANSWERING", "REVIEW", "COMMAND"]);

export function isActionablePhase(phase: CockpitViewState["phase"]): boolean {
  return ACTIONABLE_PHASES.has(phase);
}

export function isTransitionFocusState(
  phase: CockpitViewState["phase"],
  indexStatus: CockpitViewState["indexStatus"],
): boolean {
  return (
    phase === "PROBING" ||
    phase === "SUBMITTING" ||
    phase === "NAVIGATING" ||
    phase === "RESETTING" ||
    indexStatus === "DISCOVERING" ||
    indexStatus === "INDEXING" ||
    indexStatus === "PAUSED"
  );
}

export function isEditableEventTarget(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0];
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function enumerateSegments(
  segments: NonNullable<CockpitViewState["review"]>["segments"],
): Array<{
  segment: NonNullable<CockpitViewState["review"]>["segments"][number];
  id: string;
}> {
  const seen = new Map<string, number>();
  return segments.map((segment) => {
    const base = `${segment.kind}:${segment.text}`;
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    return { segment, id: `${base}:${occurrence}` };
  });
}

export function updateWordCount(
  textarea: HTMLTextAreaElement,
  output: HTMLOutputElement | null,
): void {
  if (!output) return;
  const count = textarea.value.trim()
    ? textarea.value.trim().split(/\s+/u).length
    : 0;
  const next = `Total Word Count: ${count}`;
  if (output.value === next) return;
  output.value = next;
}

export function formatAudioClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

export function audioLabel(
  status: string,
  mode: PracticeMode,
  autoPlayIn: number | null,
): string {
  const label =
    status === "EMPTY" && autoPlayIn !== null
      ? `Beginning in ${autoPlayIn}s`
      : status === "BUFFERING"
        ? "BUFFERING · 正在加载音频"
        : status === "READY"
          ? "READY · 按 Alt+P 播放"
          : status;
  return mode === "exam" ? `Status: ${label} · 单次播放` : `Status: ${label}`;
}
