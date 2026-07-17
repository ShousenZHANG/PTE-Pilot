import { RuntimeRequestSchema } from "@pte-pilot/contracts";
import { describe, expect, test, vi } from "vitest";
import type { PtePilotGatewayClient } from "./gateway-http-client";
import type { OutboxSynchronizer } from "./outbox-synchronizer";
import { createRuntimeMessageHandler } from "./runtime-handler";
import type { CockpitRepositories } from "./storage/repositories";

const health = {
  service: "pte-pilot" as const,
  status: "degraded" as const,
  profile: "pte-pilot" as const,
  schemaVersion: 1 as const,
  projectionInstanceId: "5f522c04-4d75-461f-8d12-e2c890b1f405",
  projectionVersion: 0,
  capabilities: ["events:batchUpsert", "rank", "pair"] as const,
  hermes: {
    status: "offline" as const,
    model: null,
    enabledTools: [],
    unexpectedTools: [],
  },
};

const trustedSender = {
  id: "extension-id",
  url: "https://www.fireflyau.com/ptehome/exercise?pageSource=yc",
};

const provisionalEdition = "provisional:bootstrap-token";
const sessionEdition = "session:current-tab-token";
const verifiedEdition = "yc-set-193-0123456789abcdef";
const requestId = "6ab7bfd2-6f84-4935-8f68-5ae8cae5da41";

const attempt = {
  attemptId: "81d4e9de-457d-4b86-a51a-e93996dcb1ac",
  questionId: "131020",
  accuracy: 0.75,
  durationMs: 8_400,
  replayCount: 1,
  errors: [],
  completedAt: "2026-07-15T10:00:00.000Z",
};

const rankRequest = {
  decisionId: "fbbe1ba0-e458-49ab-b03a-0ceebb1d32a8",
  candidateSetHash: `sha256:${"a".repeat(64)}`,
  learnerStateVersion: 3,
  candidates: [
    {
      questionId: "131020",
      dueScore: 1,
      weaknessScore: 0.5,
      noveltyScore: 0,
      marked: false,
      attemptCount: 2,
      lastAttemptAt: "2026-07-15T10:00:00.000Z",
    },
  ],
};

function blockedEditionRequests(blockedEdition: string) {
  return [
    {
      location: "top-level loadDraft edition",
      request: {
        requestId,
        action: "storage/loadDraft",
        predictionEdition: blockedEdition,
        questionId: "131020",
      },
    },
    {
      location: "nested draft edition",
      request: {
        requestId,
        action: "storage/saveDraft",
        draft: {
          predictionEdition: blockedEdition,
          questionId: "131020",
          text: "answer",
          revision: 0,
          updatedAt: "2026-07-15T10:00:00.000Z",
        },
      },
    },
    {
      location: "top-level commitAttempt edition",
      request: {
        requestId,
        action: "storage/commitAttempt",
        predictionEdition: blockedEdition,
        attempt,
      },
    },
    {
      location: "top-level setMarked edition",
      request: {
        requestId,
        action: "storage/setMarked",
        predictionEdition: blockedEdition,
        questionId: "131020",
        marked: true,
      },
    },
    {
      location: "top-level getRankCandidates edition",
      request: {
        requestId,
        action: "storage/getRankCandidates",
        predictionEdition: blockedEdition,
        questionIds: ["131020"],
      },
    },
    {
      location: "nested session question edition",
      request: {
        requestId,
        action: "storage/saveSession",
        question: {
          predictionEdition: blockedEdition,
          questionId: "131020",
          position: 1,
          total: 193,
        },
      },
    },
    {
      location: "top-level loadIndexSnapshot edition",
      request: {
        requestId,
        action: "storage/loadIndexSnapshot",
        predictionEdition: blockedEdition,
      },
    },
    {
      location: "nested snapshot edition",
      request: {
        requestId,
        action: "storage/saveIndexSnapshot",
        snapshot: {
          predictionEdition: blockedEdition,
          orderedQuestionIds: ["131020"],
          siteTotal: 193,
          completeness: "partial",
          checkpointPosition: 1,
          schemaVersion: 1,
        },
        questions: [
          {
            predictionEdition: verifiedEdition,
            questionId: "131020",
            sitePosition: 1,
            siteTotal: 193,
            tags: [],
            discoveredAt: "2026-07-15T10:00:00.000Z",
            schemaVersion: 1,
          },
        ],
      },
    },
    {
      location: "nested indexed question edition",
      request: {
        requestId,
        action: "storage/saveIndexSnapshot",
        snapshot: {
          predictionEdition: verifiedEdition,
          orderedQuestionIds: ["131020"],
          siteTotal: 193,
          completeness: "partial",
          checkpointPosition: 1,
          schemaVersion: 1,
        },
        questions: [
          {
            predictionEdition: blockedEdition,
            questionId: "131020",
            sitePosition: 1,
            siteTotal: 193,
            tags: [],
            discoveredAt: "2026-07-15T10:00:00.000Z",
            schemaVersion: 1,
          },
        ],
      },
    },
    {
      location: "top-level gateway rank edition",
      request: {
        requestId,
        action: "gateway/rank",
        predictionEdition: blockedEdition,
        request: rankRequest,
      },
    },
  ] as const;
}

const blockedEditionCases = [
  { kind: "provisional", edition: provisionalEdition },
  { kind: "session", edition: sessionEdition },
].flatMap(({ kind, edition }) =>
  blockedEditionRequests(edition).map(({ location, request }) => ({
    kind,
    location,
    request,
  })),
);

function createNeverCalledDependencies() {
  const repositoryCall = vi.fn();
  const gatewayCall = vi.fn();
  const synchronizerCall = vi.fn();
  return {
    calls: { repositoryCall, gatewayCall, synchronizerCall },
    dependencies: {
      extensionId: "extension-id",
      repository: new Proxy({} as CockpitRepositories, {
        get: () => repositoryCall,
      }),
      gateway: new Proxy({} as PtePilotGatewayClient, {
        get: () => gatewayCall,
      }),
      synchronizer: new Proxy({} as OutboxSynchronizer, {
        get: () => synchronizerCall,
      }),
    },
  };
}

describe("runtime handler", () => {
  test.each(blockedEditionCases)(
    "rejects $kind prediction edition at $location before side effects",
    async ({ request }) => {
      expect(RuntimeRequestSchema.safeParse(request).success).toBe(true);
      const { dependencies, calls } = createNeverCalledDependencies();
      const handler = createRuntimeMessageHandler(dependencies);

      const response = await handler(request, trustedSender);

      expect(response).toMatchObject({
        action: request.action,
        ok: false,
        reason: "invalid-request",
      });
      expect(calls.repositoryCall).not.toHaveBeenCalled();
      expect(calls.gatewayCall).not.toHaveBeenCalled();
      expect(calls.synchronizerCall).not.toHaveBeenCalled();
    },
  );

  test("does not treat provisional text as a provisional prediction edition", async () => {
    const saveDraft = vi.fn(async () => undefined);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: {} as PtePilotGatewayClient,
      repository: { saveDraft } as unknown as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });
    const draft = {
      predictionEdition: verifiedEdition,
      questionId: "131020",
      text: "provisional: is ordinary learner text here",
      revision: 0,
      updatedAt: "2026-07-15T10:00:00.000Z",
    };

    const response = await handler(
      { requestId, action: "storage/saveDraft", draft },
      trustedSender,
    );

    expect(response).toMatchObject({
      action: "storage/saveDraft",
      ok: true,
    });
    expect(saveDraft).toHaveBeenCalledWith(draft);
  });

  test("does not treat an ordinary keymap entry as a prediction edition", async () => {
    const saveSettings = vi.fn(async () => undefined);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: {} as PtePilotGatewayClient,
      repository: { saveSettings } as unknown as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });
    const settings = {
      id: "current" as const,
      mode: "practice" as const,
      audioStrategy: "site-player-only" as const,
      keymap: { predictionEdition: "provisional:ordinary-shortcut-text" },
      updatedAt: "2026-07-15T10:00:00.000Z",
    };

    const response = await handler(
      { requestId, action: "storage/saveSettings", settings },
      trustedSender,
    );

    expect(response).toMatchObject({
      action: "storage/saveSettings",
      ok: true,
    });
    expect(saveSettings).toHaveBeenCalledWith(settings);
  });

  test("accepts the live Firefly route after pageSource is stripped", async () => {
    const loadSettings = vi.fn(async () => null);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: {} as PtePilotGatewayClient,
      repository: { loadSettings } as unknown as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });

    const response = await handler(
      {
        requestId: "e33ba927-9631-49d6-b7cc-bda4cf4e54ae",
        action: "storage/loadSettings",
      },
      {
        id: "extension-id",
        url: "https://www.fireflyau.com/ptehome/exercise",
      },
    );

    expect(response).toMatchObject({
      action: "storage/loadSettings",
      ok: true,
    });
    expect(loadSettings).toHaveBeenCalledOnce();
  });

  test("pair reply contains status but never bearer token", async () => {
    const pair = vi.fn(async () => health);
    const schedule = vi.fn();
    const requeueAllAttemptsForProjection = vi.fn(async () => undefined);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: { pair } as unknown as PtePilotGatewayClient,
      repository: {
        requeueAllAttemptsForProjection,
      } as unknown as CockpitRepositories,
      synchronizer: { schedule } as unknown as OutboxSynchronizer,
    });
    const response = await handler(
      {
        requestId: "9a80e17d-fbbc-4d45-96f6-4ff8fd5edbcb",
        action: "gateway/pair",
        pairingCode: "ABCDEFGH2345",
      },
      {
        id: "extension-id",
        url: "https://www.fireflyau.com/ptehome/exercise?pageSource=yc",
      },
    );
    expect(response).toMatchObject({
      action: "gateway/pair",
      ok: true,
      paired: true,
      health,
    });
    expect(JSON.stringify(response)).not.toMatch(/token|ABCDEFGH2345/iu);
    expect(pair).toHaveBeenCalledWith("ABCDEFGH2345");
    expect(requeueAllAttemptsForProjection).toHaveBeenCalledWith(
      health.projectionInstanceId,
    );
    expect(schedule).toHaveBeenCalledOnce();
  });

  test("ignores messages from every non-target sender", async () => {
    const pair = vi.fn(async () => health);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: { pair } as unknown as PtePilotGatewayClient,
      repository: {} as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });
    expect(
      await handler(
        {
          requestId: "9a80e17d-fbbc-4d45-96f6-4ff8fd5edbcb",
          action: "gateway/pair",
          pairingCode: "ABCDEFGH2345",
        },
        { id: "extension-id", url: "https://attacker.invalid/" },
      ),
    ).toBeUndefined();
    expect(
      await handler(
        {
          requestId: "9a80e17d-fbbc-4d45-96f6-4ff8fd5edbcb",
          action: "gateway/pair",
          pairingCode: "ABCDEFGH2345",
        },
        {
          id: "extension-id",
          url: "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=other",
        },
      ),
    ).toBeUndefined();
    expect(pair).not.toHaveBeenCalled();
  });

  test.each([
    "https://www.fireflyau.com/ptehome/exercise?pageSource=",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=other",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=yc",
    "http://www.fireflyau.com/ptehome/exercise?pageSource=yc",
    "https://www.fireflyau.com:444/ptehome/exercise?pageSource=yc",
    "https://evil.fireflyau.com/ptehome/exercise?pageSource=yc",
    "https://www.fireflyau.com/ptehome/other?pageSource=yc",
  ])("rejects untrusted Firefly sender URL %s", async (url) => {
    const loadSettings = vi.fn(async () => null);
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: {} as PtePilotGatewayClient,
      repository: { loadSettings } as unknown as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });

    const response = await handler(
      {
        requestId: "25a88e10-3f59-420a-b89d-33fc96121b07",
        action: "storage/loadSettings",
      },
      { id: "extension-id", url },
    );

    expect(response).toBeUndefined();
    expect(loadSettings).not.toHaveBeenCalled();
  });

  test("rejects a rank candidate left outside the latest snapshot allowlist", async () => {
    const rank = vi.fn();
    const handler = createRuntimeMessageHandler({
      extensionId: "extension-id",
      gateway: { rank } as unknown as PtePilotGatewayClient,
      repository: {
        loadIndexSnapshot: vi.fn(async () => ({
          snapshot: {
            predictionEdition: "yc-2026-w29",
            orderedQuestionIds: ["q-new"],
            siteTotal: 2,
            completeness: "partial" as const,
            checkpointPosition: 2,
            schemaVersion: 1,
          },
          questions: [
            {
              predictionEdition: "yc-2026-w29",
              questionId: "q-old",
              sitePosition: 2,
              siteTotal: 2,
              tags: [],
              discoveredAt: "2026-07-15T10:00:00.000Z",
              schemaVersion: 1,
            },
            {
              predictionEdition: "yc-2026-w29",
              questionId: "q-new",
              sitePosition: 2,
              siteTotal: 2,
              tags: [],
              discoveredAt: "2026-07-15T10:01:00.000Z",
              schemaVersion: 1,
            },
          ],
        })),
      } as unknown as CockpitRepositories,
      synchronizer: {} as OutboxSynchronizer,
    });

    const response = await handler(
      {
        requestId: "fd63260c-bff7-4ed6-8027-9abc5db47823",
        action: "gateway/rank",
        predictionEdition: "yc-2026-w29",
        request: {
          decisionId: "c5cc7c03-7b27-49af-823d-fb140fb72483",
          candidateSetHash: `sha256:${"0".repeat(64)}`,
          learnerStateVersion: 1,
          candidates: [
            {
              questionId: "q-old",
              dueScore: 1,
              weaknessScore: 0,
              noveltyScore: 1,
              marked: false,
              attemptCount: 0,
              lastAttemptAt: null,
            },
          ],
        },
      },
      {
        id: "extension-id",
        url: "https://www.fireflyau.com/ptehome/exercise?pageSource=yc",
      },
    );

    expect(response).toMatchObject({ ok: false, reason: "invalid-request" });
    expect(rank).not.toHaveBeenCalled();
  });
});
