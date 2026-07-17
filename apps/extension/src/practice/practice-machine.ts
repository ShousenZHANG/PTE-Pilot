import {
  type AttemptEpoch,
  AttemptEpochSchema,
  type AttemptEvent,
  type AudioStatus,
  type IndexStatus,
  type NavigationEpoch,
  NavigationEpochSchema,
  type PracticeState,
  type QuestionRef,
  type RuntimeFault,
  type SubmissionToken,
} from "@pte-pilot/contracts";

export type NavigationTarget = "next" | "previous" | { questionId: string };

export interface PracticeMachineState {
  runtime: PracticeState;
  draft: string;
  review: AttemptEvent | null;
  submissionToken: SubmissionToken | null;
  enterGate: "released" | "held-from-submit";
  reviewGuardUntilMs: number | null;
  commandDeadlineMs: number | null;
  navigationTarget: NavigationTarget | null;
  pendingNavigationEpoch: NavigationEpoch | null;
}

export type PracticeEvent =
  | {
      type: "QUESTION_READY";
      question: QuestionRef;
      navigationEpoch: NavigationEpoch;
      restoredDraft: string;
    }
  | { type: "DRAFT_RESTORED"; value: string }
  | { type: "OPEN_COMMAND"; nowMs: number }
  | { type: "CLOSE_COMMAND" }
  | { type: "COMMAND_TIMEOUT"; nowMs: number }
  | {
      type: "SUBMIT_REQUESTED";
      attemptEpoch: AttemptEpoch;
      submissionToken: SubmissionToken;
    }
  | {
      type: "SUBMIT_SUCCEEDED";
      submissionToken: SubmissionToken;
      attempt: AttemptEvent;
      nowMs: number;
    }
  | {
      type: "SUBMIT_FAILED";
      submissionToken: SubmissionToken;
      fault: RuntimeFault;
    }
  | { type: "ENTER_KEYUP" }
  | {
      type: "NAVIGATE_REQUESTED";
      target: NavigationTarget;
      nowMs: number;
    }
  | {
      type: "SITE_NAVIGATION_STARTED";
      navigationEpoch: NavigationEpoch;
    }
  | {
      type: "NAVIGATION_SUCCEEDED";
      question: QuestionRef;
      navigationEpoch: NavigationEpoch;
      restoredDraft: string;
    }
  | { type: "REDO_REQUESTED" }
  | {
      type: "RESET_SUCCEEDED";
      question: QuestionRef;
      navigationEpoch: NavigationEpoch;
    }
  | { type: "AUDIO_STATUS_CHANGED"; status: AudioStatus }
  | { type: "INDEX_STATUS_CHANGED"; status: IndexStatus }
  | { type: "FAULTED"; fault: RuntimeFault }
  | { type: "RETRY" }
  | { type: "PAUSE" };

export function createInitialMachineState(): PracticeMachineState {
  return {
    runtime: {
      phase: "PROBING",
      question: null,
      navigationEpoch: NavigationEpochSchema.parse(0),
      attemptEpoch: AttemptEpochSchema.parse(0),
      audioStatus: "EMPTY",
      indexStatus: "IDLE",
      fault: null,
    },
    draft: "",
    review: null,
    submissionToken: null,
    enterGate: "released",
    reviewGuardUntilMs: null,
    commandDeadlineMs: null,
    navigationTarget: null,
    pendingNavigationEpoch: null,
  };
}

function updateRuntime(
  state: PracticeMachineState,
  change: Partial<PracticeState>,
): PracticeMachineState {
  return { ...state, runtime: { ...state.runtime, ...change } };
}

function acceptQuestion(
  state: PracticeMachineState,
  question: QuestionRef,
  navigationEpoch: NavigationEpoch,
  draft: string,
): PracticeMachineState {
  return {
    ...state,
    runtime: {
      ...state.runtime,
      phase: "ANSWERING",
      question,
      navigationEpoch,
      fault: null,
    },
    draft,
    review: null,
    submissionToken: null,
    enterGate: "released",
    reviewGuardUntilMs: null,
    commandDeadlineMs: null,
    navigationTarget: null,
    pendingNavigationEpoch: null,
  };
}

export function transition(
  state: PracticeMachineState,
  event: PracticeEvent,
): PracticeMachineState {
  switch (event.type) {
    case "QUESTION_READY":
      if (
        Number(event.navigationEpoch) <= Number(state.runtime.navigationEpoch)
      ) {
        return state;
      }
      return acceptQuestion(
        state,
        event.question,
        event.navigationEpoch,
        event.restoredDraft,
      );
    case "NAVIGATION_SUCCEEDED":
      if (
        state.runtime.phase !== "NAVIGATING" ||
        (state.pendingNavigationEpoch !== null &&
          state.pendingNavigationEpoch !== event.navigationEpoch) ||
        Number(event.navigationEpoch) <= Number(state.runtime.navigationEpoch)
      ) {
        return state;
      }
      return acceptQuestion(
        state,
        event.question,
        event.navigationEpoch,
        event.restoredDraft,
      );
    case "DRAFT_RESTORED":
      return state.runtime.phase === "ANSWERING"
        ? { ...state, draft: event.value }
        : state;
    case "OPEN_COMMAND":
      return state.runtime.phase === "ANSWERING"
        ? {
            ...updateRuntime(state, { phase: "COMMAND" }),
            commandDeadlineMs: event.nowMs + 1_500,
          }
        : state;
    case "CLOSE_COMMAND":
      return state.runtime.phase === "COMMAND"
        ? {
            ...updateRuntime(state, { phase: "ANSWERING" }),
            commandDeadlineMs: null,
          }
        : state;
    case "COMMAND_TIMEOUT":
      return state.runtime.phase === "COMMAND" &&
        state.commandDeadlineMs !== null &&
        event.nowMs >= state.commandDeadlineMs
        ? {
            ...updateRuntime(state, { phase: "ANSWERING" }),
            commandDeadlineMs: null,
          }
        : state;
    case "SUBMIT_REQUESTED":
      return state.runtime.phase === "ANSWERING" &&
        state.draft.trim().length > 0
        ? {
            ...updateRuntime(state, {
              phase: "SUBMITTING",
              attemptEpoch: event.attemptEpoch,
              fault: null,
            }),
            submissionToken: event.submissionToken,
            enterGate: "held-from-submit",
          }
        : state;
    case "SUBMIT_SUCCEEDED":
      if (
        state.runtime.phase !== "SUBMITTING" ||
        state.submissionToken !== event.submissionToken ||
        state.runtime.question?.questionId !== event.attempt.questionId
      ) {
        return state;
      }
      return {
        ...updateRuntime(state, { phase: "REVIEW", fault: null }),
        review: event.attempt,
        reviewGuardUntilMs: event.nowMs + 400,
      };
    case "SUBMIT_FAILED":
      if (
        state.runtime.phase !== "SUBMITTING" ||
        state.submissionToken !== event.submissionToken
      ) {
        return state;
      }
      return {
        ...updateRuntime(state, { phase: "PAUSED", fault: event.fault }),
        submissionToken: null,
        enterGate: "released",
      };
    case "ENTER_KEYUP":
      return state.enterGate === "held-from-submit"
        ? { ...state, enterGate: "released" }
        : state;
    case "NAVIGATE_REQUESTED": {
      const answering = state.runtime.phase === "ANSWERING";
      const reviewReady =
        state.runtime.phase === "REVIEW" &&
        state.enterGate === "released" &&
        state.reviewGuardUntilMs !== null &&
        event.nowMs >= state.reviewGuardUntilMs;
      return answering || reviewReady
        ? {
            ...updateRuntime(state, { phase: "NAVIGATING" }),
            navigationTarget: event.target,
          }
        : state;
    }
    case "SITE_NAVIGATION_STARTED":
      return Number(event.navigationEpoch) >
        Number(state.runtime.navigationEpoch) &&
        (state.pendingNavigationEpoch === null ||
          Number(event.navigationEpoch) > Number(state.pendingNavigationEpoch))
        ? {
            ...updateRuntime(state, { phase: "NAVIGATING", fault: null }),
            navigationTarget: null,
            pendingNavigationEpoch: event.navigationEpoch,
          }
        : state;
    case "REDO_REQUESTED":
      return state.runtime.phase === "REVIEW"
        ? updateRuntime(state, { phase: "RESETTING" })
        : state;
    case "RESET_SUCCEEDED":
      return state.runtime.phase === "RESETTING" &&
        state.runtime.question?.questionId === event.question.questionId &&
        Number(event.navigationEpoch) >= Number(state.runtime.navigationEpoch)
        ? {
            ...acceptQuestion(state, event.question, event.navigationEpoch, ""),
            runtime: {
              ...state.runtime,
              phase: "ANSWERING",
              question: event.question,
              navigationEpoch: event.navigationEpoch,
              attemptEpoch: AttemptEpochSchema.parse(
                Number(state.runtime.attemptEpoch) + 1,
              ),
              fault: null,
            },
          }
        : state;
    case "AUDIO_STATUS_CHANGED":
      return updateRuntime(state, { audioStatus: event.status });
    case "INDEX_STATUS_CHANGED":
      return updateRuntime(state, {
        indexStatus: event.status,
        fault:
          event.status === "COMPLETE" &&
          state.runtime.fault?.code === "INDEX_PARTIAL"
            ? null
            : state.runtime.fault,
      });
    case "FAULTED":
      if (event.fault.code === "INDEX_PARTIAL") {
        return updateRuntime(state, {
          indexStatus: "PARTIAL",
          fault: event.fault,
        });
      }
      return updateRuntime(state, {
        phase:
          event.fault.code === "AUTH_REQUIRED" ? "AUTH_REQUIRED" : "PAUSED",
        fault: event.fault,
      });
    case "RETRY":
      return state.runtime.fault?.recoverable
        ? updateRuntime(state, { phase: "PROBING", fault: null })
        : state;
    case "PAUSE":
      return updateRuntime(state, { phase: "PAUSED" });
  }
}
