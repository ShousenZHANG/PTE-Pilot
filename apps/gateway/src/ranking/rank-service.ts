import {
  type RankCandidate,
  type RankRequest,
  type RankResponse,
  RankResponseSchema,
} from "@pte-pilot/contracts";
import type { HermesClient } from "../hermes/hermes-client.js";

export function rankLocally(candidates: readonly RankCandidate[]): string[] {
  return [...candidates]
    .sort((left, right) => {
      if (left.marked !== right.marked) return left.marked ? -1 : 1;
      if (left.weaknessScore !== right.weaknessScore) {
        return right.weaknessScore - left.weaknessScore;
      }
      if (left.dueScore !== right.dueScore)
        return right.dueScore - left.dueScore;
      if (left.noveltyScore !== right.noveltyScore) {
        return right.noveltyScore - left.noveltyScore;
      }
      if (left.attemptCount !== right.attemptCount) {
        return left.attemptCount - right.attemptCount;
      }
      const leftTime = left.lastAttemptAt ?? "";
      const rightTime = right.lastAttemptAt ?? "";
      const timeOrder = leftTime.localeCompare(rightTime);
      if (timeOrder !== 0) return timeOrder;
      return left.questionId.localeCompare(right.questionId);
    })
    .map(({ questionId }) => questionId);
}

export class RankService {
  constructor(private readonly hermes: HermesClient) {}

  async rank(request: RankRequest): Promise<RankResponse> {
    const localResponse = (): RankResponse =>
      RankResponseSchema.parse({
        candidateSetHash: request.candidateSetHash,
        decisionId: request.decisionId,
        learnerStateVersion: request.learnerStateVersion,
        rankedQuestionIds: rankLocally(request.candidates),
      });

    const audit = await this.hermes.audit().catch(() => null);
    if (audit?.status !== "ready") return localResponse();

    try {
      const response = RankResponseSchema.parse(
        await this.hermes.rank(request),
      );
      const candidateIds = request.candidates.map(
        ({ questionId }) => questionId,
      );
      const candidateSet = new Set(candidateIds);
      const rankedSet = new Set(response.rankedQuestionIds);
      const valid =
        response.decisionId === request.decisionId &&
        response.candidateSetHash === request.candidateSetHash &&
        response.learnerStateVersion === request.learnerStateVersion &&
        response.rankedQuestionIds.length === candidateIds.length &&
        rankedSet.size === candidateSet.size &&
        response.rankedQuestionIds.every((questionId) =>
          candidateSet.has(questionId),
        );
      return valid ? response : localResponse();
    } catch {
      return localResponse();
    }
  }
}
