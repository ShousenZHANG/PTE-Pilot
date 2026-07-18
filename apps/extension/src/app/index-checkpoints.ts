import type {
  IndexedQuestion as ContractIndexedQuestion,
  IndexSnapshot as ContractIndexSnapshot,
} from "@pte-pilot/contracts";
import type {
  IndexedQuestion,
  IndexSnapshot,
  QuestionIdentity,
} from "../domain/types";
import { isVerifiedQuestionSetEdition } from "../firefly/dom-adapter";
import type { PredictionEditionBootstrapResult } from "../firefly/prediction-edition-bootstrap";
import type { IndexCheckpointPort } from "../firefly/question-indexer";
import type { RuntimeClient } from "../runtime/runtime-client";

export interface ControllerIndexCheckpoints extends IndexCheckpointPort {
  readonly snapshot: IndexSnapshot | null;
  isCompleteFor(identity: QuestionIdentity): boolean;
  hasCompleteEdition(predictionEdition: string, total: number): boolean;
}

export class SessionIndexCheckpoints implements ControllerIndexCheckpoints {
  readonly #questions = new Map<number, IndexedQuestion>();
  #snapshot: IndexSnapshot | null = null;

  get snapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeSnapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeQuestions(): IndexedQuestion[] {
    return [...this.#questions.values()].sort(
      (left, right) => left.sitePosition - right.sitePosition,
    );
  }

  isCompleteFor(identity: QuestionIdentity): boolean {
    return (
      this.hasCompleteEdition(identity.predictionEdition, identity.total) &&
      this.#questions.get(identity.position)?.questionId === identity.questionId
    );
  }

  hasCompleteEdition(predictionEdition: string, total: number): boolean {
    return (
      this.#snapshot?.completeness === "complete" &&
      this.#snapshot.predictionEdition === predictionEdition &&
      this.#snapshot.siteTotal === total
    );
  }

  async saveQuestion(question: IndexedQuestion): Promise<void> {
    this.#questions.set(question.sitePosition, question);
  }

  async saveSnapshot(snapshot: IndexSnapshot): Promise<void> {
    const questions = this.resumeQuestions().filter(
      (question) =>
        question.predictionEdition === snapshot.predictionEdition &&
        question.siteTotal === snapshot.siteTotal,
    );
    const complete =
      snapshot.completeness === "complete" &&
      questions.length === snapshot.siteTotal &&
      questions.every((question, index) => question.sitePosition === index + 1);
    this.#snapshot = {
      ...snapshot,
      orderedQuestionIds: questions.map((question) => question.questionId),
      completeness: complete ? "complete" : "partial",
    };
  }
}

export class RuntimeIndexCheckpoints implements ControllerIndexCheckpoints {
  readonly #runtime: RuntimeClient;
  readonly #questions = new Map<string, IndexedQuestion>();
  #snapshot: IndexSnapshot | null = null;

  constructor(runtime: RuntimeClient) {
    this.#runtime = runtime;
  }

  get snapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeSnapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeQuestions(): IndexedQuestion[] {
    if (!this.#snapshot) return [];
    return [...this.#questions.values()].filter(
      (question) =>
        question.predictionEdition === this.#snapshot?.predictionEdition &&
        question.siteTotal === this.#snapshot.siteTotal,
    );
  }

  isCompleteFor(identity: QuestionIdentity): boolean {
    if (
      this.#snapshot?.completeness !== "complete" ||
      this.#snapshot.predictionEdition !== identity.predictionEdition ||
      this.#snapshot.siteTotal !== identity.total
    )
      return false;
    const atPosition = [...this.#questions.values()].find(
      (question) =>
        question.predictionEdition === identity.predictionEdition &&
        question.sitePosition === identity.position,
    );
    return atPosition?.questionId === identity.questionId;
  }

  hasCompleteEdition(predictionEdition: string, total: number): boolean {
    return (
      this.#snapshot?.completeness === "complete" &&
      this.#snapshot.predictionEdition === predictionEdition &&
      this.#snapshot.siteTotal === total
    );
  }

  async adoptBootstrap(
    result: PredictionEditionBootstrapResult,
  ): Promise<void> {
    if (
      !isVerifiedQuestionSetEdition(
        result.edition,
        result.snapshot.siteTotal,
      ) ||
      result.snapshot.predictionEdition !== result.edition ||
      result.snapshot.completeness !== "complete" ||
      result.questions.length !== result.snapshot.siteTotal ||
      result.questions.some(
        (question, index) =>
          question.predictionEdition !== result.edition ||
          question.siteTotal !== result.snapshot.siteTotal ||
          question.sitePosition !== index + 1 ||
          question.questionId !== result.snapshot.orderedQuestionIds[index],
      )
    ) {
      throw new Error("index:invalid-bootstrap-result");
    }
    this.#questions.clear();
    this.#snapshot = null;
    for (const question of result.questions) {
      this.#questions.set(
        `${question.predictionEdition}:${question.questionId}`,
        question,
      );
    }
    await this.saveSnapshot(result.snapshot);
  }

  async hydrate(predictionEdition: string): Promise<void> {
    const { snapshot, questions } = await this.#runtime
      .loadIndexSnapshot(predictionEdition)
      .catch(() => ({
        snapshot: null,
        questions: [],
      }));
    this.#snapshot = snapshot as IndexSnapshot | null;
    for (const question of questions) {
      this.#questions.set(
        `${question.predictionEdition}:${question.questionId}`,
        question,
      );
    }
  }

  async saveQuestion(question: IndexedQuestion): Promise<void> {
    for (const [key, existing] of this.#questions) {
      if (
        existing.predictionEdition === question.predictionEdition &&
        existing.sitePosition === question.sitePosition &&
        existing.questionId !== question.questionId
      )
        this.#questions.delete(key);
    }
    this.#questions.set(
      `${question.predictionEdition}:${question.questionId}`,
      question,
    );
  }

  async saveSnapshot(snapshot: IndexSnapshot): Promise<void> {
    const previous = this.#snapshot;
    const preserveComplete =
      snapshot.completeness === "partial" &&
      previous?.completeness === "complete" &&
      previous.predictionEdition === snapshot.predictionEdition &&
      previous.siteTotal === snapshot.siteTotal &&
      previous.orderedQuestionIds.every((questionId, index) =>
        [...this.#questions.values()].some(
          (question) =>
            question.predictionEdition === snapshot.predictionEdition &&
            question.questionId === questionId &&
            question.sitePosition === index + 1,
        ),
      );
    const targetSnapshot = preserveComplete ? previous : snapshot;
    const completeIds =
      targetSnapshot.completeness === "complete"
        ? new Set(targetSnapshot.orderedQuestionIds)
        : null;
    const questions = [...this.#questions.values()]
      .filter(
        (question) =>
          question.predictionEdition === targetSnapshot.predictionEdition &&
          (!completeIds || completeIds.has(question.questionId)),
      )
      .sort((left, right) => left.sitePosition - right.sitePosition);
    const complete =
      targetSnapshot.completeness === "complete" &&
      questions.length === targetSnapshot.siteTotal &&
      questions.every((question, index) => question.sitePosition === index + 1);
    const merged: IndexSnapshot = {
      ...targetSnapshot,
      orderedQuestionIds: questions.map((question) => question.questionId),
      completeness: complete ? "complete" : "partial",
    };
    this.#snapshot = merged;
    await this.#runtime.saveIndexSnapshot(
      merged as ContractIndexSnapshot,
      questions as ContractIndexedQuestion[],
    );
  }
}
