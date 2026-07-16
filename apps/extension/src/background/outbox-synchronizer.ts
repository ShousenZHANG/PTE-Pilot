import type { BatchUpsertResponse } from "@pte-pilot/contracts";
import type { PtePilotGatewayClient } from "./gateway-http-client";
import type { CockpitRepositories } from "./storage/repositories";

export interface OutboxSyncResult {
  acknowledged: number;
  pending: number;
}

export interface OutboxWakeScheduler {
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
}

const defaultWakeScheduler: OutboxWakeScheduler = {
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class OutboxSynchronizer {
  private active: Promise<OutboxSyncResult> | null = null;
  private rerunRequested = false;
  private wakeHandle: unknown | null = null;

  constructor(
    private readonly repository: CockpitRepositories,
    private readonly gateway: PtePilotGatewayClient,
    private readonly clock: () => number = Date.now,
    private readonly maxBatchesPerDrain = 10,
    private readonly wakeScheduler: OutboxWakeScheduler = defaultWakeScheduler,
  ) {}

  drain(signal?: AbortSignal): Promise<OutboxSyncResult> {
    if (this.active) return this.active;
    this.cancelWake();
    const active = this.runDrain(signal).finally(async () => {
      if (this.active !== active) return;
      this.active = null;
      if (this.rerunRequested) {
        this.rerunRequested = false;
        this.schedule();
        return;
      }
      await this.armNextWake();
    });
    this.active = active;
    return active;
  }

  schedule(): void {
    this.cancelWake();
    if (this.active) {
      this.rerunRequested = true;
      return;
    }
    void this.drain().catch(() => {
      // Offline is expected. Durable outbox keeps every unacknowledged event.
    });
  }

  private async runDrain(signal?: AbortSignal): Promise<OutboxSyncResult> {
    let acknowledged = 0;
    for (let index = 0; index < this.maxBatchesPerDrain; index += 1) {
      if (signal?.aborted) break;
      const now = new Date(this.clock()).toISOString();
      const batchId = crypto.randomUUID();
      const batch = await this.repository.leaseOutbox(batchId, 100, now);
      if (!batch) break;
      try {
        const response = await this.gateway.upsertEvents(batch, signal);
        this.assertMatchingAcknowledgement(batch, response);
        await this.repository.ackOutbox(response, now);
        acknowledged += response.ackedAttemptIds.length;
      } catch (error) {
        await this.repository.releaseOutbox(batchId, now);
        throw error;
      }
    }
    return {
      acknowledged,
      pending: await this.repository.countOutbox(),
    };
  }

  private async armNextWake(): Promise<void> {
    const nextWakeAt = await this.repository.nextOutboxWakeAt();
    if (nextWakeAt === null) return;
    const delayMs = Math.max(0, Date.parse(nextWakeAt) - this.clock());
    this.wakeHandle = this.wakeScheduler.schedule(() => {
      this.wakeHandle = null;
      this.schedule();
    }, delayMs);
  }

  private cancelWake(): void {
    if (this.wakeHandle === null) return;
    this.wakeScheduler.cancel(this.wakeHandle);
    this.wakeHandle = null;
  }

  private assertMatchingAcknowledgement(
    batch: { batchId: string; events: readonly { attemptId: string }[] },
    response: BatchUpsertResponse,
  ): void {
    const allowed = new Set(batch.events.map((event) => event.attemptId));
    if (
      response.batchId !== batch.batchId ||
      response.ackedAttemptIds.some((attemptId) => !allowed.has(attemptId))
    ) {
      throw new Error("Gateway acknowledgement does not match leased batch");
    }
  }
}
