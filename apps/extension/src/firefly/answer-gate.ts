import type {
  QuestionIdentity,
  RevealSignature,
  ReviewResult,
  SubmissionContext,
} from "../domain/types";
import { diffWords } from "../practice/word-diff";

export interface AnswerSitePort {
  readIdentity(): QuestionIdentity;
  writeAnswer(value: string): void;
  revealSignature(): RevealSignature;
  scoreAndWait(
    expected: QuestionIdentity,
    operationToken: string,
    timeoutMs?: number,
  ): Promise<RevealedAnswerProof | null>;
  revealAnswerAndWait(
    expected: QuestionIdentity,
    operationToken: string,
    timeoutMs?: number,
  ): Promise<RevealedAnswerProof>;
  isScoreComplete(): boolean;
  click(name: "redo"): void;
  capabilities(): { redo: boolean };
  readRevealedAnswer(proof: RevealedAnswerProof): string;
  input(): HTMLTextAreaElement;
}

export interface RevealedAnswerProof {
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
  operationToken: string;
  source: "score" | "answer";
}

export interface SubmitResult {
  context: SubmissionContext;
  review: ReviewResult;
}

export class AnswerGate {
  readonly #site: AnswerSitePort;
  #attemptEpoch = 0;
  #activeToken: string | null = null;
  #navigationEpoch = 0;

  constructor(site: AnswerSitePort) {
    this.#site = site;
  }

  setNavigationEpoch(epoch: number): void {
    if (epoch === this.#navigationEpoch) return;
    this.#navigationEpoch = epoch;
    this.#activeToken = null;
  }

  async submit(draft: string): Promise<SubmitResult> {
    if (this.#activeToken !== null)
      throw new Error("submission:already-active");
    const identity = this.#site.readIdentity();
    if (this.#site.revealSignature().visible)
      throw new Error("submission:answer-already-visible");
    const attemptEpoch = ++this.#attemptEpoch;
    const submissionToken = crypto.randomUUID();
    const context: SubmissionContext = {
      questionId: identity.questionId,
      navigationEpoch: this.#navigationEpoch,
      attemptEpoch,
      submissionToken,
    };
    this.#activeToken = submissionToken;

    try {
      this.#site.writeAnswer(draft);
      this.assertCurrent(context);
      let revealProof = await this.#site.scoreAndWait(
        identity,
        submissionToken,
      );
      this.assertCurrent(context);
      if (revealProof) {
        this.assertRevealProof(revealProof, identity, context, "score");
      } else {
        if (this.#site.revealSignature().visible)
          throw new Error("submission:invalid-reveal-proof");
        revealProof = await this.#site.revealAnswerAndWait(
          identity,
          submissionToken,
        );
        this.assertRevealProof(revealProof, identity, context, "answer");
      }
      this.assertCurrent(context);
      const correctAnswer = this.#site.readRevealedAnswer(revealProof);
      const diff = diffWords(correctAnswer, draft);
      return {
        context,
        review: { accuracy: diff.accuracy, errors: diff.errors },
      };
    } finally {
      if (this.#activeToken === submissionToken) this.#activeToken = null;
    }
  }

  async redo(): Promise<void> {
    if (this.#activeToken !== null)
      throw new Error("submission:already-active");
    if (!this.#site.capabilities().redo) throw new Error("redo:unsupported");
    const identity = this.#site.readIdentity();
    this.#site.click("redo");
    await waitUntil(() => {
      const current = this.#site.readIdentity();
      return (
        current.questionId === identity.questionId &&
        this.#site.input().value === "" &&
        !this.#site.revealSignature().visible &&
        !this.#site.isScoreComplete()
      );
    }, 5_000);
    this.#attemptEpoch += 1;
  }

  private assertCurrent(context: SubmissionContext): void {
    const current = this.#site.readIdentity();
    if (
      current.questionId !== context.questionId ||
      this.#navigationEpoch !== context.navigationEpoch ||
      this.#attemptEpoch !== context.attemptEpoch ||
      this.#activeToken !== context.submissionToken
    ) {
      throw new Error("submission:stale-context");
    }
  }

  private assertRevealProof(
    proof: RevealedAnswerProof,
    identity: QuestionIdentity,
    context: SubmissionContext,
    source: RevealedAnswerProof["source"],
  ): void {
    if (
      proof.predictionEdition !== identity.predictionEdition ||
      proof.questionId !== identity.questionId ||
      proof.position !== identity.position ||
      proof.total !== identity.total ||
      proof.operationToken !== context.submissionToken ||
      proof.source !== source
    ) {
      throw new Error("submission:invalid-reveal-proof");
    }
  }
}

async function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("operation:timeout");
}
