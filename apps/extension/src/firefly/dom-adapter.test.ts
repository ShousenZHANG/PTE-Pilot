import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FireflyDomAdapter,
  isSequentialQuestionPositionList,
  isVerifiedQuestionSetEdition,
  PredictionEditionOverrideState,
  verifiedPredictionEdition,
} from "./dom-adapter";

class FakeElement {
  hidden = false;
  parentElement: FakeElement | null = null;
  disabled = false;
  clicked = 0;
  readonly #queries = new Map<string, FakeElement[]>();
  readonly #attributes = new Map<string, string>();

  constructor(
    readonly className: string,
    readonly width = 0,
    readonly height = 0,
  ) {}

  setQuery(selector: string, elements: FakeElement[]): void {
    this.#queries.set(selector, elements);
    for (const element of elements) element.parentElement ??= this;
  }

  setAttribute(name: string, value: string): void {
    this.#attributes.set(name, value);
  }

  querySelectorAll(selector: string): FakeElement[] {
    return this.#queries.get(selector) ?? [];
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }

  getBoundingClientRect(): DOMRect {
    return {
      width: this.width,
      height: this.height,
    } as DOMRect;
  }

  click(): void {
    this.clicked += 1;
  }
}

function installFakeDom(): void {
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("HTMLInputElement", FakeElement);
  vi.stubGlobal("getComputedStyle", () => ({
    visibility: "visible",
    display: "block",
    opacity: "1",
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FireflyDomAdapter prediction edition probe guard", () => {
  it("returns the bootstrap diagnostic while the override is provisional", () => {
    const loggedOutDocument = {
      location: { pathname: "/login" },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(loggedOutDocument);
    adapter.beginProvisionalPredictionEdition();

    expect(adapter.probe()).toEqual({
      ok: false,
      diagnostic: {
        code: "INVALID_QUESTION",
        detail: "question:prediction-edition-unverified",
      },
    });
  });

  it("exposes session-only prediction identity activation", () => {
    const adapter = new FireflyDomAdapter({} as Document);
    const beginSession = (
      adapter as unknown as { beginSessionPredictionEdition?: () => string }
    ).beginSessionPredictionEdition;

    expect(beginSession).toBeTypeOf("function");
    expect(beginSession?.call(adapter)).toBeTypeOf("string");
  });

  it("includes list items when collecting visible identity evidence", () => {
    const selectors: string[] = [];
    const document = {
      querySelectorAll(selector: string) {
        selectors.push(selector);
        return [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);

    const visibleElements = (
      adapter as unknown as { visibleElements(): HTMLElement[] }
    ).visibleElements();

    expect(visibleElements).toEqual([]);
    expect(
      selectors[0]
        ?.split(",")
        .map((selector) => selector.trim())
        .includes("li"),
    ).toBe(true);
  });
});

describe("FireflyDomAdapter APlayer controls", () => {
  it("advertises Play when the active question uses hidden APlayer controls", () => {
    installFakeDom();
    const player = new FakeElement("aplayer");
    const progress = new FakeElement("aplayer-bar-wrap", 120, 8);
    const hiddenPlay = new FakeElement("aplayer-button aplayer-play");
    const input = new FakeElement("answer-input", 300, 80);
    const controls = [
      ["Score", "score"],
      ["Answer", "answer"],
      ["Previous", "previous"],
      ["Next", "next"],
      ["Redo", "redo"],
    ].map(([label, className]) => {
      const control = new FakeElement(className ?? "", 80, 28);
      control.setAttribute("aria-label", label ?? "");
      return control;
    });
    player.setQuery(".aplayer-bar-wrap", [progress]);
    player.setQuery(".aplayer-button.aplayer-play", [hiddenPlay]);
    const document = {
      querySelectorAll(selector: string) {
        if (selector === ".aplayer") return [player];
        if (selector === "textarea") return [input];
        if (
          selector ===
          "button, [role='button'], input[type='button'], input[type='submit']"
        )
          return controls;
        return [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);

    expect(adapter.capabilities().play).toBe(true);
  });

  it("drives the hidden APlayer play control, not the display-only Play div", () => {
    installFakeDom();
    const player = new FakeElement("aplayer");
    const progress = new FakeElement("aplayer-bar-wrap", 120, 8);
    const hiddenPlay = new FakeElement("aplayer-button aplayer-play");
    const displayOnly = new FakeElement("audio-pause-btn", 80, 28);
    player.setQuery(".aplayer-bar-wrap", [progress]);
    player.setQuery(".aplayer-button.aplayer-play", [hiddenPlay]);
    const document = {
      querySelectorAll(selector: string) {
        if (selector === ".aplayer") return [player];
        if (selector === ".audio-pause-btn") return [displayOnly];
        return [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);
    const playAudio = (adapter as unknown as { playAudio?: () => void })
      .playAudio;

    expect(playAudio).toBeTypeOf("function");
    playAudio?.call(adapter);
    expect(hiddenPlay.clicked).toBe(1);
    expect(displayOnly.clicked).toBe(0);
  });

  it("drives the hidden APlayer pause control", () => {
    installFakeDom();
    const player = new FakeElement("aplayer");
    const progress = new FakeElement("aplayer-bar-wrap", 120, 8);
    const hiddenPause = new FakeElement("aplayer-button aplayer-pause");
    player.setQuery(".aplayer-bar-wrap", [progress]);
    player.setQuery(".aplayer-button.aplayer-pause", [hiddenPause]);
    const document = {
      querySelectorAll(selector: string) {
        return selector === ".aplayer" ? [player] : [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);
    const pauseAudio = (adapter as unknown as { pauseAudio?: () => void })
      .pauseAudio;

    expect(pauseAudio).toBeTypeOf("function");
    pauseAudio?.call(adapter);
    expect(hiddenPause.clicked).toBe(1);
  });

  it("restarts the one-item APlayer and resumes it when paused", () => {
    installFakeDom();
    const player = new FakeElement("aplayer");
    const progress = new FakeElement("aplayer-bar-wrap", 120, 8);
    const listItem = new FakeElement("aplayer-list-item");
    const back = new FakeElement("aplayer-icon aplayer-icon-back");
    const hiddenPlay = new FakeElement("aplayer-button aplayer-play");
    player.setQuery(".aplayer-bar-wrap", [progress]);
    player.setQuery(".aplayer-list li", [listItem]);
    player.setQuery(".aplayer-icon-back", [back]);
    player.setQuery(".aplayer-button.aplayer-play", [hiddenPlay]);
    const document = {
      querySelectorAll(selector: string) {
        return selector === ".aplayer" ? [player] : [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);
    const restartAudio = (adapter as unknown as { restartAudio?: () => void })
      .restartAudio;

    expect(restartAudio).toBeTypeOf("function");
    restartAudio?.call(adapter);
    expect(back.clicked).toBe(1);
    expect(hiddenPlay.clicked).toBe(1);
  });

  it("refuses APlayer replay when playlist ownership is ambiguous", () => {
    installFakeDom();
    const player = new FakeElement("aplayer");
    const progress = new FakeElement("aplayer-bar-wrap", 120, 8);
    const back = new FakeElement("aplayer-icon aplayer-icon-back");
    player.setQuery(".aplayer-bar-wrap", [progress]);
    player.setQuery(".aplayer-list li", [
      new FakeElement("aplayer-list-item"),
      new FakeElement("aplayer-list-item"),
    ]);
    player.setQuery(".aplayer-icon-back", [back]);
    const document = {
      querySelectorAll(selector: string) {
        return selector === ".aplayer" ? [player] : [];
      },
    } as unknown as Document;
    const adapter = new FireflyDomAdapter(document);
    const restartAudio = (adapter as unknown as { restartAudio?: () => void })
      .restartAudio;

    expect(() => restartAudio?.call(adapter)).toThrow(
      "audio:playlist:ambiguous",
    );
    expect(back.clicked).toBe(0);
  });
});

describe("verifiedPredictionEdition", () => {
  it("rejects a generic weekly heading and client calendar fallback", () => {
    for (const heading of [
      "Weekly prediction",
      "Weekly prediction - 100 questions",
      "Weekly prediction W29",
      "周预测 100题",
    ]) {
      expect(() =>
        verifiedPredictionEdition({
          explicitValues: [],
          headingTexts: [heading],
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toThrow("question:prediction-edition-unverified");
    }
  });

  it("accepts only headings with a full site-owned year and week/date", () => {
    for (const heading of [
      "Weekly prediction 2026 W29",
      "周预测 2026年第29周",
      "Weekly prediction 2026-07-16",
    ]) {
      expect(
        verifiedPredictionEdition({
          explicitValues: [],
          headingTexts: [heading],
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toBe(heading);
    }
  });

  it("rejects conflicting visible edition evidence", () => {
    for (const evidence of [
      {
        explicitValues: ["weekly-2026-W29", "weekly-2026-W30"],
        headingTexts: [] as string[],
      },
      {
        explicitValues: [] as string[],
        headingTexts: [
          "Weekly prediction 2026 W29",
          "Weekly prediction 2026 W30",
        ],
      },
      {
        explicitValues: ["weekly-2026-W29"],
        headingTexts: ["Weekly prediction 2026 W30"],
      },
    ]) {
      expect(() =>
        verifiedPredictionEdition({
          ...evidence,
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toThrow("question:prediction-edition-ambiguous");
    }
    expect(
      verifiedPredictionEdition({
        explicitValues: ["weekly-2026-W29", "weekly-2026-W29"],
        headingTexts: ["Weekly prediction 2026 W29"],
        optionQuestionIds: [],
        expectedTotal: 192,
      }),
    ).toBe("weekly-2026-W29");
  });

  it("derives a stable namespace from a complete ordered question set", () => {
    const first = verifiedPredictionEdition({
      explicitValues: [],
      headingTexts: ["Weekly prediction"],
      optionQuestionIds: ["131001", "131002", "131003"],
      expectedTotal: 3,
    });
    const second = verifiedPredictionEdition({
      explicitValues: [],
      headingTexts: ["Weekly prediction"],
      optionQuestionIds: ["131001", "131004", "131003"],
      expectedTotal: 3,
    });

    expect(first).toMatch(/^yc-set-3-[0-9a-f]{16}$/u);
    expect(second).not.toBe(first);
  });

  it("accepts a site-owned explicit edition and rejects incomplete options", () => {
    expect(
      verifiedPredictionEdition({
        explicitValues: ["weekly-2026-W29"],
        headingTexts: [],
        optionQuestionIds: [],
        expectedTotal: 192,
      }),
    ).toBe("weekly-2026-W29");
    expect(() =>
      verifiedPredictionEdition({
        explicitValues: [],
        headingTexts: ["周预测"],
        optionQuestionIds: ["131001"],
        expectedTotal: 192,
      }),
    ).toThrow("question:prediction-edition-unverified");
  });
});

describe("Element UI question picker evidence", () => {
  it("accepts only a complete, ordered 1..N position list", () => {
    expect(isSequentialQuestionPositionList(["1", " 2 ", "3"])).toBe(true);
    expect(isSequentialQuestionPositionList(["1", "3"])).toBe(false);
    expect(isSequentialQuestionPositionList(["1", "2", "2"])).toBe(false);
    expect(isSequentialQuestionPositionList(["1", "2", "3"], 2)).toBe(false);
    expect(isSequentialQuestionPositionList([])).toBe(false);
  });

  it("accepts only a full-fingerprint edition for the matching total", () => {
    expect(
      isVerifiedQuestionSetEdition("yc-set-193-0123456789abcdef", 193),
    ).toBe(true);
    expect(
      isVerifiedQuestionSetEdition("yc-set-192-0123456789abcdef", 193),
    ).toBe(false);
    expect(isVerifiedQuestionSetEdition("weekly-2026-W29", 193)).toBe(false);
  });
});

describe("PredictionEditionOverrideState", () => {
  it("blocks probing with the bootstrap diagnostic while provisional", () => {
    const state = new PredictionEditionOverrideState(() => "bootstrap-1");

    expect(state.begin()).toBe("bootstrap-1");
    expect(state.probeDiagnostic()).toEqual({
      code: "INVALID_QUESTION",
      detail: "question:prediction-edition-unverified",
    });
    expect(state.resolve(193)).toBe("provisional:bootstrap-1");
  });

  it("keeps a session identity readable without blocking the probe", () => {
    const state = new PredictionEditionOverrideState(() => "session-1");
    const beginSession = (state as unknown as { beginSession?: () => string })
      .beginSession;

    expect(beginSession).toBeTypeOf("function");
    expect(beginSession?.call(state)).toBe("session-1");
    expect(state.probeDiagnostic()).toBeNull();
    expect(state.resolve(193)).toBe("session:session-1");
  });

  it("invalidates a session identity when the question total changes", () => {
    const state = new PredictionEditionOverrideState(() => "session-1");
    const beginSession = (state as unknown as { beginSession?: () => string })
      .beginSession;

    expect(beginSession).toBeTypeOf("function");
    beginSession?.call(state);
    expect(state.resolve(193)).toBe("session:session-1");
    expect(state.resolve(192)).toBeNull();
    expect(state.resolve(193)).toBeNull();
  });

  it("does not let a stale token clear a newer bootstrap", () => {
    const tokens = ["bootstrap-1", "bootstrap-2"];
    const state = new PredictionEditionOverrideState(() => {
      const token = tokens.shift();
      if (!token) throw new Error("test token exhausted");
      return token;
    });
    const staleToken = state.begin();
    const currentToken = state.begin();

    expect(state.clear(staleToken)).toBe(false);
    expect(state.resolve(193)).toBe("provisional:bootstrap-2");
    expect(state.clear(currentToken)).toBe(true);
    expect(state.probeDiagnostic()).toBeNull();
  });

  it("keeps a verified override probeable and immune to provisional invalidation", () => {
    const state = new PredictionEditionOverrideState(() => "bootstrap-1");
    const token = state.begin();

    state.adopt("yc-set-193-0123456789abcdef", 193, token);

    expect(state.probeDiagnostic()).toBeNull();
    expect(state.resolve(193)).toBe("yc-set-193-0123456789abcdef");
    expect(state.invalidateProvisional(token)).toBe(false);
    expect(state.resolve(193)).toBe("yc-set-193-0123456789abcdef");
  });

  it("drops verified evidence when the site total changes", () => {
    const state = new PredictionEditionOverrideState(() => "bootstrap-1");
    const token = state.begin();
    state.adopt("yc-set-193-0123456789abcdef", 193, token);

    expect(state.resolve(192)).toBeNull();
    expect(state.resolve(192)).toBeNull();
  });

  it("invalidates only the matching verified edition", () => {
    const state = new PredictionEditionOverrideState(() => "bootstrap-1");
    const token = state.begin();
    state.adopt("yc-set-193-0123456789abcdef", 193, token);

    expect(state.invalidateVerified("yc-set-193-deadbeefdeadbeef")).toBe(false);
    expect(state.resolve(193)).toBe("yc-set-193-0123456789abcdef");
    expect(state.invalidateVerified("yc-set-193-0123456789abcdef")).toBe(true);
    expect(state.resolve(193)).toBeNull();
  });
});
