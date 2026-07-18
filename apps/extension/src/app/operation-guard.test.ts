import { describe, expect, it } from "vitest";
import type { PracticePhase, QuestionIdentity } from "../domain/types";
import { type OperationGuardHost, OperationTicket } from "./operation-guard";

function identity(overrides: Partial<QuestionIdentity> = {}): QuestionIdentity {
  return {
    predictionEdition: "周预测 2026-07-14",
    questionId: "131001",
    position: 1,
    total: 3,
    tags: [],
    ...overrides,
  };
}

class FakeHost implements OperationGuardHost {
  disposedValue = false;
  generationValue = 1;
  epochValue = 4;
  phaseValue: PracticePhase = "ANSWERING";
  stateIdentityValue: QuestionIdentity | null = identity();
  siteIdentityValue: QuestionIdentity | null = identity();

  disposed(): boolean {
    return this.disposedValue;
  }
  generation(): number {
    return this.generationValue;
  }
  epoch(): number {
    return this.epochValue;
  }
  phase(): PracticePhase {
    return this.phaseValue;
  }
  stateIdentity(): QuestionIdentity | null {
    return this.stateIdentityValue;
  }
  siteIdentity(): QuestionIdentity | null {
    return this.siteIdentityValue;
  }
}

describe("OperationTicket", () => {
  it("stays valid while nothing changed", () => {
    const host = new FakeHost();
    const ticket = new OperationTicket(host, identity());
    expect(ticket.valid()).toBe(true);
    expect(ticket.valid({ site: true })).toBe(true);
    expect(ticket.valid({ phase: "ANSWERING" })).toBe(true);
  });

  it("invalidates on dispose, generation bump, or epoch bump", () => {
    const host = new FakeHost();
    const ticket = new OperationTicket(host, identity());

    host.disposedValue = true;
    expect(ticket.valid()).toBe(false);
    host.disposedValue = false;

    host.generationValue = 2;
    expect(ticket.valid()).toBe(false);
    expect(ticket.valid({ generation: false })).toBe(true);
    host.generationValue = 1;

    host.epochValue = 5;
    expect(ticket.valid()).toBe(false);
    expect(ticket.valid({ epoch: "any" })).toBe(true);
    expect(ticket.valid({ epoch: 5 })).toBe(true);
  });

  it("invalidates when the controller state left the captured question", () => {
    const host = new FakeHost();
    const ticket = new OperationTicket(host, identity());
    host.stateIdentityValue = identity({ questionId: "131002", position: 2 });
    expect(ticket.valid()).toBe(false);
    host.stateIdentityValue = null;
    expect(ticket.valid()).toBe(false);
  });

  it("pins the phase only when asked", () => {
    const host = new FakeHost();
    const ticket = new OperationTicket(host, identity());
    host.phaseValue = "NAVIGATING";
    expect(ticket.valid()).toBe(true);
    expect(ticket.valid({ phase: "NAVIGATING" })).toBe(true);
    expect(ticket.valid({ phase: "ANSWERING" })).toBe(false);
  });

  it("pins the site to the captured or an explicit identity", () => {
    const host = new FakeHost();
    const ticket = new OperationTicket(host, identity());

    host.siteIdentityValue = identity({ questionId: "131002", position: 2 });
    expect(ticket.valid()).toBe(true);
    expect(ticket.valid({ site: true })).toBe(false);

    // A navigation adopts a new expected site identity mid-operation.
    host.stateIdentityValue = identity();
    expect(
      ticket.valid({
        site: identity({ questionId: "131002", position: 2 }),
      }),
    ).toBe(true);

    host.siteIdentityValue = null;
    expect(ticket.valid({ site: true })).toBe(false);
    expect(ticket.valid()).toBe(true);
  });
});
