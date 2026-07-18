// @vitest-environment happy-dom
/*
 * Behavior guardrail for the whole practice loop: a scripted in-memory
 * Firefly page (FixtureSite) drives the real PracticeController, the real
 * DOM adapter/navigation/answer-gate stack, the real background message
 * handler, and real Dexie repositories over fake-indexeddb. Refactors of
 * the controller must keep every chain in this file green.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeMessageHandler } from "../background/runtime-handler";
import { createPtePilotDb, type PtePilotDb } from "../background/storage/db";
import { CockpitRepositories } from "../background/storage/repositories";
import { PracticeController } from "./practice-controller";

const EXTENSION_ID = "integration-extension";
const TRUSTED_URL = "https://www.fireflyau.com/ptehome/exercise?pageSource=yc";
// Versioned weekly-prediction heading: verifies the edition without a
// bootstrap, so persistence is active from the first probe.
const EDITION = "周预测 2026-07-14";

interface FixtureQuestion {
  questionId: string;
  answer: string;
  translation: string;
}

const QUESTIONS: FixtureQuestion[] = [
  {
    questionId: "131001",
    answer: "The committee should reconsider the original proposal",
    translation: "委员会应当重新考虑最初的提案",
  },
  {
    questionId: "131002",
    answer: "Students must submit their assignments before the deadline",
    translation: "学生必须在截止日期前提交作业",
  },
  {
    questionId: "131003",
    answer: "The library provides extensive resources for research",
    translation: "图书馆为研究提供丰富的资源",
  },
];

class FixtureSite {
  position = 1;
  readonly #positionLabel: HTMLElement;
  readonly #questionLabel: HTMLElement;
  readonly #textarea: HTMLTextAreaElement;
  readonly #dialog: HTMLElement;
  readonly #answerPre: HTMLElement;
  readonly #translation: HTMLElement;

  constructor(private readonly questions: FixtureQuestion[]) {
    document.body.innerHTML = `
      <main>
        <h2>${EDITION}</h2>
        <ul><li><i>WFD</i><span id="pos"></span></li></ul>
        <span id="qid"></span>
        <textarea placeholder="请输入内容"></textarea>
        <button id="redo"> 重做</button>
        <button id="reveal">答案</button>
        <div class="el-select select-page">
          <input type="text" readonly placeholder="选择题号">
          <ul>${questions
            .map(() => `<li class="el-select-dropdown__item"></li>`)
            .join("")}</ul>
        </div>
        <button id="prev">上一题</button>
        <button id="next">下一题</button>
        <button id="score">评分</button>
        <div class="el-dialog__wrapper ai-score" style="display: none;">
          <div role="dialog" aria-label="AI 评分">
            <button class="el-dialog__headerbtn"></button>
            <div class="el-dialog__body">
              <pre><span class="oneword"></span></pre>
              <h5>译文</h5>
              <p id="translation"></p>
            </div>
          </div>
        </div>
      </main>`;
    this.#positionLabel = this.query("#pos");
    this.#questionLabel = this.query("#qid");
    this.#textarea = this.query("textarea");
    this.#dialog = this.query(".el-dialog__wrapper.ai-score");
    this.#answerPre = this.query(".ai-score span.oneword");
    this.#translation = this.query("#translation");
    const items = Array.from(
      document.querySelectorAll(".el-select-dropdown__item"),
    );
    items.forEach((item, index) => {
      item.textContent = ` ${index + 1} `;
      item.addEventListener("click", () => this.jumpTo(index + 1));
    });
    this.query("#next").addEventListener("click", () =>
      this.jumpTo(this.position + 1),
    );
    this.query("#prev").addEventListener("click", () =>
      this.jumpTo(this.position - 1),
    );
    this.query("#score").addEventListener("click", () => this.showScore());
    this.query("#redo").addEventListener("click", () => {
      this.#textarea.value = "";
      this.hideScore();
    });
    this.query(".el-dialog__headerbtn").addEventListener("click", () =>
      this.hideScore(),
    );
    this.render();
  }

  get current(): FixtureQuestion {
    const question = this.questions[this.position - 1];
    if (!question) throw new Error("fixture: position out of range");
    return question;
  }

  jumpTo(position: number): void {
    if (position < 1 || position > this.questions.length) return;
    this.position = position;
    this.#textarea.value = "";
    this.hideScore();
    this.render();
  }

  private showScore(): void {
    this.#answerPre.textContent = this.current.answer;
    this.#translation.textContent = this.current.translation;
    this.#dialog.style.display = "";
  }

  private hideScore(): void {
    this.#dialog.style.display = "none";
  }

  private render(): void {
    this.#positionLabel.textContent = ` ${this.position}/${this.questions.length}`;
    this.#questionLabel.textContent = `#${this.current.questionId}`;
  }

  private query<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`fixture: missing ${selector}`);
    return element;
  }
}

function installBrowserRuntime(db: PtePilotDb): void {
  const handler = createRuntimeMessageHandler({
    extensionId: EXTENSION_ID,
    repository: new CockpitRepositories(db),
  });
  vi.stubGlobal("browser", {
    runtime: {
      sendMessage: (message: unknown) =>
        handler(message, { id: EXTENSION_ID, url: TRUSTED_URL }),
    },
  });
}

function installBrowserDomCompat(): void {
  HTMLElement.prototype.getBoundingClientRect = (): DOMRect =>
    ({ width: 100, height: 20 }) as DOMRect;
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
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5_000,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (!predicate()) {
    if (performance.now() >= deadline)
      throw new Error("integration: condition not reached");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

let db: PtePilotDb;
let site: FixtureSite;
let draft = "";
let controller: PracticeController;

beforeEach(async () => {
  installBrowserDomCompat();
  db = createPtePilotDb(`pte-pilot-it-${crypto.randomUUID()}`);
  installBrowserRuntime(db);
  site = new FixtureSite(QUESTIONS);
  draft = "";
  controller = new PracticeController(() => draft, document);
});

afterEach(async () => {
  controller.dispose();
  db.close();
  vi.unstubAllGlobals();
});

describe("practice loop integration", () => {
  it("initializes into ANSWERING on a verified edition", async () => {
    await controller.initialize();
    expect(controller.state.phase).toBe("ANSWERING");
    expect(controller.state.identity).toMatchObject({
      predictionEdition: EDITION,
      questionId: "131001",
      position: 1,
      total: 3,
    });
    // Background discovery learns at least the current question.
    await waitFor(() => controller.state.indexStatus === "PARTIAL");
  });

  it("submits, scores in-cockpit, records wrong words, and redoes", async () => {
    await controller.initialize();
    draft = "The comittee should reconsider the original proposal";
    await controller.submit();

    expect(controller.state.phase).toBe("REVIEW");
    expect(controller.state.review).toMatchObject({
      correctCount: 6,
      totalWords: 7,
      translation: "委员会应当重新考虑最初的提案",
    });
    expect(controller.state.review?.errors).toEqual([
      { expected: "committee", actual: "comittee", type: "spelling" },
    ]);

    // The misspelled long word reaches the persistent word library.
    await waitFor(() => true);
    const words = await new CockpitRepositories(db).listWordStats(10);
    expect(words.map((word) => word.expected)).toEqual(["committee"]);

    await controller.redo();
    expect(controller.state.phase).toBe("ANSWERING");
    expect(controller.state.draft).toBe("");
  });

  it("accepts a same-question resubmission after a perfect redo", async () => {
    await controller.initialize();
    draft = QUESTIONS[0]?.answer ?? "";
    await controller.submit();
    expect(controller.state.review?.correctCount).toBe(7);
    await controller.redo();
    await controller.submit();
    expect(controller.state.phase).toBe("REVIEW");
    expect(controller.state.review?.correctCount).toBe(7);
  });

  it("navigates next and back with epoch-guarded acceptance", async () => {
    await controller.initialize();
    await controller.navigate("next");
    expect(controller.state.phase).toBe("ANSWERING");
    expect(controller.state.identity).toMatchObject({
      questionId: "131002",
      position: 2,
    });
    await controller.navigate("previous");
    expect(controller.state.identity).toMatchObject({
      questionId: "131001",
      position: 1,
    });
  });

  it("opens every question with an empty answer box, even after typing", async () => {
    await controller.initialize();
    draft = "half typed answer";
    await controller.navigate("next");
    expect(controller.state.draft).toBe("");
    // Returning to the question that was typed on must not restore the text.
    await controller.navigate("previous");
    expect(controller.state.identity).toMatchObject({ questionId: "131001" });
    expect(controller.state.draft).toBe("");
  });

  it("persists marks (not drafts) across a reload", async () => {
    await controller.initialize();
    await controller.navigate("next");
    draft = "half typed answer";
    await controller.toggleMarked();
    expect(controller.state.marked).toBe(true);
    controller.dispose();

    // Simulate a reload: the site is back on question 1, a fresh controller
    // must restore the stored session (question 2) with its mark but with a
    // clean answer box.
    site.jumpTo(1);
    controller = new PracticeController(() => draft, document);
    await controller.initialize();
    expect(controller.state.identity).toMatchObject({
      questionId: "131002",
      position: 2,
    });
    expect(controller.state.draft).toBe("");
    expect(controller.state.marked).toBe(true);
  });

  it("runs a wrong-question drive over the stored index", async () => {
    const repository = new CockpitRepositories(db);
    await repository.saveIndexSnapshot(
      {
        predictionEdition: EDITION,
        orderedQuestionIds: QUESTIONS.map((question) => question.questionId),
        siteTotal: QUESTIONS.length,
        completeness: "complete",
        schemaVersion: 1,
      },
      QUESTIONS.map((question, index) => ({
        predictionEdition: EDITION,
        questionId: question.questionId,
        sitePosition: index + 1,
        siteTotal: QUESTIONS.length,
        tags: [],
        discoveredAt: new Date(0).toISOString(),
        schemaVersion: 1,
      })),
    );
    await controller.initialize();
    expect(controller.state.indexStatus).toBe("COMPLETE");

    controller.setCommand(true);
    // The drive always restarts from the first queued question — even though
    // the current question (131001) is in the queue — with a clean box.
    draft = "leftover text";
    await controller.startWrongDrive(["131003", "131001"]);
    await waitFor(() => controller.state.phase === "ANSWERING");
    expect(controller.state.identity).toMatchObject({
      questionId: "131003",
      position: 3,
    });
    expect(controller.state.draft).toBe("");
    expect(controller.state.reviewQueue).toEqual({ position: 1, total: 2 });

    await controller.navigate("next");
    expect(controller.state.identity).toMatchObject({ questionId: "131001" });
    expect(controller.state.reviewQueue).toEqual({ position: 2, total: 2 });

    // Stepping past the last queued question finishes the round.
    await controller.navigate("next");
    expect(controller.state.reviewQueue).toBeNull();
    expect(controller.state.notice).toContain("错题集刷完一轮");
  });
});
