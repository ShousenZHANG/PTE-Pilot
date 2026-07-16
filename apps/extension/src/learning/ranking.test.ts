import type { RankResponse } from "@pte-pilot/contracts";
import { describe, expect, test } from "vitest";
import {
  createRankRequest,
  type RankGateway,
  rankLocally,
  rankWithGatewayFallback,
  validateRankResponse,
} from "./ranking";

const candidates = [
  {
    questionId: "new",
    dueScore: 0.5,
    weaknessScore: 0,
    noveltyScore: 1,
    marked: false,
    attemptCount: 0,
    lastAttemptAt: null,
  },
  {
    questionId: "weak",
    dueScore: 1,
    weaknessScore: 1,
    noveltyScore: 0,
    marked: true,
    attemptCount: 4,
    lastAttemptAt: "2026-07-14T00:00:00.000Z",
  },
] as const;

describe("ranking", () => {
  test("puts marked overdue weak work first", () => {
    expect(rankLocally(candidates)).toEqual(["weak", "new"]);
  });

  test("uses local order when Gateway is offline", async () => {
    const gateway: RankGateway = {
      rank: async () => {
        throw new Error("offline");
      },
    };
    const request = await createRankRequest(
      candidates,
      2,
      "1bf5b647-9d48-4773-b91b-9fe0b15cb458",
    );
    expect(await rankWithGatewayFallback(gateway, request)).toEqual([
      "weak",
      "new",
    ]);
  });

  test("accepts a matching partial rank then appends local remainder", async () => {
    const request = await createRankRequest(
      candidates,
      2,
      "1bf5b647-9d48-4773-b91b-9fe0b15cb458",
    );
    expect(
      validateRankResponse(request, {
        decisionId: request.decisionId,
        candidateSetHash: request.candidateSetHash,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: ["new"],
      }),
    ).toEqual(["new", "weak"]);
  });

  test.each([
    ["decision", { decisionId: "40d95d87-1aa7-43ca-bc66-2fc4935ada4f" }],
    ["hash", { candidateSetHash: `sha256:${"f".repeat(64)}` }],
    ["version", { learnerStateVersion: 3 }],
    ["duplicate", { rankedQuestionIds: ["new", "new"] }],
    ["outside", { rankedQuestionIds: ["outside"] }],
  ] as const)("rejects invalid %s responses", async (_name, change) => {
    const request = await createRankRequest(
      candidates,
      2,
      "1bf5b647-9d48-4773-b91b-9fe0b15cb458",
    );
    const response = {
      decisionId: request.decisionId,
      candidateSetHash: request.candidateSetHash,
      learnerStateVersion: request.learnerStateVersion,
      rankedQuestionIds: ["new", "weak"],
      ...change,
    } as unknown as RankResponse;
    expect(validateRankResponse(request, response)).toBeNull();
  });

  test("rejects response if local learner state changed while waiting", async () => {
    const request = await createRankRequest(
      candidates,
      2,
      "1bf5b647-9d48-4773-b91b-9fe0b15cb458",
    );
    const gateway: RankGateway = {
      rank: async () => ({
        decisionId: request.decisionId,
        candidateSetHash: request.candidateSetHash,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: ["new", "weak"],
      }),
    };
    expect(
      await rankWithGatewayFallback(gateway, request, undefined, () => 3),
    ).toEqual(["weak", "new"]);
  });
});
