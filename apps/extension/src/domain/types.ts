export type PracticeMode = "practice" | "exam";

export type PracticePhase =
  | "AUTH_REQUIRED"
  | "PROBING"
  | "ANSWERING"
  | "COMMAND"
  | "SUBMITTING"
  | "REVIEW"
  | "NAVIGATING"
  | "RESETTING"
  | "DESYNC"
  | "SITE_CHANGED";

export type AudioState =
  | "EMPTY"
  | "READY"
  | "BUFFERING"
  | "PLAYING"
  | "PAUSED"
  | "ENDED"
  | "AUDIO_ERROR";

export type IndexState =
  | "IDLE"
  | "DISCOVERING"
  | "INDEXING"
  | "COMPLETE"
  | "PARTIAL"
  | "PAUSED"
  | "FAILED";

export interface QuestionIdentity {
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
  tags: string[];
}

export interface AdapterDiagnostic {
  code:
    | "AUTH_REQUIRED"
    | "AMBIGUOUS_CONTROL"
    | "MISSING_CONTROL"
    | "INVALID_QUESTION"
    | "SITE_CHANGED"
    | "TIMEOUT"
    | "DESYNC";
  capability?: string;
  detail: string;
}

export type ProbeResult =
  | {
      ok: true;
      identity: QuestionIdentity;
      capabilities: SiteCapabilities;
    }
  | { ok: false; diagnostic: AdapterDiagnostic };

export interface SiteCapabilities {
  input: boolean;
  score: boolean;
  answer: boolean;
  previous: boolean;
  next: boolean;
  redo: boolean;
  play: boolean;
  select: boolean;
}

export interface RevealSignature {
  visible: boolean;
  nodeCount: number;
  textLength: number;
}

export interface SubmissionContext {
  questionId: string;
  navigationEpoch: number;
  attemptEpoch: number;
  submissionToken: string;
}

export interface WordError {
  expected: string;
  actual: string;
  type:
    | "missing"
    | "extra"
    | "spelling"
    | "substitution"
    | "order"
    | "word_form";
}

export interface AttemptRecord {
  attemptId: string;
  predictionEdition: string;
  questionId: string;
  accuracy: number;
  durationMs: number;
  replayCount: number;
  errors: WordError[];
  completedAt: string;
}

export interface IndexedQuestion {
  predictionEdition: string;
  questionId: string;
  sitePosition: number;
  siteTotal: number;
  tags: string[];
  mediaLocator?: string | undefined;
  discoveredAt: string;
  schemaVersion: number;
}

export interface IndexSnapshot {
  predictionEdition: string;
  orderedQuestionIds: string[];
  siteTotal: number;
  completeness: "complete" | "partial";
  checkpointPosition?: number;
  schemaVersion: number;
}

export type ScoreSegmentKind = "correct" | "omit" | "error";

export interface ScoreSegment {
  kind: ScoreSegmentKind;
  text: string;
}

export interface ReviewResult {
  accuracy: number;
  errors: WordError[];
  correctCount: number;
  totalWords: number;
  segments: ScoreSegment[];
  answerText: string;
  translation: string | null;
}
