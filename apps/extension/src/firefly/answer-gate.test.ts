import { describe, expect, it, vi } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import {
  AnswerGate,
  type AnswerSitePort,
  type RevealedAnswerProof,
} from "./answer-gate";

const current: QuestionIdentity = {
  predictionEdition: "weekly-2026-W29",
  questionId: "131020",
  position: 12,
  total: 192,
  tags: ["WFD"],
};

function siteFixture(overrides: Partial<AnswerSitePort> = {}): AnswerSitePort {
  let revealed = false;
  return {
    readIdentity: () => current,
    writeAnswer: () => undefined,
    revealSignature: () => ({
      visible: revealed,
      nodeCount: revealed ? 1 : 0,
      textLength: revealed ? 39 : 0,
    }),
    scoreAndWait: async (_expected, operationToken) => {
      revealed = true;
      return revealProof(operationToken, "score");
    },
    revealAnswerAndWait: async (_expected, operationToken) => {
      revealed = true;
      return revealProof(operationToken, "answer");
    },
    isScoreComplete: () => false,
    click: () => undefined,
    capabilities: () => ({ redo: true }),
    readRevealedAnswer: () => "the library closes at nine this evening",
    input: () => ({ value: "" }) as HTMLTextAreaElement,
    ...overrides,
  };
}

describe("AnswerGate", () => {
  it("scores atomically and never returns the full answer", async () => {
    const order: string[] = [];
    let revealed = false;
    const site = siteFixture({
      writeAnswer: (value) => order.push(`write:${value}`),
      revealSignature: () => ({
        visible: revealed,
        nodeCount: revealed ? 1 : 0,
        textLength: revealed ? 39 : 0,
      }),
      scoreAndWait: async (expected, operationToken) => {
        expect(expected.questionId).toBe(current.questionId);
        order.push("score");
        revealed = true;
        return revealProof(operationToken, "score");
      },
      readRevealedAnswer: () => {
        order.push("read");
        return "the library closes at nine this evening";
      },
    });
    const gate = new AnswerGate(site);
    gate.setNavigationEpoch(4);

    const result = await gate.submit("the library close at nine this evening");

    expect(order).toEqual([
      "write:the library close at nine this evening",
      "score",
      "read",
    ]);
    expect(result.context).toMatchObject({
      questionId: current.questionId,
      navigationEpoch: 4,
    });
    expect(result.review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ expected: "closes", actual: "close" }),
      ]),
    );
    expect(result).not.toHaveProperty("correctAnswer");
    expect(JSON.stringify(result)).not.toContain(
      "the library closes at nine this evening",
    );
  });

  it("uses a separately proven Answer action after score-only completion", async () => {
    const order: string[] = [];
    let revealed = false;
    const site = siteFixture({
      revealSignature: () => ({
        visible: revealed,
        nodeCount: revealed ? 1 : 0,
        textLength: revealed ? 7 : 0,
      }),
      scoreAndWait: async () => {
        order.push("score-proof");
        return null;
      },
      revealAnswerAndWait: async (_expected, operationToken) => {
        order.push("answer-proof");
        revealed = true;
        return revealProof(operationToken, "answer");
      },
      readRevealedAnswer: () => {
        order.push("read");
        return "answer";
      },
    });

    await expect(new AnswerGate(site).submit("answer")).resolves.toMatchObject({
      review: { accuracy: 1, errors: [] },
    });
    expect(order).toEqual(["score-proof", "answer-proof", "read"]);
  });

  it("rejects scoring that completes after navigation", async () => {
    let finishScore: (() => void) | undefined;
    const site = siteFixture({
      scoreAndWait: () =>
        new Promise<RevealedAnswerProof | null>((resolve) => {
          finishScore = () => resolve(null);
        }),
    });
    const gate = new AnswerGate(site);
    const submission = gate.submit("draft");
    gate.setNavigationEpoch(1);
    finishScore?.();

    await expect(submission).rejects.toThrow("submission:stale-context");
  });

  it("releases its one-shot token after a synchronous site write failure", async () => {
    const writeAnswer = vi
      .fn<(value: string) => void>()
      .mockImplementationOnce(() => {
        throw new Error("input:writeback-mismatch");
      })
      .mockImplementation(() => undefined);
    const site = siteFixture({ writeAnswer });
    const gate = new AnswerGate(site);

    await expect(gate.submit("first")).rejects.toThrow(
      "input:writeback-mismatch",
    );
    await expect(gate.submit("second")).resolves.toBeDefined();
    expect(writeAnswer).toHaveBeenCalledTimes(2);
  });

  it("rejects a revealed answer proof that is not bound to this submission", async () => {
    let revealed = false;
    const readRevealedAnswer = vi.fn(
      () => "stale answer from another question",
    );
    const site = siteFixture({
      revealSignature: () => ({
        visible: revealed,
        nodeCount: revealed ? 1 : 0,
        textLength: revealed ? 34 : 0,
      }),
      scoreAndWait: (async (
        _expected: Pick<QuestionIdentity, "questionId">,
        operationToken: string,
      ) => {
        revealed = true;
        return {
          questionId: "different-question",
          operationToken,
          source: "score",
        };
      }) as unknown as AnswerSitePort["scoreAndWait"],
      readRevealedAnswer,
    });

    await expect(new AnswerGate(site).submit("draft")).rejects.toThrow(
      "submission:invalid-reveal-proof",
    );
    expect(readRevealedAnswer).not.toHaveBeenCalled();
  });

  it("rejects a visible answer when the score action returns no causal proof", async () => {
    let revealed = false;
    const readRevealedAnswer = vi.fn(() => "unproven stale answer");
    const site = siteFixture({
      revealSignature: () => ({
        visible: revealed,
        nodeCount: revealed ? 1 : 0,
        textLength: revealed ? 21 : 0,
      }),
      scoreAndWait: (async () => {
        revealed = true;
      }) as unknown as AnswerSitePort["scoreAndWait"],
      revealAnswerAndWait: (async () =>
        undefined) as unknown as AnswerSitePort["revealAnswerAndWait"],
      readRevealedAnswer,
    });

    await expect(new AnswerGate(site).submit("draft")).rejects.toThrow(
      "submission:invalid-reveal-proof",
    );
    expect(readRevealedAnswer).not.toHaveBeenCalled();
  });
});

function revealProof(
  operationToken: string,
  source: RevealedAnswerProof["source"],
): RevealedAnswerProof {
  return {
    predictionEdition: current.predictionEdition,
    questionId: current.questionId,
    position: current.position,
    total: current.total,
    operationToken,
    source,
  };
}
