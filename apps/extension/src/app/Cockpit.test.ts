import { describe, expect, test } from "vitest";
import { CommandSessionGate } from "./Cockpit";

describe("CommandSessionGate", () => {
  test("stale completion cannot clear a reopened session's busy state", () => {
    const gate = new CommandSessionGate();
    const staleSession = gate.open();

    expect(gate.start(staleSession)).toBe(true);
    gate.invalidate();

    const currentSession = gate.open();
    expect(gate.start(currentSession)).toBe(true);
    expect(gate.finish(staleSession)).toBe(false);
    expect(gate.busy).toBe(true);
    expect(gate.isCurrent(currentSession)).toBe(true);
  });

  test("busy session rejects overlapping commands", () => {
    const gate = new CommandSessionGate();
    const session = gate.open();

    expect(gate.start(session)).toBe(true);
    expect(gate.start(session)).toBe(false);
    expect(gate.finish(session)).toBe(true);
    expect(gate.busy).toBe(false);
  });
});
