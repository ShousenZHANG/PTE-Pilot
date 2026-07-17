import { describe, expect, test } from "vitest";
import { queuePosition, stepQueue } from "./review-queue";

const queue = ["131001", "131005", "131009"];

describe("review queue stepping", () => {
  test("moves forward through the queue and finishes past the end", () => {
    expect(stepQueue(queue, "131001", "next")).toEqual({
      kind: "go",
      questionId: "131005",
      position: 2,
    });
    expect(stepQueue(queue, "131009", "next")).toEqual({ kind: "finished" });
  });

  test("moves backward and holds at the start", () => {
    expect(stepQueue(queue, "131005", "previous")).toEqual({
      kind: "go",
      questionId: "131001",
      position: 1,
    });
    expect(stepQueue(queue, "131001", "previous")).toEqual({ kind: "hold" });
  });

  test("restarts from the beginning when the current question left the queue", () => {
    expect(stepQueue(queue, "999999", "next")).toEqual({
      kind: "go",
      questionId: "131001",
      position: 1,
    });
  });

  test("an empty queue finishes immediately", () => {
    expect(stepQueue([], "131001", "next")).toEqual({ kind: "finished" });
  });

  test("reports the 1-based position of the current question", () => {
    expect(queuePosition(queue, "131005")).toBe(2);
    expect(queuePosition(queue, "999999")).toBeNull();
  });
});
