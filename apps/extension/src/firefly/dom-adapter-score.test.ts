import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import { FireflyDomAdapter } from "./dom-adapter";

class FakeElement {
  hidden = true;
  disabled = false;
  parentElement: FakeElement | null = null;
  dataset: Record<string, string> = {};

  constructor(
    public textContent: string,
    readonly containsAnswerWords: boolean,
  ) {}

  getAttribute(): string | null {
    return null;
  }

  getBoundingClientRect(): DOMRect {
    return { width: 120, height: 20 } as DOMRect;
  }

  querySelector(selector: string): FakeElement | null {
    return selector.includes(".oneword") && this.containsAnswerWords
      ? new FakeElement("word", false)
      : null;
  }
}

class FakeMutationObserver {
  static active: FakeMutationObserver | null = null;

  constructor(readonly callback: () => void) {
    FakeMutationObserver.active = this;
  }

  observe(): void {}

  disconnect(): void {
    if (FakeMutationObserver.active === this)
      FakeMutationObserver.active = null;
  }

  signal(): void {
    this.callback();
  }
}

afterEach(() => {
  FakeMutationObserver.active = null;
  vi.unstubAllGlobals();
});

describe("Firefly AI score reveal", () => {
  it("waits for the hidden stale answer to change before binding it to this question", async () => {
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("getComputedStyle", () => ({
      visibility: "visible",
      display: "block",
      opacity: "1",
    }));

    const answer = new FakeElement("The previous question answer.", true);
    const translation = new FakeElement("A translated sentence.", false);
    const document = {
      documentElement: {},
      querySelectorAll(selector: string) {
        if (selector.includes(".ai-score")) return [answer, translation];
        return [];
      },
    } as unknown as Document;
    const identity: QuestionIdentity = {
      predictionEdition: "session:test",
      questionId: "131003",
      position: 3,
      total: 193,
      tags: [],
    };
    const adapter = new FireflyDomAdapter(document);
    (
      adapter as unknown as {
        readIdentity: () => QuestionIdentity;
        click: (name: string) => void;
      }
    ).readIdentity = () => identity;
    (
      adapter as unknown as {
        click: (name: string) => void;
      }
    ).click = () => {
      answer.hidden = false;
      translation.hidden = false;
      FakeMutationObserver.active?.signal();
    };

    let settled = false;
    const pendingProof = adapter
      .scoreAndWait(identity, "operation-1", 100)
      .then((proof) => {
        settled = true;
        return proof;
      });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).toBe(false);

    answer.textContent = "A useful test.";
    FakeMutationObserver.active?.signal();
    const proof = await pendingProof;

    expect(proof).toMatchObject({
      questionId: "131003",
      operationToken: "operation-1",
      source: "score",
    });
    expect(proof && adapter.readRevealedAnswer(proof)).toBe("A useful test.");
  });
});
