import type { HermesClient } from "../hermes/hermes-client.js";
import type { AttemptProjection } from "../projection/attempt-projection.js";

export class MemorySyncCoordinator {
  private interval: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;

  constructor(
    private readonly projection: AttemptProjection,
    private readonly hermes: HermesClient,
    private readonly intervalMs: number,
  ) {}

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.kick(), this.intervalMs);
    this.interval.unref();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
  }

  kick(): void {
    void this.flush();
  }

  async flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.flushOnce().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async flushOnce(): Promise<void> {
    const state = this.projection.getMemorySyncState();
    if (state.targetVersion <= state.syncedVersion) return;
    const audit = await this.hermes.audit().catch(() => null);
    if (audit?.status !== "ready") return;
    const profile = this.projection.getCompactLearningProfile();
    try {
      await this.hermes.syncMemory(profile);
      this.projection.markMemorySynced(profile.projectionVersion);
    } catch {
      // Best effort only. SQLite acknowledgement remains authoritative.
    }
  }
}
