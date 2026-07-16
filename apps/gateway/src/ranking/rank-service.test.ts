import type { RankRequest } from "@pte-pilot/contracts";
import { describe, expect, it, vi } from "vitest";
import type { HermesClient } from "../hermes/hermes-client.js";
import { RankService, rankLocally } from "./rank-service.js";

const request: RankRequest = {
  candidateSetHash: `sha256:${"a".repeat(64)}`,
  candidates: [
    {
      attemptCount: 3,
      dueScore: 0.9,
      lastAttemptAt: "2026-07-14T00:00:00.000Z",
      marked: false,
      noveltyScore: 0.1,
      questionId: "131020",
      weaknessScore: 0.8,
    },
    {
      attemptCount: 1,
      dueScore: 0.5,
      lastAttemptAt: null,
      marked: true,
      noveltyScore: 0.7,
      questionId: "131021",
      weaknessScore: 0.4,
    },
  ],
  decisionId: "11111111-1111-4111-8111-111111111111",
  learnerStateVersion: 42,
};

function clientWith(
  response: unknown,
  status: "ready" | "offline" | "rejected" = "ready",
): HermesClient {
  return {
    audit: async () => ({
      enabledTools: status === "ready" ? ["memory"] : [],
      model: status === "offline" ? null : "pte-pilot",
      status,
      unexpectedTools: [],
    }),
    rank: vi.fn().mockResolvedValue(response),
    syncMemory: async () => undefined,
  };
}

describe("RankService", () => {
  it("uses a valid Hermes permutation", async () => {
    const service = new RankService(
      clientWith({
        candidateSetHash: request.candidateSetHash,
        decisionId: request.decisionId,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: ["131020", "131021"],
      }),
    );
    await expect(service.rank(request)).resolves.toMatchObject({
      rankedQuestionIds: ["131020", "131021"],
    });
  });

  it.each([
    { decisionId: "22222222-2222-4222-8222-222222222222" },
    { candidateSetHash: `sha256:${"b".repeat(64)}` },
    { learnerStateVersion: 41 },
    { rankedQuestionIds: ["131020", "999999"] },
    { rankedQuestionIds: ["131020", "131020"] },
  ])("falls back for stale or invalid Hermes output %#", async (change) => {
    const service = new RankService(
      clientWith({
        candidateSetHash: request.candidateSetHash,
        decisionId: request.decisionId,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: ["131020", "131021"],
        ...change,
      }),
    );
    await expect(service.rank(request)).resolves.toMatchObject({
      rankedQuestionIds: ["131021", "131020"],
    });
  });

  it("does not call Hermes rank when audit is offline", async () => {
    const client = clientWith({}, "offline");
    const service = new RankService(client);
    await expect(service.rank(request)).resolves.toMatchObject({
      rankedQuestionIds: ["131021", "131020"],
    });
    expect(client.rank).not.toHaveBeenCalled();
  });
});

describe("rankLocally", () => {
  it("is deterministic and never changes candidate membership", () => {
    expect(rankLocally(request.candidates)).toEqual(["131021", "131020"]);
    expect(rankLocally([...request.candidates].reverse())).toEqual([
      "131021",
      "131020",
    ]);
  });
});
