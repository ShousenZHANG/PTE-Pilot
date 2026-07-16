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

describe("runtime handler", () => {
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
