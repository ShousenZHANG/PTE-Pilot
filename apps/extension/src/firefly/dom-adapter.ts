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
  type BridgeAudioState,
  type BridgeCommand,
  MainWorldAudioBridge,
} from "./audio-bridge";
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

/*
 * Firefly's AI score dialog (and any other modal) can contain text such as
 * "7/10" that would otherwise be indistinguishable from the question position
 * label. Question identity, controls, and edition facts must only ever come
 * from the exercise surface, never from a transient overlay.
 */
function outsideTransientOverlays(element: Element): boolean {
  if (typeof element.closest !== "function") return true;
  return (
    element.closest(
      ".el-dialog__wrapper, .el-message-box__wrapper, [role='dialog'], [role='alertdialog']",
    ) === null
  );
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
  state: "provisional" | "session" | "verified";
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

  beginSession(): string {
    const token = this.#createToken();
    this.#current = {
      token,
      value: `session:${token}`,
      state: "session",
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
      if (current.state !== "provisional") {
        this.#current = null;
        return null;
      }
      throw new Error("question:prediction-total-changed");
    }
    return current.value;
  }

  /*
   * Re-adopt a previously verified edition after a page reload, matched
   * against stored index facts by the caller. No bootstrap token exists in
   * this path; the format check is the gate.
   */
  restore(edition: string, total: number): boolean {
    if (!isVerifiedQuestionSetEdition(edition, total)) return false;
    this.#current = {
      token: this.#createToken(),
      value: edition,
      state: "verified",
      total,
    };
    return true;
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

type FireflyScoreAnswerState = {
  candidateCount: number;
  node: HTMLElement | null;
  visible: boolean;
  fingerprint: string | null;
};

export class FireflyDomAdapter {
  readonly #document: Document;
  readonly #predictionEditionOverride = new PredictionEditionOverrideState();
  readonly #audioBridge = new MainWorldAudioBridge();
  /*
   * Fingerprints of answers this session has already read, keyed to the
   * question that owns them. Lets a same-question resubmission be accepted
   * even though the dialog content (and therefore its fingerprint) cannot
   * change, while a stale answer from another question keeps failing closed.
   */
  readonly #acceptedAnswerOwners = new Map<string, string>();
  #activeRevealBinding:
    | {
        kind: "explicit";
        proof: RevealedAnswerProof;
        node: HTMLElement;
        signature: RevealSignature;
      }
    | {
        kind: "firefly-score";
        proof: RevealedAnswerProof;
        node: HTMLElement;
        signature: RevealSignature;
        fingerprint: string;
      }
    | null = null;

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
        this.siteAudioElements().length === 1 ||
        Array.from(
          this.#document.querySelectorAll<HTMLElement>(".audio-pause-btn"),
        ).filter(isVisible).length === 1,
      select: this.supportsDirectSelection(),
    };
  }

  readIdentity(): QuestionIdentity {
    const bare = this.readPositionAndQuestionId();
    return {
      predictionEdition: this.readPredictionEdition(bare.total),
      questionId: bare.questionId,
      position: bare.position,
      total: bare.total,
      tags: this.readTags(),
    };
  }

  /*
   * Question facts without an edition. Used to re-identify a stored
   * verified set on reload, before any edition can be resolved.
   */
  readBareIdentity(): {
    questionId: string;
    position: number;
    total: number;
  } | null {
    try {
      return this.readPositionAndQuestionId();
    } catch {
      return null;
    }
  }

  restoreVerifiedPredictionEdition(edition: string, total: number): boolean {
    return this.#predictionEditionOverride.restore(edition, total);
  }

  private readPositionAndQuestionId(): {
    questionId: string;
    position: number;
    total: number;
  } {
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
      .filter(outsideTransientOverlays)
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
      questionId,
      position: position.position,
      total: position.total,
    };
  }

  beginProvisionalPredictionEdition(): string {
    return this.#predictionEditionOverride.begin();
  }

  beginSessionPredictionEdition(): string {
    return this.#predictionEditionOverride.beginSession();
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

  playAudio(): void {
    this.audioToggleControl("play").click();
  }

  pauseAudio(): void {
    this.audioToggleControl("pause").click();
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
    const beforeExplicitReveal = this.explicitRevealSignature();
    const beforeFireflyReveal = this.fireflyScoreAnswerState();
    if (beforeExplicitReveal.visible)
      throw new Error("score:answer-already-visible");
    if (this.explicitRevealNodes().some((node) => answerTextLength(node) > 0))
      throw new Error("score:stale-answer-residue");
    if (beforeFireflyReveal.candidateCount > 1)
      throw new Error("score:firefly-answer-ambiguous");
    const beforeScore = this.scoreState(expected);
    const outcome = await this.waitForVerifiedTransition(
      expected,
      () => {
        const afterExplicitReveal = this.explicitRevealSignature();
        const afterFireflyReveal = this.fireflyScoreAnswerState();
        const afterScore = this.scoreState(expected);
        if (revealTransitioned(beforeExplicitReveal, afterExplicitReveal)) {
          return { kind: "explicit-reveal" } as const;
        }
        if (
          afterFireflyReveal.candidateCount === 1 &&
          afterFireflyReveal.visible &&
          afterFireflyReveal.node &&
          afterFireflyReveal.fingerprint &&
          (afterFireflyReveal.fingerprint !== beforeFireflyReveal.fingerprint ||
            this.#acceptedAnswerOwners.get(afterFireflyReveal.fingerprint) ===
              expected.questionId)
        ) {
          return {
            kind: "firefly-reveal",
            node: afterFireflyReveal.node,
            fingerprint: afterFireflyReveal.fingerprint,
          } as const;
        }
        if (
          afterScore.complete &&
          !beforeScore.complete &&
          afterScore.signature !== beforeScore.signature
        )
          return { kind: "score" } as const;
        return null;
      },
      () => this.click("score"),
      timeoutMs,
      "score",
    );
    if (outcome.kind === "explicit-reveal") {
      return this.bindExplicitRevealProof(expected, operationToken, "score");
    }
    if (outcome.kind === "firefly-reveal") {
      return this.bindCausalFireflyProof(
        expected,
        operationToken,
        outcome.node,
        outcome.fingerprint,
      );
    }
    return null;
  }

  async revealAnswerAndWait(
    expected: QuestionIdentity,
    operationToken: string,
    timeoutMs = 8_000,
  ): Promise<RevealedAnswerProof> {
    this.#activeRevealBinding = null;
    const before = this.explicitRevealSignature();
    if (before.visible) throw new Error("reveal:answer-already-visible");
    await this.waitForVerifiedTransition(
      expected,
      () =>
        revealTransitioned(before, this.explicitRevealSignature())
          ? true
          : null,
      () => this.click("answer"),
      timeoutMs,
      "reveal",
    );
    return this.bindExplicitRevealProof(expected, operationToken, "answer");
  }

  isScoreComplete(): boolean {
    return this.scoreState(this.readIdentity()).complete;
  }

  readRevealedAnswer(proof: RevealedAnswerProof): string {
    return this.readRevealedContent(proof).answer;
  }

  readRevealedContent(proof: RevealedAnswerProof): {
    answer: string;
    translation: string | null;
  } {
    const binding = this.#activeRevealBinding;
    if (!binding || binding.proof !== proof)
      throw new Error("answer:unproven-reveal");
    const identity = this.readIdentity();
    if (!sameQuestionIdentity(identity, proof))
      throw new Error("answer:question-changed");
    const visible =
      binding.kind === "firefly-score"
        ? this.fireflyScoreAnswerNodes().filter(isVisible)
        : this.explicitRevealNodes().filter(isVisible);
    const node = resolveUnique(visible, "answer:revealed");
    if (node !== binding.node) throw new Error("answer:reveal-node-changed");
    if (
      binding.kind === "firefly-score" &&
      answerFingerprint(node) !== binding.fingerprint
    ) {
      throw new Error("answer:reveal-changed");
    }
    const signature = this.revealSignature();
    if (!sameRevealSignature(signature, binding.signature))
      throw new Error("answer:reveal-changed");
    const answer = normalizeLabel(node.textContent);
    if (answer.length === 0) throw new Error("answer:empty");
    const translation =
      binding.kind === "firefly-score" ? readDialogTranslation(node) : null;
    if (binding.kind === "firefly-score") {
      if (this.#acceptedAnswerOwners.size > 512)
        this.#acceptedAnswerOwners.clear();
      this.#acceptedAnswerOwners.set(binding.fingerprint, proof.questionId);
    }
    this.#activeRevealBinding = null;
    return { answer, translation };
  }

  async dismissRevealDialog(timeoutMs = 1_200): Promise<boolean> {
    const deadline = performance.now() + timeoutMs;
    for (;;) {
      const wrappers = this.visibleScoreDialogWrappers();
      if (wrappers.length === 0) return true;
      for (const wrapper of wrappers) {
        const close = wrapper.querySelector<HTMLElement>(
          ".el-dialog__headerbtn, [aria-label='Close'], [aria-label='关闭']",
        );
        (close ?? wrapper).click();
      }
      try {
        this.#document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      } catch {
        // Some documents under test do not implement dispatchEvent.
      }
      if (performance.now() >= deadline)
        return this.visibleScoreDialogWrappers().length === 0;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
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

  /*
   * The site's audio element is usually hidden (no controls attribute), so
   * this deliberately skips visibility checks. Direct element control is what
   * removes the site player's start-up delay.
   */
  siteAudioElements(): HTMLAudioElement[] {
    return Array.from(this.#document.querySelectorAll("audio"));
  }

  /*
   * Cheap question-identity read for latency-critical paths (audio). Only
   * the explicit id attributes are consulted — no full-page position scan —
   * and ambiguity degrades to null instead of throwing.
   */
  audioBridgeState(): BridgeAudioState | null {
    return this.#audioBridge.state();
  }

  audioBridgeCommand(op: BridgeCommand): void {
    this.#audioBridge.command(op);
  }

  onAudioBridgeState(listener: (state: BridgeAudioState) => void): () => void {
    return this.#audioBridge.onState(listener);
  }

  readQuestionIdFast(): string | null {
    const ids = Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        "[data-question-id]:not(option), [data-exercise-id]:not(option)",
      ),
    )
      .filter(isVisible)
      .filter(outsideTransientOverlays)
      .map((element) =>
        parseQuestionId(
          element.dataset.questionId ??
            element.dataset.exerciseId ??
            element.textContent ??
            "",
        ),
      )
      .filter((value): value is string => value !== null);
    const unique = [...new Set(ids)];
    return unique.length === 1 ? (unique[0] ?? null) : null;
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
        isVisible(element) &&
        outsideTransientOverlays(element) &&
        matchesControlLabel(name, semanticLabel(element)),
    );
  }

  private audioToggleControl(action: "play" | "pause"): HTMLElement {
    const semanticControls = this.findControls(action);
    if (semanticControls.length > 0)
      return resolveUnique(semanticControls, `audio:${action}`);
    const toggles = Array.from(
      this.#document.querySelectorAll<HTMLElement>(".audio-pause-btn"),
    ).filter(isVisible);
    return resolveUnique(toggles, `audio:${action}`);
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
        "[data-question-id], [data-exercise-id], [aria-label], h1, h2, h3, h4, span, strong, b, label, li",
      ),
    )
      .filter(isVisible)
      .filter(outsideTransientOverlays);
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
    return [...this.explicitRevealNodes(), ...this.fireflyScoreAnswerNodes()];
  }

  private explicitRevealNodes(): HTMLElement[] {
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

  private explicitRevealSignature(): RevealSignature {
    const visibleNodes = this.explicitRevealNodes().filter(isVisible);
    return {
      visible: visibleNodes.length > 0,
      nodeCount: visibleNodes.length,
      textLength: visibleNodes.reduce(
        (sum, node) => sum + normalizeLabel(node.textContent).length,
        0,
      ),
    };
  }

  private fireflyScoreAnswerNodes(): HTMLElement[] {
    return Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        ".el-dialog__wrapper.ai-score pre",
      ),
    ).filter((node) => node.querySelector("span.oneword") !== null);
  }

  private visibleScoreDialogWrappers(): HTMLElement[] {
    return Array.from(
      this.#document.querySelectorAll<HTMLElement>(
        ".el-dialog__wrapper.ai-score",
      ),
    ).filter(isVisible);
  }

  private fireflyScoreAnswerState(): FireflyScoreAnswerState {
    const nodes = this.fireflyScoreAnswerNodes();
    const node = nodes.length === 1 ? (nodes[0] ?? null) : null;
    return {
      candidateCount: nodes.length,
      node,
      visible: node ? isVisible(node) : false,
      fingerprint: node ? answerFingerprint(node) : null,
    };
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

  private bindExplicitRevealProof(
    expected: QuestionIdentity,
    operationToken: string,
    source: RevealedAnswerProof["source"],
  ): RevealedAnswerProof {
    const identity = this.readIdentity();
    if (!sameQuestionIdentity(identity, expected))
      throw new Error(`${source}:question-changed`);
    const node = resolveUnique(
      this.explicitRevealNodes().filter(isVisible),
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
    this.#activeRevealBinding = {
      kind: "explicit",
      proof,
      node,
      signature,
    };
    return proof;
  }

  private bindCausalFireflyProof(
    expected: QuestionIdentity,
    operationToken: string,
    node: HTMLElement,
    fingerprint: string,
  ): RevealedAnswerProof {
    const identity = this.readIdentity();
    if (!sameQuestionIdentity(identity, expected))
      throw new Error("score:question-changed");
    const current = this.fireflyScoreAnswerState();
    if (
      current.candidateCount !== 1 ||
      !current.visible ||
      current.node !== node ||
      current.fingerprint !== fingerprint
    ) {
      throw new Error("answer:causal-reveal-changed");
    }
    const signature = this.revealSignature();
    const proof = Object.freeze({
      predictionEdition: identity.predictionEdition,
      questionId: identity.questionId,
      position: identity.position,
      total: identity.total,
      operationToken,
      source: "score",
    }) satisfies RevealedAnswerProof;
    this.#activeRevealBinding = {
      kind: "firefly-score",
      proof,
      node,
      signature,
      fingerprint,
    };
    return proof;
  }

  private readPredictionEdition(expectedTotal: number): string {
    const explicitValues = Array.from(
      this.#document.querySelectorAll<HTMLElement>("[data-prediction-edition]"),
    )
      .filter(isVisible)
      .filter(outsideTransientOverlays)
      .map((element) => element.dataset.predictionEdition ?? "");
    const headingTexts = Array.from(
      this.#document.querySelectorAll<HTMLElement>("h1, h2, h3, h4"),
    )
      .filter(isVisible)
      .filter(outsideTransientOverlays)
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
      .filter(outsideTransientOverlays)
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

function answerFingerprint(node: HTMLElement): string | null {
  const answer = normalizeLabel(node.textContent);
  return answer.length > 0 ? fnv1a64(answer) : null;
}

function readDialogTranslation(answerNode: HTMLElement): string | null {
  try {
    const body = answerNode.closest(".el-dialog__body");
    if (!body) return null;
    const label = Array.from(body.querySelectorAll("h1, h2, h3, h4, h5")).find(
      (heading) =>
        /^(?:译文|translation)$/iu.test(normalizeLabel(heading.textContent)),
    );
    const text = label?.nextElementSibling?.textContent?.trim() ?? "";
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
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
