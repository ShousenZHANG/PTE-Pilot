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

  click(): void {}

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

  it("accepts a same-question resubmission whose answer fingerprint cannot change", async () => {
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("getComputedStyle", () => ({
      visibility: "visible",
      display: "block",
      opacity: "1",
    }));

    const answer = new FakeElement("Stale.", true);
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
      adapter as unknown as { readIdentity: () => QuestionIdentity }
    ).readIdentity = () => identity;
    (adapter as unknown as { click: (name: string) => void }).click = () => {
      answer.hidden = false;
      translation.hidden = false;
      FakeMutationObserver.active?.signal();
    };

    const firstProof = adapter
      .scoreAndWait(identity, "operation-1", 200)
      .then((proof) => proof);
    await new Promise((resolve) => setTimeout(resolve, 0));
    answer.textContent = "Same answer sentence.";
    FakeMutationObserver.active?.signal();
    const proof1 = await firstProof;
    expect(proof1 && adapter.readRevealedContent(proof1).answer).toBe(
      "Same answer sentence.",
    );

    answer.hidden = true;
    translation.hidden = true;

    const proof2 = await adapter.scoreAndWait(identity, "operation-2", 200);
    expect(proof2).toMatchObject({
      questionId: "131003",
      operationToken: "operation-2",
      source: "score",
    });
    expect(proof2 && adapter.readRevealedContent(proof2).answer).toBe(
      "Same answer sentence.",
    );
  });

  it("dismisses the Firefly score dialog through its close control", async () => {
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("getComputedStyle", () => ({
      visibility: "visible",
      display: "block",
      opacity: "1",
    }));

    const wrapper = new FakeElement("", false);
    wrapper.hidden = false;
    const close = new FakeElement("×", false);
    let closed = false;
    close.click = () => {
      wrapper.hidden = true;
      closed = true;
    };
    wrapper.querySelector = (selector: string) =>
      selector.includes("headerbtn") ? close : null;
    const document = {
      documentElement: {},
      querySelectorAll: (selector: string) =>
        selector === ".el-dialog__wrapper.ai-score" ? [wrapper] : [],
    } as unknown as Document;

    const adapter = new FireflyDomAdapter(document);
    await expect(adapter.dismissRevealDialog(300)).resolves.toBe(true);
    expect(closed).toBe(true);
  });

  it("reports an unclosable score dialog instead of pretending it is gone", async () => {
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("getComputedStyle", () => ({
      visibility: "visible",
      display: "block",
      opacity: "1",
    }));

    const wrapper = new FakeElement("", false);
    wrapper.hidden = false;
    const document = {
      documentElement: {},
      querySelectorAll: (selector: string) =>
        selector === ".el-dialog__wrapper.ai-score" ? [wrapper] : [],
    } as unknown as Document;

    const adapter = new FireflyDomAdapter(document);
    await expect(adapter.dismissRevealDialog(200)).resolves.toBe(false);
  });
});
