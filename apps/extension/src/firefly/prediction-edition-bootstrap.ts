import type {
  IndexedQuestion,
  IndexSnapshot,
  QuestionIdentity,
} from "../domain/types";
import { verifiedPredictionEdition } from "./dom-adapter";
import {
  NavigationCoordinator,
  type NavigationSitePort,
} from "./navigation-coordinator";
import {
  type IndexCheckpointPort,
  type IndexSitePort,
  QuestionIndexer,
} from "./question-indexer";

export interface PredictionEditionBootstrapSitePort
  extends NavigationSitePort,
    IndexSitePort {
  beginProvisionalPredictionEdition(): string;
  adoptVerifiedPredictionEdition(
    edition: string,
    total: number,
    bootstrapToken: string,
  ): void;
  clearPredictionEditionOverride(bootstrapToken: string): void;
  invalidateProvisionalPredictionEdition(bootstrapToken: string): boolean;
}

export interface PredictionEditionBootstrapResult {
  edition: string;
  snapshot: IndexSnapshot;
  questions: IndexedQuestion[];
}

export class PredictionEditionBootstrap extends EventTarget {
  readonly #site: PredictionEditionBootstrapSitePort;
  #navigation: NavigationCoordinator | null = null;
  #indexer: QuestionIndexer | null = null;
  #bootstrapToken: string | null = null;
  #runPromise: Promise<PredictionEditionBootstrapResult> | null = null;
  #disposed = false;

  constructor(site: PredictionEditionBootstrapSitePort) {
    super();
    this.#site = site;
  }

  async run(): Promise<PredictionEditionBootstrapResult> {
    if (this.#disposed)
      throw new Error("prediction-edition-bootstrap:disposed");
    if (this.#runPromise)
      throw new Error("prediction-edition-bootstrap:already-running");

    const run = this.execute();
    this.#runPromise = run;
    return run;
  }

  private async execute(): Promise<PredictionEditionBootstrapResult> {
    let navigation: NavigationCoordinator | null = null;
    let bootstrapToken: string | null = null;
    try {
      bootstrapToken = this.#site.beginProvisionalPredictionEdition();
      this.#bootstrapToken = bootstrapToken;
      const origin = this.#site.readIdentity();
      const checkpoints = new MemoryIndexCheckpoints((completed, total) => {
        this.dispatchEvent(
          new CustomEvent("progress", { detail: { completed, total } }),
        );
      });
      navigation = new NavigationCoordinator(this.#site);
      const indexer = new QuestionIndexer(this.#site, navigation, checkpoints);
      this.#navigation = navigation;
      this.#indexer = indexer;

      const snapshot = await indexer.controlledTraversal();
      const restored = this.#site.readIdentity();
      validateTraversal(snapshot, checkpoints.questions, origin, restored);
      const edition = verifiedPredictionEdition({
        explicitValues: [],
        headingTexts: [],
        optionQuestionIds: snapshot.orderedQuestionIds,
        expectedTotal: snapshot.siteTotal,
      });
      this.#site.adoptVerifiedPredictionEdition(
        edition,
        snapshot.siteTotal,
        bootstrapToken,
      );
      const questions = checkpoints.questions
        .sort((left, right) => left.sitePosition - right.sitePosition)
        .map((question) => ({
          ...question,
          predictionEdition: edition,
        }));
      return {
        edition,
        snapshot: {
          predictionEdition: edition,
          orderedQuestionIds: [...snapshot.orderedQuestionIds],
          siteTotal: snapshot.siteTotal,
          completeness: "complete",
          schemaVersion: snapshot.schemaVersion,
        },
        questions,
      };
    } catch (error) {
      if (bootstrapToken)
        this.#site.clearPredictionEditionOverride(bootstrapToken);
      throw error;
    } finally {
      if (this.#bootstrapToken === bootstrapToken) this.#bootstrapToken = null;
      this.#indexer = null;
      this.#navigation = null;
      navigation?.dispose();
    }
  }

  cancel(): boolean {
    return this.#indexer?.cancel() ?? false;
  }

  async dispose(): Promise<void> {
    if (!this.#disposed) {
      this.#disposed = true;
      if (this.#bootstrapToken)
        this.#site.invalidateProvisionalPredictionEdition(this.#bootstrapToken);
      this.#indexer?.hardCancel();
      this.#navigation?.dispose();
    }
    await this.#runPromise?.catch(() => undefined);
  }
}

class MemoryIndexCheckpoints implements IndexCheckpointPort {
  readonly #onProgress: (completed: number, total: number) => void;
  readonly #questions = new Map<number, IndexedQuestion>();

  constructor(onProgress: (completed: number, total: number) => void) {
    this.#onProgress = onProgress;
  }

  get questions(): IndexedQuestion[] {
    return [...this.#questions.values()];
  }

  async saveQuestion(question: IndexedQuestion): Promise<void> {
    this.#questions.set(question.sitePosition, question);
    this.#onProgress(this.#questions.size, question.siteTotal);
  }

  async saveSnapshot(_snapshot: IndexSnapshot): Promise<void> {}
}

function validateTraversal(
  snapshot: IndexSnapshot,
  questions: readonly IndexedQuestion[],
  origin: QuestionIdentity,
  restored: QuestionIdentity,
): void {
  if (snapshot.completeness !== "complete")
    throw new Error("prediction-edition-bootstrap:incomplete");
  if (
    !Number.isSafeInteger(snapshot.siteTotal) ||
    snapshot.siteTotal < 1 ||
    snapshot.siteTotal !== origin.total ||
    questions.some((question) => question.siteTotal !== snapshot.siteTotal)
  ) {
    throw new Error("prediction-edition-bootstrap:total-changed");
  }
  if (
    snapshot.orderedQuestionIds.length !== snapshot.siteTotal ||
    new Set(snapshot.orderedQuestionIds).size !== snapshot.siteTotal ||
    questions.length !== snapshot.siteTotal ||
    new Set(questions.map((question) => question.sitePosition)).size !==
      snapshot.siteTotal ||
    questions.some(
      (question) =>
        snapshot.orderedQuestionIds[question.sitePosition - 1] !==
        question.questionId,
    )
  ) {
    throw new Error("prediction-edition-bootstrap:ordered-ids-invalid");
  }
  if (
    snapshot.predictionEdition !== origin.predictionEdition ||
    questions.some(
      (question) => question.predictionEdition !== snapshot.predictionEdition,
    )
  ) {
    throw new Error("prediction-edition-bootstrap:edition-changed");
  }
  if (!sameIdentity(origin, restored))
    throw new Error("prediction-edition-bootstrap:restore-failed");
}

function sameIdentity(
  left: QuestionIdentity,
  right: QuestionIdentity,
): boolean {
  return (
    left.predictionEdition === right.predictionEdition &&
    left.questionId === right.questionId &&
    left.position === right.position &&
    left.total === right.total
  );
}
