import {
  type RuntimeFailureReason,
  RuntimeFailureSchema,
  type RuntimeRequest,
  RuntimeRequestSchema,
  type RuntimeResponse,
  RuntimeResponseSchema,
} from "@pte-pilot/contracts";
import {
  GatewayHttpError,
  type PtePilotGatewayClient,
} from "./gateway-http-client";
import type { OutboxSynchronizer } from "./outbox-synchronizer";
import type { CockpitRepositories } from "./storage/repositories";

export interface RuntimeSender {
  id?: string;
  url?: string;
}

export interface RuntimeHandlerDependencies {
  extensionId: string;
  repository: CockpitRepositories;
  gateway: PtePilotGatewayClient;
  synchronizer: OutboxSynchronizer;
}

function isAllowedSender(sender: RuntimeSender, extensionId: string): boolean {
  if (sender.id !== extensionId || !sender.url) return false;
  try {
    const url = new URL(sender.url);
    const pageSources = url.searchParams.getAll("pageSource");
    return (
      url.protocol === "https:" &&
      url.hostname === "www.fireflyau.com" &&
      url.pathname === "/ptehome/exercise" &&
      pageSources.length === 1 &&
      pageSources[0] === "yc"
    );
  } catch {
    return false;
  }
}

function failureReason(error: unknown): RuntimeFailureReason {
  if (error instanceof InvalidRuntimeRequestError) return "invalid-request";
  if (error instanceof GatewayHttpError) return error.reason;
  return "storage-failure";
}

class InvalidRuntimeRequestError extends Error {}

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
  const { repository, gateway, synchronizer } = dependencies;
  switch (request.action) {
    case "storage/loadDraft":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        draft: await repository.loadDraft(
          request.predictionEdition,
          request.questionId,
        ),
      };
    case "storage/saveDraft":
      await repository.saveDraft(request.draft);
      return { requestId: request.requestId, ok: true, action: request.action };
    case "storage/commitAttempt":
      await repository.commitAttempt(
        request.predictionEdition,
        request.attempt,
      );
      synchronizer.schedule();
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
    case "gateway/health":
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        health: await gateway.health(),
      };
    case "gateway/pair": {
      const health = await gateway.pair(request.pairingCode);
      await repository.requeueAllAttemptsForProjection(
        health.projectionInstanceId,
      );
      synchronizer.schedule();
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        paired: true,
        health,
      };
    }
    case "gateway/sync": {
      const result = await synchronizer.drain();
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        ...result,
      };
    }
    case "gateway/rank": {
      const { snapshot, questions } = await repository.loadIndexSnapshot(
        request.predictionEdition,
      );
      const snapshotIds = new Set(snapshot?.orderedQuestionIds ?? []);
      const allowed = new Set(
        questions
          .filter((question) => snapshotIds.has(question.questionId))
          .map((question) => question.questionId),
      );
      if (
        request.request.candidates.some(
          (candidate) => !allowed.has(candidate.questionId),
        )
      ) {
        throw new InvalidRuntimeRequestError("rank candidate is not indexed");
      }
      return {
        requestId: request.requestId,
        ok: true,
        action: request.action,
        response: await gateway.rank(request.request),
      };
    }
  }
}
