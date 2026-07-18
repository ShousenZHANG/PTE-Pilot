// @vitest-environment happy-dom
/*
 * Calibration suite against a sanitized snapshot of the real fireflyau.com
 * WFD exercise page (captured 2026-07-18, WFD 1/194, question #131001).
 * Every assertion here documents a contract the live site actually holds;
 * if the site changes, this file is the first thing to break.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { predictionEditionStartupMode } from "../app/practice-controller";
import { FireflyDomAdapter } from "./dom-adapter";

const snapshotHtml = readFileSync(
  join(__dirname, "../../../../tests/fixtures/firefly-wfd-snapshot.html"),
  "utf8",
);

function loadSnapshot(): FireflyDomAdapter {
  document.documentElement.innerHTML = snapshotHtml
    .replace(/^<!DOCTYPE html>\s*<html[^>]*>/u, "")
    .replace(/<\/html>\s*$/u, "");
  // happy-dom performs no layout, so every rect is 0x0. Visibility styling
  // (display:none chains) still applies; give elements a nonzero box so the
  // adapter's final rect check matches a rendered browser.
  HTMLElement.prototype.getBoundingClientRect = (): DOMRect =>
    ({
      width: 100,
      height: 20,
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  // A rendered browser resolves opacity to "1" by default; happy-dom leaves
  // it "", which Number() would read as 0 (invisible). Normalize that one
  // property so the adapter sees browser-shaped computed styles.
  const realGetComputedStyle = window.getComputedStyle.bind(window);
  Object.defineProperty(globalThis, "getComputedStyle", {
    configurable: true,
    writable: true,
    value: (element: Element) => {
      const style = realGetComputedStyle(element);
      return new Proxy(style, {
        get(target, property) {
          const raw = Reflect.get(target, property);
          const value = typeof raw === "function" ? raw.bind(target) : raw;
          return property === "opacity" && value === "" ? "1" : value;
        },
      });
    },
  });
  return new FireflyDomAdapter(document);
}

beforeEach(() => {
  loadSnapshot();
});

describe("real Firefly page: identity", () => {
  it("reads position 1/194 and question id 131001 without attributes", () => {
    const adapter = new FireflyDomAdapter(document);
    expect(adapter.readBareIdentity()).toEqual({
      questionId: "131001",
      position: 1,
      total: 194,
    });
  });

  it("keeps the fast question-id path null (page exposes no id attributes)", () => {
    const adapter = new FireflyDomAdapter(document);
    expect(adapter.readQuestionIdFast()).toBeNull();
  });

  it("fails closed to session mode on first open (no verifiable edition)", () => {
    const adapter = new FireflyDomAdapter(document);
    const probe = adapter.probe();
    expect(probe.ok).toBe(false);
    if (!probe.ok) {
      expect(probe.diagnostic).toEqual({
        code: "INVALID_QUESTION",
        detail: "question:prediction-edition-unverified",
      });
      expect(predictionEditionStartupMode(probe)).toBe("session");
    }
  });

  it("probes ok after a session edition is activated", () => {
    const adapter = new FireflyDomAdapter(document);
    adapter.beginSessionPredictionEdition();
    const probe = adapter.probe();
    expect(probe.ok).toBe(true);
    if (probe.ok) {
      expect(probe.identity.questionId).toBe("131001");
      expect(probe.identity.predictionEdition).toMatch(/^session:/u);
    }
  });
});

describe("real Firefly page: capabilities", () => {
  it("finds every practice control exactly once", () => {
    const adapter = new FireflyDomAdapter(document);
    adapter.beginSessionPredictionEdition();
    expect(adapter.capabilities()).toEqual({
      input: true,
      score: true,
      answer: true,
      previous: true,
      next: true,
      redo: true,
      play: true,
      select: true,
    });
  });

  it("resolves the answer textarea by its exact placeholder", () => {
    const adapter = new FireflyDomAdapter(document);
    const input = adapter.input();
    expect(input.placeholder).toBe("请输入内容");
  });

  it("treats the hidden score dialogs as absent", async () => {
    const adapter = new FireflyDomAdapter(document);
    expect(adapter.revealSignature().visible).toBe(false);
    await expect(adapter.dismissRevealDialog(50)).resolves.toBe(true);
  });
});

describe("real Firefly page: direct question jump", () => {
  it("clicks the pre-rendered option with a full mouse sequence", async () => {
    const adapter = new FireflyDomAdapter(document);
    adapter.beginSessionPredictionEdition();
    const item = Array.from(
      document.querySelectorAll(".el-select-dropdown__item"),
    ).find((li) => li.textContent?.trim() === "5");
    expect(item).toBeDefined();
    const events: string[] = [];
    for (const type of ["mousedown", "mouseup", "click"]) {
      item?.addEventListener(type, () => events.push(type));
    }
    await adapter.selectQuestion(5);
    expect(events).toEqual(["mousedown", "mouseup", "click"]);
  });

  it("rejects a position outside the option list", async () => {
    const adapter = new FireflyDomAdapter(document);
    adapter.beginSessionPredictionEdition();
    await expect(adapter.selectQuestion(195)).rejects.toThrow(
      "select:target-missing",
    );
  });

  it("does not confuse the voice-switcher menu with question options", async () => {
    const adapter = new FireflyDomAdapter(document);
    adapter.beginSessionPredictionEdition();
    // The audio-variant dropdown shares Element-UI classes; a jump to
    // position 1 must land on the numeric question item, never on 随机音频.
    const voiceItem = Array.from(
      document.querySelectorAll(".el-dropdown-menu__item"),
    ).find((li) => li.textContent?.includes("随机音频"));
    let voiceClicked = false;
    voiceItem?.addEventListener("click", () => {
      voiceClicked = true;
    });
    await adapter.selectQuestion(1);
    expect(voiceClicked).toBe(false);
  });
});
