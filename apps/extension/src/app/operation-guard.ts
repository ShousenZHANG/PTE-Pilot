import type { PracticePhase, QuestionIdentity } from "../domain/types";

/*
 * Every async controller operation races three invalidation sources: a new
 * initialization (generation), a question switch (navigation epoch), and
 * the site drifting away from the question the operation was started on.
 * An OperationTicket snapshots that context once, at the start of the
 * operation, and answers "is this still the same operation?" after every
 * await — one call site instead of a hand-written predicate per method.
 */
export interface OperationGuardHost {
  disposed(): boolean;
  generation(): number;
  epoch(): number;
  phase(): PracticePhase;
  stateIdentity(): QuestionIdentity | null;
  /** Reads the live site identity; null when the DOM is unreadable. */
  siteIdentity(): QuestionIdentity | null;
}

export interface TicketCheck {
  /** Operation is only current while the controller sits in this phase. */
  phase?: PracticePhase;
  /**
   * Expected navigation epoch. Defaults to the epoch captured at ticket
   * creation; pass a navigation result's epoch after adopting it, or "any"
   * for predicates that deliberately ignore question-switch races.
   */
  epoch?: number | "any";
  /**
   * Site alignment: true pins the live DOM to the captured identity, an
   * explicit identity pins it to a navigation target instead.
   */
  site?: boolean | QuestionIdentity;
  /**
   * Generation pinning is on by default. Operations that survive a
   * re-initialization of the same question (submit, mark) opt out.
   */
  generation?: boolean;
}

export class OperationTicket {
  readonly #host: OperationGuardHost;
  readonly #identity: QuestionIdentity;
  readonly #generation: number;
  readonly #epoch: number;

  constructor(host: OperationGuardHost, identity: QuestionIdentity) {
    this.#host = host;
    this.#identity = identity;
    this.#generation = host.generation();
    this.#epoch = host.epoch();
  }

  get identity(): QuestionIdentity {
    return this.#identity;
  }

  valid(check: TicketCheck = {}): boolean {
    const host = this.#host;
    if (host.disposed()) return false;
    if ((check.generation ?? true) && host.generation() !== this.#generation)
      return false;
    const expectedEpoch = check.epoch ?? this.#epoch;
    if (expectedEpoch !== "any" && host.epoch() !== expectedEpoch)
      return false;
    if (!sameQuestionIdentity(host.stateIdentity(), this.#identity))
      return false;
    if (check.phase !== undefined && host.phase() !== check.phase)
      return false;
    if (check.site) {
      const expected = check.site === true ? this.#identity : check.site;
      const site = host.siteIdentity();
      if (!site || !sameQuestionIdentity(site, expected)) return false;
    }
    return true;
  }
}

export function sameQuestionIdentity(
  left: QuestionIdentity | null,
  right: QuestionIdentity,
): boolean {
  return (
    left?.predictionEdition === right.predictionEdition &&
    left.questionId === right.questionId &&
    left.position === right.position &&
    left.total === right.total
  );
}
