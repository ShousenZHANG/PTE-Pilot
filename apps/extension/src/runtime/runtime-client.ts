import {
  type AttemptEvent,
  type DraftCheckpoint,
  type IndexedQuestion,
  type IndexSnapshot,
  type RankCandidateSnapshot,
  type RestoredSession,
  type RuntimeRequest,
  RuntimeRequestSchema,
  type RuntimeResponse,
  RuntimeResponseSchema,
  type UserSettings,
  type WordStatSummary,
} from "@pte-pilot/contracts";

type RuntimeAction = RuntimeRequest["action"];

export class RuntimeClient {
  async loadDraft(
    predictionEdition: string,
    questionId: string,
  ): Promise<DraftCheckpoint | null> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadDraft",
      predictionEdition,
      questionId,
    });
    return assertAction(response, "storage/loadDraft").draft;
  }

  async saveDraft(draft: DraftCheckpoint): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveDraft",
      draft,
    });
  }

  async commitAttempt(
    predictionEdition: string,
    attempt: AttemptEvent,
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/commitAttempt",
      predictionEdition,
      attempt,
    });
  }

  async setMarked(
    predictionEdition: string,
    questionId: string,
    marked: boolean,
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/setMarked",
      predictionEdition,
      questionId,
      marked,
    });
  }

  async saveSession(question: {
    predictionEdition: string;
    questionId: string;
    position: number;
    total: number;
  }): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveSession",
      question,
    });
  }

  async restoreSession(): Promise<RestoredSession> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/restoreSession",
    });
    return assertAction(response, "storage/restoreSession").session;
  }

  async saveIndexSnapshot(
    snapshot: IndexSnapshot,
    questions: IndexedQuestion[],
  ): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveIndexSnapshot",
      snapshot,
      questions,
    });
  }

  async loadIndexSnapshot(
    predictionEdition: string,
  ): Promise<{ snapshot: IndexSnapshot | null; questions: IndexedQuestion[] }> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadIndexSnapshot",
      predictionEdition,
    });
    const result = assertAction(response, "storage/loadIndexSnapshot");
    return { snapshot: result.snapshot, questions: result.questions };
  }

  async getRankCandidates(
    predictionEdition: string,
    questionIds: string[],
  ): Promise<RankCandidateSnapshot> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/getRankCandidates",
      predictionEdition,
      questionIds,
    });
    return assertAction(response, "storage/getRankCandidates").snapshot;
  }

  async loadSettings(): Promise<UserSettings | null> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/loadSettings",
    });
    return assertAction(response, "storage/loadSettings").settings;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/saveSettings",
      settings,
    });
  }

  async listWordStats(limit = 200): Promise<WordStatSummary[]> {
    const response = await this.send({
      requestId: crypto.randomUUID(),
      action: "storage/listWordStats",
      limit,
    });
    return assertAction(response, "storage/listWordStats").words;
  }

  private async send(request: RuntimeRequest): Promise<RuntimeResponse> {
    const parsed = RuntimeRequestSchema.parse(request);
    const raw = await browser.runtime.sendMessage(parsed);
    const response = RuntimeResponseSchema.parse(raw);
    if (
      response.requestId !== parsed.requestId ||
      response.action !== parsed.action
    ) {
      throw new Error("runtime:response-mismatch");
    }
    if (!response.ok) throw new Error(`runtime:${response.reason}`);
    return response;
  }
}

function assertAction<A extends RuntimeAction>(
  response: RuntimeResponse,
  action: A,
): Extract<RuntimeResponse, { ok: true; action: A }> {
  if (!response.ok || response.action !== action)
    throw new Error("runtime:action-mismatch");
  return response as Extract<RuntimeResponse, { ok: true; action: A }>;
}
