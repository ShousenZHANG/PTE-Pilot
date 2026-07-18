import {
  type RuntimeFailureReason,
  RuntimeFailureSchema,
  type RuntimeRequest,
  RuntimeRequestSchema,
  type RuntimeResponse,
  RuntimeResponseSchema,
} from "@pte-pilot/contracts";
import { isSupportedFireflyExerciseUrl } from "../firefly/url-policy";
import type { CockpitRepositories } from "./storage/repositories";

export interface RuntimeSender {
  id?: string;
  url?: string;
}

export interface RuntimeHandlerDependencies {
  extensionId: string;
  repository: CockpitRepositories;
}

function isAllowedSender(sender: RuntimeSender, extensionId: string): boolean {
  if (sender.id !== extensionId || !sender.url) return false;
  try {
    return isSupportedFireflyExerciseUrl(new URL(sender.url));
  } catch {
    return false;
  }
}

function failureReason(error: unknown): RuntimeFailureReason {
  if (error instanceof InvalidRuntimeRequestError) return "invalid-request";
  return "storage-failure";
}

class InvalidRuntimeRequestError extends Error {}

function predictionEditions(request: RuntimeRequest): readonly string[] {
  switch (request.action) {
    case "storage/commitAttempt":
    case "storage/setMarked":
    case "storage/getRankCandidates":
    case "storage/loadIndexSnapshot":
      return [request.predictionEdition];
    case "storage/saveSession":
      return [request.question.predictionEdition];
    case "storage/saveIndexSnapshot":
      return [
        request.snapshot.predictionEdition,
        ...request.questions.map((question) => question.predictionEdition),
      ];
    default:
      return [];
  }
}

const EPHEMERAL_EDITION_PREFIXES = ["provisional:", "session:"] as const;

function hasEphemeralPredictionEdition(request: RuntimeRequest): boolean {
  return predictionEditions(request).some((edition) =>
    EPHEMERAL_EDITION_PREFIXES.some((prefix) => edition.startsWith(prefix)),
  );
}

function failure(request: RuntimeRequest, error: unknown): RuntimeResponse {
  return RuntimeFailureSchema.parse({
    requestId: request.requestId,
    ok: false,
    action: request.action,
    reason: failureReason(error),
  });
}

export function createRuntimeMessageHandler(
  dependencies: RuntimeHandlerDependencies,
): (
  message: unknown,
  sender: RuntimeSender,
) => Promise<RuntimeResponse | undefined> {
  return async (message, sender) => {
    if (!isAllowedSender(sender, dependencies.extensionId)) return undefined;
    const parsed = RuntimeRequestSchema.safeParse(message);
    if (!parsed.success) return undefined;
    const request = parsed.data;
    try {
      if (hasEphemeralPredictionEdition(request)) {
        throw new InvalidRuntimeRequestError(
          "ephemeral prediction edition cannot cross the runtime boundary",
        );
      }
      const response = await execute(request, dependencies);
      return RuntimeResponseSchema.parse(response);
    } catch (error) {
      return failure(request, error);
    }
  };
}

async function execute(
  request: RuntimeRequest,
  dependencies: RuntimeHandlerDependencies,
): Promise<RuntimeResponse> {
  const { repository } = dependencies;
  switch (request.action) {
    case "storage/commitAttempt":
      await repository.commitAttempt(
        request.predictionEdition,
        request.attempt,
      );
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/setMarked":
      await repository.setMarked(
        request.predictionEdition,
        request.questionId,
        request.marked,
      );
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/getRankCandidates":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        snapshot: await repository.getRankCandidates(
          request.predictionEdition,
          request.questionIds,
        ),
      };
    case "storage/restoreSession":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        session: await repository.restoreSession(),
      };
    case "storage/saveSession":
      await repository.saveSession(request.question);
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/loadIndexSnapshot": {
      const index = await repository.loadIndexSnapshot(
        request.predictionEdition,
      );
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        ...index,
      };
    }
    case "storage/saveIndexSnapshot":
      await repository.saveIndexSnapshot(request.snapshot, request.questions);
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/loadSettings":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        settings: await repository.loadSettings(),
      };
    case "storage/saveSettings":
      await repository.saveSettings(request.settings);
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/listWordStats":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        words: await repository.listWordStats(request.limit),
      };
    case "storage/matchVerifiedEdition":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        edition: await repository.matchVerifiedEdition({
          questionId: request.questionId,
          position: request.position,
          total: request.total,
        }),
      };
    default:
      throw new InvalidRuntimeRequestError("unsupported runtime action");
  }
}
