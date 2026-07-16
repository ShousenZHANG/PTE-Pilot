import { describe, expect, it } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import { verifiedPredictionEdition } from "./dom-adapter";
import {
  PredictionEditionBootstrap,
  type PredictionEditionBootstrapSitePort,
} from "./prediction-edition-bootstrap";

interface Page {
  questionId: string;
  total?: number;
}

class FakeBootstrapSite implements PredictionEditionBootstrapSitePort {
  readonly #pages: Page[];
  readonly #observers = new Set<(identity: QuestionIdentity) => void>();
  readonly #structured: boolean;
  readonly #breakRestore: boolean;
  #position = 1;
  #hasLeftOrigin = false;
  #edition = "unverified";
  #bootstrapToken: string | null = null;
  #clearCount = 0;
  #adoption: { edition: string; total: number; position: number } | null = null;

  constructor(
    pages: Page[],
    options: { structured?: boolean; breakRestore?: boolean } = {},
  ) {
    this.#pages = pages;
    this.#structured = options.structured ?? false;
    this.#breakRestore = options.breakRestore ?? false;
  }

  beginProvisionalPredictionEdition(): string {
    const token = crypto.randomUUID();
    this.#bootstrapToken = token;
    this.#edition = `provisional:${token}`;
    return token;
  }

  adoptVerifiedPredictionEdition(
    edition: string,
    total: number,
    bootstrapToken: string,
  ): void {
    if (bootstrapToken !== this.#bootstrapToken)
      throw new Error("test:stale-bootstrap");
    this.#adoption = { edition, total, position: this.#position };
    this.#edition = edition;
  }

  clearPredictionEditionOverride(bootstrapToken: string): void {
    if (bootstrapToken !== this.#bootstrapToken) return;
    this.#clearCount += 1;
    this.#bootstrapToken = null;
    this.#edition = "unverified";
  }

  invalidateProvisionalPredictionEdition(bootstrapToken: string): boolean {
    if (
      bootstrapToken !== this.#bootstrapToken ||
      !this.#edition.startsWith("provisional:")
    )
      return false;
    this.clearPredictionEditionOverride(bootstrapToken);
    return true;
  }

  readIdentity(): QuestionIdentity {
    const page = this.#pages[this.#position - 1];
    if (!page) throw new Error("test:page-missing");
    const brokenQuestionId =
      this.#breakRestore && this.#hasLeftOrigin && this.#position === 1
        ? "q-restore-mismatch"
        : page.questionId;
    return {
      predictionEdition: this.#edition,
      questionId: brokenQuestionId,
      position: this.#position,
      total: page.total ?? this.#pages.length,
      tags: [],
    };
  }

  questionOptions(): QuestionIdentity[] | null {
    if (!this.#structured) return null;
    return this.#pages.map((page, index) => ({
      predictionEdition: this.#edition,
      questionId: page.questionId,
      position: index + 1,
      total: page.total ?? this.#pages.length,
      tags: [],
    }));
  }

  click(name: "previous" | "next"): void {
    this.#position += name === "next" ? 1 : -1;
    if (this.#position !== 1) this.#hasLeftOrigin = true;
    this.notify();
  }

  selectQuestion(position: number): void {
    this.#position = position;
    this.notify();
  }

  observeQuestionChanges(
    callback: (identity: QuestionIdentity) => void,
  ): () => void {
    this.#observers.add(callback);
    return () => this.#observers.delete(callback);
  }

  get adoption(): { edition: string; total: number; position: number } | null {
    return this.#adoption;
  }

  get clearCount(): number {
    return this.#clearCount;
  }

  get observerCount(): number {
    return this.#observers.size;
  }

  private notify(): void {
    const identity = this.readIdentity();
    for (const observer of this.#observers) observer(identity);
  }
}

const normalPages = [
  { questionId: "q-1" },
  { questionId: "q-2" },
  { questionId: "q-3" },
];

describe("PredictionEditionBootstrap", () => {
  it("traverses in memory, restores origin, and adopts the full ordered-ID fingerprint", async () => {
    const site = new FakeBootstrapSite(normalPages);
    const bootstrap = new PredictionEditionBootstrap(site);
    const progress: Array<{ completed: number; total: number }> = [];
    bootstrap.addEventListener("progress", (event) => {
      progress.push(
        (event as CustomEvent<{ completed: number; total: number }>).detail,
      );
    });

    const result = await bootstrap.run();

    const expected = verifiedPredictionEdition({
      explicitValues: [],
      headingTexts: [],
      optionQuestionIds: ["q-1", "q-2", "q-3"],
      expectedTotal: 3,
    });
    expect(result.edition).toBe(expected);
    expect(result.edition).toMatch(/^yc-set-3-[0-9a-f]{16}$/u);
    expect(result.snapshot).toEqual({
      predictionEdition: result.edition,
      orderedQuestionIds: ["q-1", "q-2", "q-3"],
      siteTotal: 3,
      completeness: "complete",
      schemaVersion: 1,
    });
    expect(result.questions).toHaveLength(3);
    expect(
      result.questions.every(
        (question) => question.predictionEdition === result.edition,
      ),
    ).toBe(true);
    expect(result.questions.map((question) => question.sitePosition)).toEqual([
      1, 2, 3,
    ]);
    expect(site.adoption).toEqual({
      edition: result.edition,
      total: 3,
      position: 1,
    });
    expect(site.clearCount).toBe(0);
    expect(site.observerCount).toBe(0);
    expect(progress.at(-1)).toEqual({ completed: 3, total: 3 });
  });

  it("fails closed and clears the provisional edition for duplicate IDs", async () => {
    const site = new FakeBootstrapSite([
      { questionId: "q-1" },
      { questionId: "q-2" },
      { questionId: "q-1" },
    ]);
    const bootstrap = new PredictionEditionBootstrap(site);

    await expect(bootstrap.run()).rejects.toThrow(
      "prediction-edition-bootstrap:incomplete",
    );
    expect(site.adoption).toBeNull();
    expect(site.clearCount).toBe(1);
  });

  it("fails closed when any traversed question changes total", async () => {
    const site = new FakeBootstrapSite(
      [
        { questionId: "q-1" },
        { questionId: "q-2", total: 4 },
        { questionId: "q-3" },
      ],
      { structured: true },
    );
    const bootstrap = new PredictionEditionBootstrap(site);

    await expect(bootstrap.run()).rejects.toThrow(
      "prediction-edition-bootstrap:total-changed",
    );
    expect(site.adoption).toBeNull();
    expect(site.clearCount).toBe(1);
  });

  it("fails closed when traversal cannot restore the starting identity", async () => {
    const site = new FakeBootstrapSite(normalPages, { breakRestore: true });
    const bootstrap = new PredictionEditionBootstrap(site);

    await expect(bootstrap.run()).rejects.toThrow(
      "prediction-edition-bootstrap:incomplete",
    );
    expect(site.adoption).toBeNull();
    expect(site.clearCount).toBe(1);
  });

  it("cancels an active run, clears provisional state, and releases observers", async () => {
    const site = new FakeBootstrapSite(normalPages);
    const bootstrap = new PredictionEditionBootstrap(site);

    const run = bootstrap.run();
    expect(bootstrap.cancel()).toBe(true);

    await expect(run).rejects.toThrow(
      "prediction-edition-bootstrap:incomplete",
    );
    expect(site.clearCount).toBe(1);
    expect(site.observerCount).toBe(0);
  });

  it("disposes an active run and rejects future runs", async () => {
    const site = new FakeBootstrapSite(normalPages);
    const bootstrap = new PredictionEditionBootstrap(site);

    const run = bootstrap.run();
    const rejection = expect(run).rejects.toThrow(
      /prediction-edition-bootstrap|navigation:aborted/u,
    );
    const cleanup = bootstrap.dispose();

    expect(site.clearCount).toBe(1);
    await cleanup;

    await rejection;
    await expect(bootstrap.run()).rejects.toThrow(
      "prediction-edition-bootstrap:disposed",
    );
    expect(site.clearCount).toBe(1);
    expect(site.observerCount).toBe(0);
  });
});
