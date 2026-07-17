import type { RankCandidate } from "@pte-pilot/contracts";

const score = (candidate: RankCandidate): number =>
  candidate.dueScore * 4 +
  candidate.weaknessScore * 3 +
  candidate.noveltyScore * 2 +
  (candidate.marked ? 2 : 0);

export function rankLocally(candidates: readonly RankCandidate[]): string[] {
  return [...candidates]
    .sort(
      (left, right) =>
        score(right) - score(left) ||
        left.questionId.localeCompare(right.questionId, "en"),
    )
    .map((candidate) => candidate.questionId);
}
