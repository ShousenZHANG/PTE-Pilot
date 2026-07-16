import { describe, expect, it } from "vitest";
import { ownedQuestionId } from "./dom-adapter";

type ElementStub = {
  dataset: { questionId?: string; exerciseId?: string };
  parentElement: ElementStub | null;
};

function stub(
  dataset: ElementStub["dataset"] = {},
  parentElement: ElementStub | null = null,
): ElementStub {
  return { dataset, parentElement };
}

describe("revealed answer ownership", () => {
  it("accepts only an explicit owning answer node or ancestor", () => {
    const owner = stub({ questionId: "131020" });
    const answer = stub({}, owner);

    expect(ownedQuestionId(answer as unknown as HTMLElement)).toBe("131020");
  });

  it("does not launder a sibling question marker into answer ownership", () => {
    const sharedContainer = stub();
    stub({ questionId: "131020" }, sharedContainer);
    const staleAnswer = stub({}, sharedContainer);

    expect(ownedQuestionId(staleAnswer as unknown as HTMLElement)).toBeNull();
  });

  it("keeps the nearest stale ownership so callers can reject it", () => {
    const currentOuter = stub({ questionId: "131020" });
    const staleOwner = stub({ questionId: "131019" }, currentOuter);
    const staleAnswer = stub({}, staleOwner);

    expect(ownedQuestionId(staleAnswer as unknown as HTMLElement)).toBe(
      "131019",
    );
  });
});
