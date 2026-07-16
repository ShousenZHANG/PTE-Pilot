import { PTE_PILOT_ISOLATION_ATTRIBUTE } from "../app/page-isolation";
import type {
  AdapterDiagnostic,
  ProbeResult,
  QuestionIdentity,
  RevealSignature,
  SiteCapabilities,
} from "../domain/types";
import type { RevealedAnswerProof } from "./answer-gate";
import {
  type ControlName,
  matchesControlLabel,
  normalizeLabel,
  parsePositionLabel,
  parseQuestionId,
  resolveUnique,
} from "./semantic";

function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  let current: HTMLElement | null = element;
  while (current) {
    const style = getComputedStyle(current);
    if (
      current.hidden ||
      (current.getAttribute("aria-hidden") === "true" &&
        current.getAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE) !== "aria-added") ||
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0
    ) {
      return false;
    }
    current = current.parentElement;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function semanticLabel(element: Element): string {
  return normalizeLabel(
    element.getAttribute("aria-label") ??
      element.getAttribute("title") ??
      (element instanceof HTMLInputElement
        ? element.value
        : element.textContent),
  );
}

function toDiagnostic(error: unknown, capability: string): AdapterDiagnostic {
  const detail = error instanceof Error ? error.message : String(error);
  return {
    code: detail.endsWith(":ambiguous")
      ? "AMBIGUOUS_CONTROL"
      : "MISSING_CONTROL",
    capability,
    detail,
  };
}

type PredictionEditionOverride = {
  token: string;
  value: string;
  state: "provisional" | "verified";
  total: number | null;
};

export class PredictionEditionOverrideState {
  readonly #createToken: () => string;
  #current: PredictionEditionOverride | null = null;

  constructor(createToken: () => string = () => crypto.randomUUID()) {
    this.#createToken = createToken;
  }

  begin(): string {
    const token = this.#createToken();
    this.#current = {
      token,
      value: `provisional:${token}`,
      state: "provisional",
      total: null,
    };
    return token;
  }

  probeDiagnostic(): AdapterDiagnostic | null {
    return this.#current?.state === "provisional"
      ? {
          code: "INVALID_QUESTION",
          detail: "question:prediction-edition-unverified",
        }
      : null;
  }

  resolve(expectedTotal: number): string | null {
    const current = this.#current;
    if (!current) return null;
    if (current.total === null) current.total = expectedTotal;
    if (current.total !== expectedTotal) {
      if (current.state === "verified") {
        this.#current = null;
        return null;
      }
      throw new Error("question:prediction-total-changed");
    }
    return current.value;
  }

  adopt(edition: string, total: number, bootstrapToken: string): void {
    const current = this.#current;
    if (current?.state !== "provisional" || current.token !== bootstrapToken)
      throw new Error("question:prediction-bootstrap-missing");
    if (current.total !== null && current.total !== total)
      throw new Error("question:prediction-total-changed");
    if (!isVerifiedQuestionSetEdition(edition, total))
      throw new Error("question:prediction-edition-unverified");
    this.#current = {
      token: bootstrapToken,
      value: edition,
      state: "verified",
      total,
    };
  }

  clear(bootstrapToken: string): boolean {
    if (this.#current?.token !== bootstrapToken) return false;
    this.#current = null;
    return true;
  }

  invalidateProvisional(bootstrapToken: string): boolean {
    if (
      this.#current?.state !== "provisional" ||
      this.#current.token !== bootstrapToken
    )
      return false;
    this.#current = null;
    return true;
  }

  invalidateVerified(edition: string): boolean {
    if (this.#current?.state !== "verified" || this.#current.value !== edition)
      return false;
    this.#current = null;
    return true;
  }
}

export class FireflyDomAdapter {
  readonly #document: Document;
  readonly #predictionEditionOverride = new PredictionEditionOverrideState();
  #activeRevealBinding: {
    proof: RevealedAnswerProof;
    node: HTMLElement;
    signature: RevealSignature;
  } | null = null;

  constructor(document: Document = window.document) {
    this.#document = document;
  }

  probe(): ProbeResult {
    const provisionalDiagnostic =
      this.#predictionEditionOverride.probeDiagnostic();
    if (provisionalDiagnostic)
      return { ok: false, diagnostic: provisionalDiagnostic };

    if (this.#looksLoggedOut()) {
      return {
        ok: false,
        diagnostic: {
          code: "AUTH_REQUIRED",
          detail: "Firefly login required",
        },
      };
    }

    let identity: QuestionIdentity;
    try {
      identity = this.readIdentity();
      this.input();
      this.control("score");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        diagnostic: {
          code: detail.startsWith("question:")
            ? "INVALID_QUESTION"
            : "SITE_CHANGED",
          detail,
        },
      };
    }

    return { ok: true, identity, capabilities: this.capabilities() };
  }

  capabilities(): SiteCapabilities {
    return {
      input: this.findInputs().length === 1,
      score: this.findControls("score").length === 1,
      answer: this.findControls("answer").length === 1,
      previous: this.findControls("previous").length === 1,
      next: this.findControls("next").length === 1,
      redo: this.findControls("redo").length === 1,
      play:
        this.findControls("play").length === 1 ||
        this.visibleAudioElements().length === 1,
      select: this.supportsDirectSelection(),
    };
  }

  readIdentity(): QuestionIdentity {
    const positions = this.visibleElements()
      .map((element) => parsePositionLabel(element.textContent ?? ""))
      .filter(
        (value): value is { position: number; total: number } => value !== null,
      );
    const uniquePositions = dedupe(
      positions,
      (value) => `${value.position}/${value.total}`,
    );
    const position = resolveUnique(uniquePositions, "question:position");

    const attributeIds = Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        "[data-question-id]:not(option), [data-exercise-id]:not(option)",
      ),
    )
      .filter(isVisible)
      .map((element) =>
        parseQuestionId(
          element.dataset.questionId ??
            element.dataset.exerciseId ??
            element.textContent ??
            "",
        ),
      )
      .filter((value): value is string => value !== null);
    const visibleIds = this.visibleElements()
      .map((element) => parseQuestionId(element.textContent ?? ""))
      .filter((value): value is string => value !== null);
    const questionId = resolveUnique(
      dedupe(
        attributeIds.length > 0 ? attributeIds : visibleIds,
        (value) => value,
      ),
      "question:id",
    );

    return {
      predictionEdition: this.readPredictionEdition(position.total),
      questionId,
      position: position.position,
      total: position.total,
      tags: this.readTags(),
    };
  }

  beginProvisionalPredictionEdition(): string {
    return this.#predictionEditionOverride.begin();
  }

  adoptVerifiedPredictionEdition(
    edition: string,
    total: number,
    bootstrapToken: string,
  ): void {
    this.#predictionEditionOverride.adopt(edition, total, bootstrapToken);
  }

  clearPredictionEditionOverride(bootstrapToken: string): void {
    this.#predictionEditionOverride.clear(bootstrapToken);
  }

  invalidateProvisionalPredictionEdition(bootstrapToken: string): boolean {
    return this.#predictionEditionOverride.invalidateProvisional(
      bootstrapToken,
    );
  }

  invalidateVerifiedPredictionEdition(edition: string): boolean {
    return this.#predictionEditionOverride.invalidateVerified(edition);
  }

  supportsDirectSelection(): boolean {
    if (this.questionSelect() !== null) return true;
    try {
      return this.customQuestionItems(this.readIdentity().total) !== null;
    } catch {
      return false;
    }
  }

  input(): HTMLTextAreaElement {
    return resolveUnique(this.findInputs(), "input");
  }

  control(name: ControlName): HTMLElement {
    try {
      return resolveUnique(this.findControls(name), name);
    } catch (error) {
      throw Object.assign(new Error(toDiagnostic(error, name).detail), {
        capability: name,
      });
    }
  }

  click(name: ControlName): void {
    const element = this.control(name);
    if (
      element.getAttribute("aria-disabled") === "true" ||
      ("disabled" in element && element.disabled)
    ) {
      throw new Error(`${name}:disabled`);
    }
    element.click();
  }

  writeAnswer(value: string): void {
    const input = this.input();
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (!setter) throw new Error("input:native-setter-missing");
    setter.call(input, value);
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: value,
      }),
    );
    input.dispatchEvent(new Event("change", { bubbles: true }));
    if (input.value !== value) throw new Error("input:writeback-mismatch");
  }

  revealSignature(): RevealSignature {
    const nodes = this.revealNodes();
    const visibleNodes = nodes.filter(isVisible);
    return {
      visible: visibleNodes.length > 0,
      nodeCount: visibleNodes.length,
      textLength: visibleNodes.reduce(
        (sum, node) => sum + normalizeLabel(node.textContent).length,
        0,
      ),
    };
  }

  async scoreAndWait(
    expected: QuestionIdentity,
    operationToken: string,
    timeoutMs = 8_000,
  ): Promise<RevealedAnswerProof | null> {
    this.#activeRevealBinding = null;
    const beforeReveal = this.revealSignature();
    if (beforeReveal.visible) throw new Error("score:answer-already-visible");
    if (this.revealNodes().some((node) => answerTextLength(node) > 0))
      throw new Error("score:stale-answer-residue");
    const beforeScore = this.scoreState(expected);
    const outcome = await this.waitForVerifiedTransition(
      expected,
      () => {
        const afterReveal = this.revealSignature();
        const afterScore = this.scoreState(expected);
        if (revealTransitioned(beforeReveal, afterReveal)) return "reveal";
        if (
          afterScore.complete &&
          !beforeScore.complete &&
          afterScore.signature !== beforeScore.signature
        )
          return "score";
        return null;
      },
      () => this.click("score"),
      timeoutMs,
      "score",
    );
    return outcome === "reveal"
      ? this.bindRevealProof(expected, operationToken, "score")
      : null;
  }

  async revealAnswerAndWait(
    expected: QuestionIdentity,
    operationToken: string,
    timeoutMs = 8_000,
  ): Promise<RevealedAnswerProof> {
    this.#activeRevealBinding = null;
    const before = this.revealSignature();
    if (before.visible) throw new Error("reveal:answer-already-visible");
    await this.waitForVerifiedTransition(
      expected,
      () => (revealTransitioned(before, this.revealSignature()) ? true : null),
      () => this.click("answer"),
      timeoutMs,
      "reveal",
    );
    return this.bindRevealProof(expected, operationToken, "answer");
  }

  isScoreComplete(): boolean {
    return this.scoreState(this.readIdentity()).complete;
  }

  readRevealedAnswer(proof: RevealedAnswerProof): string {
    const binding = this.#activeRevealBinding;
    if (!binding || binding.proof !== proof)
      throw new Error("answer:unproven-reveal");
    const identity = this.readIdentity();
    if (!sameQuestionIdentity(identity, proof))
      throw new Error("answer:question-changed");
    const visible = this.revealNodes().filter(isVisible);
    const node = resolveUnique(visible, "answer:revealed");
    if (node !== binding.node) throw new Error("answer:reveal-node-changed");
    const signature = this.revealSignature();
    if (!sameRevealSignature(signature, binding.signature))
      throw new Error("answer:reveal-changed");
    const answer = normalizeLabel(node.textContent);
    if (answer.length === 0) throw new Error("answer:empty");
    this.#activeRevealBinding = null;
    return answer;
  }

  questionOptions(): QuestionIdentity[] | null {
    const select = this.questionSelect();
    if (!select) return null;
    const current = this.readIdentity();
    const options = Array.from(select.options)
      .map<QuestionIdentity | null>((option, index) => {
        const questionId =
          parseQuestionId(option.dataset.questionId ?? "") ??
          parseQuestionId(option.value) ??
          null;
        if (!questionId) return null;
        return {
          predictionEdition: current.predictionEdition,
          questionId,
          position: index + 1,
          total: select.options.length,
          tags: [],
        } satisfies QuestionIdentity;
      })
      .filter((value): value is QuestionIdentity => value !== null);
    const currentOption = options[current.position - 1];
    return options.length === select.options.length &&
      options.length === current.total &&
      new Set(options.map((option) => option.questionId)).size ===
        current.total &&
      currentOption?.questionId === current.questionId
      ? options
      : null;
  }

  selectQuestion(position: number): void {
    const select = this.questionSelect();
    if (select) {
      const option = select.options.item(position - 1);
      if (!option) throw new Error("select:target-missing");
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const items = this.customQuestionItems(this.readIdentity().total);
    const target = items?.[position - 1];
    if (!target)
      throw new Error(items ? "select:target-missing" : "select:missing");
    target.click();
  }

  visibleAudioElements(): HTMLAudioElement[] {
    return Array.from(this.#document.querySelectorAll("audio")).filter(
      isVisible,
    );
  }

  observeQuestionChanges(
    callback: (identity: QuestionIdentity) => void,
  ): () => void {
    let last = safeIdentityKey(this);
    const observer = new MutationObserver(() => {
      const next = safeIdentityKey(this);
      if (!next || next.key === last?.key) return;
      last = next;
      callback(next.identity);
    });
    observer.observe(this.#document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "data-question-id",
        "data-exercise-id",
        "data-prediction-edition",
        "value",
        "selected",
      ],
    });
    return () => observer.disconnect();
  }

  private findControls(name: ControlName): HTMLElement[] {
    const selector =
      "button, [role='button'], input[type='button'], input[type='submit']";
    return Array.from(
      this.#document.querySelectorAll<HTMLElement>(selector),
    ).filter(
      (element) =>
        isVisible(element) && matchesControlLabel(name, semanticLabel(element)),
    );
  }

  private findInputs(): HTMLTextAreaElement[] {
    const visible = Array.from(
      this.#document.querySelectorAll("textarea"),
    ).filter(isVisible);
    const exactPlaceholder = visible.filter((element) =>
      new Set(["请输入内容", "Type your answer", "Type your answer here"]).has(
        normalizeLabel(element.placeholder),
      ),
    );
    return exactPlaceholder.length > 0 ? exactPlaceholder : visible;
  }

  private visibleElements(): HTMLElement[] {
    return Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        "[data-question-id], [data-exercise-id], [aria-label], h1, h2, h3, h4, span, strong, b, label",
      ),
    ).filter(isVisible);
  }

  private questionSelect(): HTMLSelectElement | null {
    const selects = Array.from(
      this.#document.querySelectorAll("select"),
    ).filter(isVisible);
    const semantic = selects.filter((select) => {
      const label = semanticLabel(select);
      return new Set(["选择题号", "Question", "Question number"]).has(label);
    });
    if (semantic.length === 1) return semantic[0] ?? null;
    if (selects.length === 1) return selects[0] ?? null;
    return null;
  }

  private customQuestionItems(expectedTotal?: number): HTMLElement[] | null {
    const pickers = Array.from(
      this.#document.querySelectorAll<HTMLInputElement>("input[readonly]"),
    ).filter(
      (input) =>
        normalizeLabel(input.placeholder) === "选择题号" && isVisible(input),
    );
    if (pickers.length !== 1) return null;
    const items = Array.from(
      this.#document.querySelectorAll<HTMLElement>(".el-select-dropdown__item"),
    );
    return isSequentialQuestionPositionList(
      items.map((item) => item.textContent ?? ""),
      expectedTotal,
    )
      ? items
      : null;
  }

  private revealNodes(): HTMLElement[] {
    const selectors = [
      "[data-pte-answer]",
      "[data-testid='answer']",
      "[aria-label='正确答案']",
      "[aria-label='Correct answer']",
    ];
    return Array.from(
      this.#document.querySelectorAll<HTMLElement>(selectors.join(", ")),
    );
  }

  private scoreState(expected: QuestionIdentity): {
    complete: boolean;
    signature: string;
  } {
    const proofs = Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        "[data-score-complete], [data-testid='score-proof']",
      ),
    )
      .filter(isVisible)
      .filter((node) => ownedQuestionId(node) === expected.questionId)
      .map((node) => ({
        complete:
          node.dataset.scoreComplete === "true" ||
          node.dataset.complete === "true" ||
          new Set(["complete", "completed", "scored"]).has(
            node.dataset.status?.toLocaleLowerCase("en-AU") ?? "",
          ),
        questionId: ownedQuestionId(node),
      }));
    const complete = proofs.some((proof) => proof.complete);
    return {
      complete,
      signature: JSON.stringify(proofs),
    };
  }

  private waitForVerifiedTransition<T>(
    expected: QuestionIdentity,
    transitioned: () => T | null,
    action: () => void,
    timeoutMs: number,
    operation: string,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        if (timeout) clearTimeout(timeout);
        reject(error);
      };
      const succeed = (result: T) => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        if (timeout) clearTimeout(timeout);
        resolve(result);
      };
      const inspect = () => {
        let identity: QuestionIdentity;
        try {
          identity = this.readIdentity();
        } catch {
          return;
        }
        if (!sameQuestionIdentity(identity, expected)) {
          fail(new Error(`${operation}:question-changed`));
          return;
        }
        try {
          const result = transitioned();
          if (result !== null) succeed(result);
        } catch {
          // Site DOM can be transient; timeout remains the fail-closed guard.
        }
      };
      const observer = new MutationObserver(inspect);
      observer.observe(this.#document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          "hidden",
          "style",
          "class",
          "disabled",
          "aria-disabled",
          "aria-hidden",
          "data-complete",
          "data-score-complete",
          "data-status",
        ],
      });
      timeout = setTimeout(
        () => fail(new Error(`${operation}:timeout`)),
        timeoutMs,
      );
      try {
        action();
        inspect();
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private bindRevealProof(
    expected: QuestionIdentity,
    operationToken: string,
    source: RevealedAnswerProof["source"],
  ): RevealedAnswerProof {
    const identity = this.readIdentity();
    if (!sameQuestionIdentity(identity, expected))
      throw new Error(`${source}:question-changed`);
    const node = resolveUnique(
      this.revealNodes().filter(isVisible),
      "answer:revealed",
    );
    if (ownedQuestionId(node) !== expected.questionId)
      throw new Error("answer:question-ownership-unproven");
    const signature = this.revealSignature();
    const proof = Object.freeze({
      predictionEdition: identity.predictionEdition,
      questionId: identity.questionId,
      position: identity.position,
      total: identity.total,
      operationToken,
      source,
    }) satisfies RevealedAnswerProof;
    this.#activeRevealBinding = { proof, node, signature };
    return proof;
  }

  private readPredictionEdition(expectedTotal: number): string {
    const explicitValues = Array.from(
      this.#document.querySelectorAll<HTMLElement>("[data-prediction-edition]"),
    )
      .filter(isVisible)
      .map((element) => element.dataset.predictionEdition ?? "");
    const headingTexts = Array.from(
      this.#document.querySelectorAll<HTMLElement>("h1, h2, h3, h4"),
    )
      .filter(isVisible)
      .map((element) => element.textContent ?? "");
    const optionQuestionIds = Array.from(this.questionSelect()?.options ?? [])
      .map(
        (option) =>
          parseQuestionId(option.dataset.questionId ?? "") ??
          parseQuestionId(option.value),
      )
      .filter((value): value is string => value !== null);
    try {
      return verifiedPredictionEdition({
        explicitValues,
        headingTexts,
        optionQuestionIds,
        expectedTotal,
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== "question:prediction-edition-unverified"
      )
        throw error;
      const override = this.#predictionEditionOverride.resolve(expectedTotal);
      if (override === null) throw error;
      return override;
    }
  }

  private readTags(): string[] {
    const nodes = Array.from(
      this.#document.querySelectorAll<HTMLElement>("[data-question-tag]"),
    )
      .filter(isVisible)
      .map((element) =>
        normalizeLabel(element.dataset.questionTag ?? element.textContent),
      )
      .filter(Boolean);
    return dedupe(nodes, (value) => value);
  }

  #looksLoggedOut(): boolean {
    if (/\/(?:login|signin)(?:\/|$)/iu.test(this.#document.location.pathname))
      return true;
    const password = this.#document.querySelector("input[type='password']");
    if (password instanceof HTMLInputElement && isVisible(password))
      return true;
    const loginText = Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        "button, a, h1, h2, [role='dialog'], [class*='login']",
      ),
    )
      .filter(isVisible)
      .map((element) => normalizeLabel(element.textContent))
      .filter((text) => /^(?:登录|注册|login|sign in|log in)$/iu.test(text));
    return loginText.length > 0 && this.findInputs().length === 0;
  }
}

export function verifiedPredictionEdition(input: {
  explicitValues: readonly string[];
  headingTexts: readonly string[];
  optionQuestionIds: readonly string[];
  expectedTotal: number;
}): string {
  const explicitEditions = [
    ...new Set(
      input.explicitValues
        .map(normalizeLabel)
        .filter((value) => value && !isGenericPredictionHeading(value)),
    ),
  ];
  const headingEditions = [
    ...new Set(
      input.headingTexts.map(normalizeLabel).filter((value) => {
        const match =
          /^(?:周预测|Weekly prediction)(?:\s*[:：#-]\s*|\s+)(.+)$/iu.exec(
            value,
          );
        return Boolean(match?.[1] && isVersionedPredictionHeading(match[1]));
      }),
    ),
  ];
  if (explicitEditions.length > 1 || headingEditions.length > 1)
    throw new Error("question:prediction-edition-ambiguous");
  const explicitEdition = explicitEditions[0];
  const headingEdition = headingEditions[0];
  if (
    explicitEdition &&
    headingEdition &&
    !compatiblePredictionEditions(explicitEdition, headingEdition)
  )
    throw new Error("question:prediction-edition-ambiguous");
  if (explicitEdition) return explicitEdition;
  if (headingEdition) return headingEdition;
  const ids = input.optionQuestionIds;
  if (
    Number.isSafeInteger(input.expectedTotal) &&
    input.expectedTotal > 0 &&
    ids.length === input.expectedTotal &&
    new Set(ids).size === input.expectedTotal
  ) {
    return `yc-set-${ids.length}-${fnv1a64(ids.join("\u0000"))}`;
  }
  throw new Error("question:prediction-edition-unverified");
}

export function isSequentialQuestionPositionList(
  labels: readonly string[],
  expectedTotal?: number,
): boolean {
  return (
    labels.length > 0 &&
    (expectedTotal === undefined || labels.length === expectedTotal) &&
    labels.every((label, index) => normalizeLabel(label) === String(index + 1))
  );
}

export function isVerifiedQuestionSetEdition(
  edition: string,
  total: number,
): boolean {
  return (
    Number.isSafeInteger(total) &&
    total > 0 &&
    new RegExp(`^yc-set-${total}-[0-9a-f]{16}$`, "u").test(edition)
  );
}

function isGenericPredictionHeading(value: string): boolean {
  return /^(?:周预测|Weekly prediction)$/iu.test(value);
}

function isVersionedPredictionHeading(suffix: string): boolean {
  const hasYear = /(?:19|20)\d{2}/u.test(suffix);
  const hasWeek =
    /(?:\bW(?:eek)?\s*[-:#]?\s*\d{1,2}\b|第\s*\d{1,2}\s*周)/iu.test(suffix);
  const hasDate =
    /(?:19|20)\d{2}\s*[-/.年]\s*(?:0?[1-9]|1[0-2])\s*[-/.月]\s*(?:0?[1-9]|[12]\d|3[01])(?:\s*日)?/u.test(
      suffix,
    );
  return hasYear && (hasWeek || hasDate);
}

function compatiblePredictionEditions(left: string, right: string): boolean {
  const leftKey = canonicalPredictionVersion(left);
  const rightKey = canonicalPredictionVersion(right);
  if (leftKey && rightKey) return leftKey === rightKey;
  const normalizedLeft = left.toLocaleLowerCase("en-AU");
  const normalizedRight = right.toLocaleLowerCase("en-AU");
  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function canonicalPredictionVersion(value: string): string | null {
  const date =
    /((?:19|20)\d{2})\s*[-/.年]\s*(0?[1-9]|1[0-2])\s*[-/.月]\s*(0?[1-9]|[12]\d|3[01])(?:\s*日)?/u.exec(
      value,
    );
  if (date?.[1] && date[2] && date[3])
    return `date:${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`;
  const week =
    /((?:19|20)\d{2})[\s/_-]*(?:W(?:eek)?)[\s:#/_-]*(\d{1,2})/iu.exec(value) ??
    /((?:19|20)\d{2})\s*年?\s*第?\s*(\d{1,2})\s*周/u.exec(value) ??
    /\bweekly[\s/_-]*((?:19|20)\d{2})[\s/_-]+W?(\d{1,2})\b/iu.exec(value);
  if (!week?.[1] || !week[2]) return null;
  const weekNumber = Number(week[2]);
  return weekNumber >= 1 && weekNumber <= 53
    ? `week:${week[1]}-${String(weekNumber).padStart(2, "0")}`
    : null;
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function revealTransitioned(
  before: RevealSignature,
  after: RevealSignature,
): boolean {
  return (
    after.visible &&
    (!before.visible ||
      after.nodeCount !== before.nodeCount ||
      after.textLength !== before.textLength)
  );
}

function sameQuestionIdentity(
  left: Pick<
    QuestionIdentity,
    "predictionEdition" | "questionId" | "position" | "total"
  >,
  right: Pick<
    QuestionIdentity,
    "predictionEdition" | "questionId" | "position" | "total"
  >,
): boolean {
  return (
    left.predictionEdition === right.predictionEdition &&
    left.questionId === right.questionId &&
    left.position === right.position &&
    left.total === right.total
  );
}

function sameRevealSignature(
  left: RevealSignature,
  right: RevealSignature,
): boolean {
  return (
    left.visible === right.visible &&
    left.nodeCount === right.nodeCount &&
    left.textLength === right.textLength
  );
}

function answerTextLength(node: HTMLElement): number {
  return normalizeLabel(node.textContent).length;
}

export function ownedQuestionId(node: HTMLElement): string | null {
  let current: HTMLElement | null = node;
  while (current) {
    const raw = current.dataset.questionId ?? current.dataset.exerciseId;
    if (raw !== undefined) return parseQuestionId(raw);
    current = current.parentElement;
  }
  return null;
}

function dedupe<T>(values: readonly T[], key: (value: T) => string): T[] {
  return [...new Map(values.map((value) => [key(value), value])).values()];
}

function safeIdentityKey(
  adapter: FireflyDomAdapter,
): { key: string; identity: QuestionIdentity } | null {
  try {
    const identity = adapter.readIdentity();
    return {
      key: `${identity.predictionEdition}:${identity.questionId}:${identity.position}`,
      identity,
    };
  } catch {
    return null;
  }
}
