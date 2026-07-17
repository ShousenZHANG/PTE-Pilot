import {
  AttemptEpochSchema,
  NavigationEpochSchema,
  QuestionRefSchema,
  SubmissionTokenSchema,
} from "@pte-pilot/contracts";
import { describe, expect, test } from "vitest";
import { createInitialMachineState, transition } from "./practice-machine";

const question = QuestionRefSchema.parse({
  questionId: "131020",
  position: 12,
  total: 192,
  predictionEdition: "yc-2026-w29",
});
const submissionToken = SubmissionTokenSchema.parse(
  "d6babbf0-bb7d-4ca8-b709-f226b1828b19",
);

describe("practice machine", () => {
  test("enters answering only after a verified newer question", () => {
    const state = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "saved",
    });
    expect(state.runtime.phase).toBe("ANSWERING");
    expect(state.draft).toBe("saved");
    expect(
      transition(state, {
        type: "QUESTION_READY",
        question,
        navigationEpoch: NavigationEpochSchema.parse(1),
        restoredDraft: "stale",
      }),
    ).toBe(state);
  });

  test("opens and expires command mode without changing draft", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "words",
    });
    const command = transition(answering, { type: "OPEN_COMMAND", nowMs: 100 });
    expect(command.runtime.phase).toBe("COMMAND");
    expect(
      transition(command, { type: "COMMAND_TIMEOUT", nowMs: 1_599 }).runtime
        .phase,
    ).toBe("COMMAND");
    expect(
      transition(command, { type: "COMMAND_TIMEOUT", nowMs: 1_600 }).runtime
        .phase,
    ).toBe("ANSWERING");
  });

  test("requires keyup and guard expiry before review can navigate", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "a sentence",
    });
    const submitting = transition(answering, {
      type: "SUBMIT_REQUESTED",
      attemptEpoch: AttemptEpochSchema.parse(1),
      submissionToken,
    });
    const review = transition(submitting, {
      type: "SUBMIT_SUCCEEDED",
      submissionToken,
      attempt: {
        attemptId: "41575b51-4976-40cb-a210-6ea26934dab0",
        questionId: "131020",
        accuracy: 1,
        durationMs: 1_000,
        replayCount: 0,
        errors: [],
        completedAt: "2026-07-15T10:00:00.000Z",
      },
      nowMs: 1_000,
    });
    expect(
      transition(review, {
        type: "NAVIGATE_REQUESTED",
        target: "next",
        nowMs: 2_000,
      }).runtime.phase,
    ).toBe("REVIEW");
    const released = transition(review, { type: "ENTER_KEYUP" });
    expect(
      transition(released, {
        type: "NAVIGATE_REQUESTED",
        target: "next",
        nowMs: 1_399,
      }).runtime.phase,
    ).toBe("REVIEW");
    expect(
      transition(released, {
        type: "NAVIGATE_REQUESTED",
        target: "next",
        nowMs: 1_400,
      }).runtime.phase,
    ).toBe("NAVIGATING");
  });

  test("rejects stale submission tokens and mismatched question facts", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "answer",
    });
    const submitting = transition(answering, {
      type: "SUBMIT_REQUESTED",
      attemptEpoch: AttemptEpochSchema.parse(1),
      submissionToken,
    });
    const stale = transition(submitting, {
      type: "SUBMIT_SUCCEEDED",
      submissionToken: SubmissionTokenSchema.parse(
        "bbd12b3d-0768-40a0-9bd5-4337b25d68b5",
      ),
      attempt: {
        attemptId: "41575b51-4976-40cb-a210-6ea26934dab0",
        questionId: "other",
        accuracy: 1,
        durationMs: 1_000,
        replayCount: 0,
        errors: [],
        completedAt: "2026-07-15T10:00:00.000Z",
      },
      nowMs: 1_000,
    });
    expect(stale).toBe(submitting);
  });

  test("accepts only the latest pending navigation epoch", () => {
    const answering = transition(createInitialMachineState(), {
      type: "QUESTION_READY",
      question,
      navigationEpoch: NavigationEpochSchema.parse(1),
      restoredDraft: "",
    });
    const epochTwo = transition(answering, {
      type: "SITE_NAVIGATION_STARTED",
      navigationEpoch: NavigationEpochSchema.parse(2),
    });
    const epochThree = transition(epochTwo, {
      type: "SITE_NAVIGATION_STARTED",
      navigationEpoch: NavigationEpochSchema.parse(3),
    });
    expect(
      transition(epochThree, {
        type: "NAVIGATION_SUCCEEDED",
        question: { ...question, questionId: "old" },
        navigationEpoch: NavigationEpochSchema.parse(2),
        restoredDraft: "old draft",
      }),
    ).toBe(epochThree);
  });
});
