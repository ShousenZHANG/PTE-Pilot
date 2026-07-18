import type { RuntimeFault, UserSettings } from "@pte-pilot/contracts";
import type {
  AdapterDiagnostic,
  PracticePhase,
  ProbeResult,
  QuestionIdentity,
} from "../domain/types";
import { DEFAULT_ALT_KEYMAP } from "./keyboard";

const NAVIGABLE_PHASES = new Set<PracticePhase>([
  "ANSWERING",
  "REVIEW",
  "COMMAND",
  "DESYNC",
]);

export function canNavigateFromPhase(phase: PracticePhase): boolean {
  return NAVIGABLE_PHASES.has(phase);
}

export async function runGuardedControllerOperation(options: {
  run: () => Promise<void>;
  isCurrent: () => boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}): Promise<void> {
  try {
    await options.run();
    if (options.isCurrent()) options.onSuccess();
  } catch (error) {
    if (options.isCurrent()) options.onError(error);
  }
}

export type PredictionEditionStartupMode = "verified" | "session" | "reject";

export function predictionEditionStartupMode(
  probe: ProbeResult,
): PredictionEditionStartupMode {
  if (probe.ok) return "verified";
  return probe.diagnostic.detail === "question:prediction-edition-unverified"
    ? "session"
    : "reject";
}

/*
 * The Firefly page re-renders in bursts (question switch, dialog close,
 * skeleton load). A missing or ambiguous control in that window is transient,
 * not a site change, so the initial probe deserves a short grace period
 * before failing closed. Auth failures and unverified editions are
 * deterministic and never retried.
 */
export function shouldRetryProbe(diagnostic: AdapterDiagnostic): boolean {
  return (
    diagnostic.code !== "AUTH_REQUIRED" &&
    diagnostic.detail !== "question:prediction-edition-unverified" &&
    /:(?:missing|ambiguous)$/u.test(diagnostic.detail)
  );
}

export function canPersistPredictionEdition(edition: string): boolean {
  return !["session:", "provisional:"].some((prefix) =>
    edition.startsWith(prefix),
  );
}

export function sessionQuestionKey(identity: QuestionIdentity): string {
  return `${identity.predictionEdition}:${identity.questionId}`;
}

export function defaultSettings(): UserSettings {
  return {
    id: "current",
    mode: "practice",
    audioStrategy: "site-player-only",
    keymap: { ...DEFAULT_ALT_KEYMAP },
    updatedAt: new Date().toISOString(),
  };
}

export function mergeSettings(settings: UserSettings): UserSettings {
  return { ...settings, keymap: { ...DEFAULT_ALT_KEYMAP, ...settings.keymap } };
}

export function toQuestionRef(identity: QuestionIdentity): {
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
} {
  return {
    predictionEdition: identity.predictionEdition,
    questionId: identity.questionId,
    position: identity.position,
    total: identity.total,
  };
}

export function diagnosticFault(code: string, message: string): RuntimeFault {
  const mapped = new Set([
    "AUTH_REQUIRED",
    "SITE_CHANGED",
    "DESYNC",
    "AUDIO_ERROR",
    "INDEX_PARTIAL",
    "STORAGE_ERROR",
  ]).has(code)
    ? (code as RuntimeFault["code"])
    : "SITE_CHANGED";
  return { code: mapped, message, recoverable: true };
}

export function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "未知错误";
}
