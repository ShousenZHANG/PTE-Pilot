import {
  type RankCandidate,
  type RankRequest,
  RankRequestSchema,
  type RankResponse,
  RankResponseSchema,
} from "@pte-pilot/contracts";

export interface RankGateway {
  rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse>;
}

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

function canonicalCandidates(candidates: readonly RankCandidate[]): string {
  return JSON.stringify(
    [...candidates]
      .sort((left, right) =>
        left.questionId.localeCompare(right.questionId, "en"),
      )
      .map((candidate) => ({
        questionId: candidate.questionId,
        dueScore: candidate.dueScore,
        weaknessScore: candidate.weaknessScore,
        noveltyScore: candidate.noveltyScore,
        marked: candidate.marked,
        attemptCount: candidate.attemptCount,
        lastAttemptAt: candidate.lastAttemptAt,
      })),
  );
}

export async function candidateHash(
  candidates: readonly RankCandidate[],
): Promise<`sha256:${string}`> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalCandidates(candidates)),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `sha256:${hex}`;
}

export async function createRankRequest(
  candidates: readonly RankCandidate[],
  learnerStateVersion: number,
  decisionId = crypto.randomUUID(),
): Promise<RankRequest> {
  return RankRequestSchema.parse({
    decisionId,
    candidateSetHash: await candidateHash(candidates),
    learnerStateVersion,
    candidates,
  });
}

export function validateRankResponse(
  request: RankRequest,
  rawResponse: unknown,
  currentLearnerStateVersion = request.learnerStateVersion,
): string[] | null {
  const parsed = RankResponseSchema.safeParse(rawResponse);
  if (!parsed.success) return null;
  const response = parsed.data;
  if (
    response.decisionId !== request.decisionId ||
    response.candidateSetHash !== request.candidateSetHash ||
    response.learnerStateVersion !== request.learnerStateVersion ||
    currentLearnerStateVersion !== request.learnerStateVersion
  ) {
    return null;
  }

  const allowed = new Set(
    request.candidates.map((candidate) => candidate.questionId),
  );
  const seen = new Set<string>();
  for (const questionId of response.rankedQuestionIds) {
    if (!allowed.has(questionId) || seen.has(questionId)) return null;
    seen.add(questionId);
  }

  const local = rankLocally(request.candidates);
  return [
    ...response.rankedQuestionIds,
    ...local.filter((questionId) => !seen.has(questionId)),
  ];
}

export async function rankWithGatewayFallback(
  gateway: RankGateway,
  request: RankRequest,
  signal?: AbortSignal,
  readCurrentLearnerStateVersion: () => number | Promise<number> = () =>
    request.learnerStateVersion,
): Promise<string[]> {
  const local = rankLocally(request.candidates);
  try {
    const response = await gateway.rank(request, signal);
    const currentVersion = await readCurrentLearnerStateVersion();
    return validateRankResponse(request, response, currentVersion) ?? local;
  } catch {
    return local;
  }
}
