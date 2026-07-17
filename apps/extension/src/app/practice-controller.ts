import type {
  AttemptEvent,
  IndexedQuestion as ContractIndexedQuestion,
  IndexSnapshot as ContractIndexSnapshot,
  QuestionRef,
  RuntimeFault,
  UserSettings,
  WordStatSummary,
} from "@pte-pilot/contracts";
import type {
  AdapterDiagnostic,
  IndexedQuestion,
  IndexSnapshot,
  PracticeMode,
  PracticePhase,
  ProbeResult,
  QuestionIdentity,
  ReviewResult,
} from "../domain/types";
import { AnswerGate } from "../firefly/answer-gate";
import { AudioBroker, type AudioSnapshot } from "../firefly/audio-broker";
import {
  FireflyDomAdapter,
  isVerifiedQuestionSetEdition,
} from "../firefly/dom-adapter";
import { NavigationCoordinator } from "../firefly/navigation-coordinator";
import {
  PredictionEditionBootstrap,
  type PredictionEditionBootstrapResult,
} from "../firefly/prediction-edition-bootstrap";
import {
  type IndexCheckpointPort,
  QuestionIndexer,
} from "../firefly/question-indexer";
import { rankLocally } from "../learning/ranking";
import { queuePosition, stepQueue } from "../learning/review-queue";
import { RuntimeClient } from "../runtime/runtime-client";
import { DEFAULT_ALT_KEYMAP, isValidKeymap } from "./keyboard";

export interface RankedReviewEntry {
  questionId: string;
  attempted: boolean;
  wrong: boolean;
  due: boolean;
  marked: boolean;
}

export interface CockpitViewState {
  phase: PracticePhase;
  mode: PracticeMode;
  identity: QuestionIdentity | null;
  draft: string;
  review: ReviewResult | null;
  audioStatus: string;
  indexStatus: string;
  siteStatus: string;
  notice: string;
  marked: boolean;
  words: WordStatSummary[];
  rankedEntries: RankedReviewEntry[];
  reviewQueue: { position: number; total: number } | null;
  keymap: Record<string, string>;
  fault: RuntimeFault | null;
}

export interface ControllerOperationContext {
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
  navigationEpoch: number;
  initializeGeneration: number;
}

const NAVIGABLE_PHASES = new Set<PracticePhase>([
  "ANSWERING",
  "REVIEW",
  "COMMAND",
  "DESYNC",
]);

export function canNavigateFromPhase(phase: PracticePhase): boolean {
  return NAVIGABLE_PHASES.has(phase);
}

export function isSameControllerOperation(
  captured: ControllerOperationContext,
  current: {
    predictionEdition: string | undefined;
    questionId: string | undefined;
    position: number | undefined;
    total: number | undefined;
    navigationEpoch: number;
    initializeGeneration: number;
  },
): boolean {
  return (
    captured.predictionEdition === current.predictionEdition &&
    captured.questionId === current.questionId &&
    captured.position === current.position &&
    captured.total === current.total &&
    captured.navigationEpoch === current.navigationEpoch &&
    captured.initializeGeneration === current.initializeGeneration
  );
}

export async function runGuardedControllerOperation(options: {
  run: () => Promise<void>;
  isCurrent: () => boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}): Promise<void> {
  try {
    await options.run();
    if (options.isCurrent()) options.onSuccess();
  } catch (error) {
    if (options.isCurrent()) options.onError(error);
  }
}

export type PredictionEditionStartupMode = "verified" | "session" | "reject";

export function predictionEditionStartupMode(
  probe: ProbeResult,
): PredictionEditionStartupMode {
  if (probe.ok) return "verified";
  return probe.diagnostic.detail === "question:prediction-edition-unverified"
    ? "session"
    : "reject";
}

/*
 * The Firefly page re-renders in bursts (question switch, dialog close,
 * skeleton load). A missing or ambiguous control in that window is transient,
 * not a site change, so the initial probe deserves a short grace period
 * before failing closed. Auth failures and unverified editions are
 * deterministic and never retried.
 */
export function shouldRetryProbe(diagnostic: AdapterDiagnostic): boolean {
  return (
    diagnostic.code !== "AUTH_REQUIRED" &&
    diagnostic.detail !== "question:prediction-edition-unverified" &&
    /:(?:missing|ambiguous)$/u.test(diagnostic.detail)
  );
}

export function canPersistPredictionEdition(edition: string): boolean {
  return !["session:", "provisional:"].some((prefix) =>
    edition.startsWith(prefix),
  );
}

interface ControllerIndexCheckpoints extends IndexCheckpointPort {
  readonly snapshot: IndexSnapshot | null;
  isCompleteFor(identity: QuestionIdentity): boolean;
  hasCompleteEdition(predictionEdition: string, total: number): boolean;
}

export class PracticeController extends EventTarget {
  readonly #site: FireflyDomAdapter;
  readonly #runtime: RuntimeClient;
  readonly #draftProvider: () => string;
  #navigation: NavigationCoordinator | null = null;
  #answerGate: AnswerGate | null = null;
  #audio: AudioBroker | null = null;
  #indexer: QuestionIndexer | null = null;
  #checkpoints: ControllerIndexCheckpoints | null = null;
  #predictionBootstrap: PredictionEditionBootstrap | null = null;
  #sessionMode = false;
  readonly #sessionDrafts = new Map<string, string>();
  readonly #sessionMarks = new Map<string, boolean>();
  #settings: UserSettings = defaultSettings();
  #draftRevision = 0;
  #startedAt = performance.now();
  #replayCount = 0;
  #latestNavigationEpoch = 0;
  #audioCommandPending = false;
  #commandReturnPhase: "ANSWERING" | "REVIEW" = "ANSWERING";
  #initializeGeneration = 0;
  #rankRequestGeneration = 0;
  #sessionWriteChain: Promise<void> = Promise.resolve();
  #reviewQueue: string[] | null = null;
  #disposed = false;
  #state: CockpitViewState = {
    phase: "PROBING",
    mode: "practice",
    identity: null,
    draft: "",
    review: null,
    audioStatus: "EMPTY",
    indexStatus: "IDLE",
    siteStatus: "正在验证萤火虫页面",
    notice: "",
    marked: false,
    words: [],
    rankedEntries: [],
    reviewQueue: null,
    keymap: { ...DEFAULT_ALT_KEYMAP },
    fault: null,
  };

  constructor(
    draftProvider: () => string,
    document: Document = window.document,
  ) {
    super();
    this.#draftProvider = draftProvider;
    this.#site = new FireflyDomAdapter(document);
    this.#runtime = new RuntimeClient();
  }

  get state(): CockpitViewState {
    return this.#state;
  }

  async initialize(preflight?: Promise<unknown>): Promise<void> {
    const generation = ++this.#initializeGeneration;
    const cleanup = this.teardownActivePorts();
    this.#reviewQueue = null;
    this.patch({
      phase: "PROBING",
      siteStatus: "正在验证萤火虫页面",
      reviewQueue: null,
      fault: null,
    });
    await cleanup;
    if (!this.isCurrentInitialization(generation)) return;
    if (preflight) {
      await preflight;
      if (!this.isCurrentInitialization(generation)) return;
    }
    let probe = await this.probeWithGrace(generation);
    if (!this.isCurrentInitialization(generation)) return;
    if (predictionEditionStartupMode(probe) === "session") {
      this.#site.beginSessionPredictionEdition();
      probe = this.#site.probe();
    }
    if (!probe.ok) {
      const fault = diagnosticFault(
        probe.diagnostic.code,
        probe.diagnostic.detail,
      );
      this.patch({
        phase:
          probe.diagnostic.code === "AUTH_REQUIRED"
            ? "AUTH_REQUIRED"
            : "SITE_CHANGED",
        siteStatus: probe.diagnostic.detail,
        fault,
      });
      return;
    }
    const sessionMode = !canPersistPredictionEdition(
      probe.identity.predictionEdition,
    );
    this.#sessionMode = sessionMode;

    this.#navigation = new NavigationCoordinator(this.#site);
    this.#answerGate = new AnswerGate(this.#site);
    this.#answerGate.setNavigationEpoch(this.#navigation.epoch);
    this.#latestNavigationEpoch = this.#navigation.epoch;
    const audio = new AudioBroker(this.#site);
    this.#audio = audio;
    audio.addEventListener("statechange", (event) => {
      if (!this.isCurrentInitialization(generation) || this.#audio !== audio)
        return;
      this.patch({ audioStatus: (event as CustomEvent<string>).detail });
    });

    const checkpoints: ControllerIndexCheckpoints = sessionMode
      ? new SessionIndexCheckpoints()
      : new RuntimeIndexCheckpoints(this.#runtime);
    try {
      if (checkpoints instanceof RuntimeIndexCheckpoints)
        await checkpoints.hydrate(probe.identity.predictionEdition);
    } catch (error) {
      if (this.isCurrentInitialization(generation))
        this.fail("STORAGE_ERROR", "周预测索引保存失败", error);
      return;
    }
    if (
      !sessionMode &&
      checkpoints.hasCompleteEdition(
        probe.identity.predictionEdition,
        probe.identity.total,
      ) &&
      !checkpoints.isCompleteFor(probe.identity)
    ) {
      this.#site.invalidateVerifiedPredictionEdition(
        probe.identity.predictionEdition,
      );
      if (this.isCurrentInitialization(generation)) {
        this.patch({
          phase: "PROBING",
          indexStatus: "IDLE",
          notice: "周预测题集已变化，正在重新验证",
        });
        await this.initialize();
      }
      return;
    }
    if (!this.isCurrentInitialization(generation)) return;
    this.#checkpoints = checkpoints;
    this.#indexer = new QuestionIndexer(
      this.#site,
      this.#navigation,
      checkpoints,
    );
    this.#navigation.addEventListener("navigationstart", (event) => {
      if (!this.isCurrentInitialization(generation)) return;
      const { epoch } = (event as CustomEvent<{ epoch: number }>).detail;
      this.#latestNavigationEpoch = epoch;
      this.#answerGate?.setNavigationEpoch(epoch);
      this.#audio?.invalidate();
      this.patch({
        phase: "NAVIGATING",
        review: null,
        audioStatus: "EMPTY",
        siteStatus: "正在验证切题结果",
      });
    });
    this.#navigation.addEventListener("manualchange", (event) => {
      if (!this.isCurrentInitialization(generation)) return;
      const detail = (
        event as CustomEvent<{ identity: QuestionIdentity; epoch: number }>
      ).detail;
      const previousIdentity = this.#state.identity;
      if (
        previousIdentity &&
        (previousIdentity.predictionEdition !==
          detail.identity.predictionEdition ||
          previousIdentity.total !== detail.identity.total)
      ) {
        this.patch({
          phase: "PROBING",
          indexStatus: "IDLE",
          notice: "周预测题集已变化，正在重新验证",
        });
        void this.initialize(this.flushDraft().catch(() => undefined));
        return;
      }
      if (
        this.#state.indexStatus === "INDEXING" ||
        this.#state.indexStatus === "PAUSED"
      ) {
        this.#indexer?.cancel();
        this.patch({
          indexStatus: "PARTIAL",
          notice: "检测到原网页手动切题；索引已取消并正在恢复起始题",
        });
        return;
      }
      void this.acceptQuestion(detail.identity, detail.epoch, true);
    });

    const [settings, restored] = await Promise.all([
      this.#runtime.loadSettings().catch(() => null),
      sessionMode
        ? Promise.resolve(null)
        : this.#runtime.restoreSession().catch(() => null),
    ]);
    if (!this.isCurrentInitialization(generation)) return;
    const navigation = this.#navigation;
    if (!navigation) return;
    let activeIdentity = probe.identity;
    if (
      restored?.question &&
      restored.question.predictionEdition ===
        probe.identity.predictionEdition &&
      restored.question.total === probe.identity.total &&
      restored.question.questionId !== probe.identity.questionId
    ) {
      activeIdentity = await this.restoreQuestion(
        restored.question,
        navigation,
      ).catch(() => this.#site.readIdentity());
    }
    if (!this.isCurrentInitialization(generation)) return;
    const [draft, marked] = await Promise.all([
      this.safeLoadDraft(activeIdentity),
      this.readMarked(activeIdentity),
    ]);
    if (!this.isCurrentInitialization(generation)) return;
    const current = this.#site.readIdentity();
    if (
      current.questionId !== activeIdentity.questionId ||
      current.position !== activeIdentity.position ||
      current.predictionEdition !== activeIdentity.predictionEdition ||
      navigation.epoch !== this.#latestNavigationEpoch
    ) {
      this.patch({
        phase: "PROBING",
        siteStatus: "题目变化，正在重新同步",
        notice: "",
      });
      queueMicrotask(() => {
        if (this.isCurrentInitialization(generation)) void this.initialize();
      });
      return;
    }
    this.#settings = settings ? mergeSettings(settings) : defaultSettings();
    try {
      await this.persistSession(activeIdentity);
    } catch (error) {
      if (this.isCurrentInitialization(generation))
        this.fail("STORAGE_ERROR", "当前题会话保存失败", error);
      return;
    }
    if (!this.isCurrentInitialization(generation)) return;
    if (
      navigation.epoch !== this.#latestNavigationEpoch ||
      !this.isSiteAt(activeIdentity)
    )
      return;
    this.#audio.setMode(this.#settings.mode);
    this.#audio.bind(activeIdentity.questionId, navigation.epoch);
    this.patch({
      phase: "ANSWERING",
      mode: this.#settings.mode,
      keymap: { ...this.#settings.keymap },
      identity: activeIdentity,
      draft,
      marked,
      siteStatus: "已同步",
      audioStatus: "EMPTY",
      indexStatus: checkpoints.isCompleteFor(activeIdentity)
        ? "COMPLETE"
        : checkpoints.snapshot
          ? "PARTIAL"
          : "IDLE",
    });
    this.#startedAt = performance.now();
    if (!checkpoints.isCompleteFor(activeIdentity)) void this.discoverIndex();
  }

  async submit(): Promise<void> {
    if (
      this.#state.phase !== "ANSWERING" ||
      !this.#state.identity ||
      !this.#answerGate
    )
      return;
    const draft = this.#draftProvider().trim();
    if (!draft) {
      this.patch({ notice: "先输入听到的句子" });
      return;
    }
    const identity = this.#state.identity;
    const epoch = this.#latestNavigationEpoch;
    this.patch({ phase: "SUBMITTING", notice: "正在调用萤火虫评分" });
    try {
      const result = await this.#answerGate.submit(draft);
      if (
        result.context.questionId !== identity.questionId ||
        !this.isCurrentQuestion(identity, epoch)
      ) {
        throw new Error("submission:question-mismatch");
      }
      const review: ReviewResult = result.review;
      const attempt: AttemptEvent = {
        attemptId: crypto.randomUUID(),
        questionId: identity.questionId,
        accuracy: review.accuracy,
        durationMs: Math.max(
          0,
          Math.round(performance.now() - this.#startedAt),
        ),
        replayCount: this.#replayCount,
        errors: review.errors,
        completedAt: new Date().toISOString(),
      };
      if (canPersistPredictionEdition(identity.predictionEdition)) {
        await this.#runtime.commitAttempt(identity.predictionEdition, attempt);
      }
      if (!this.isCurrentQuestion(identity, epoch)) return;
      this.patch({
        phase: "REVIEW",
        review,
        notice: this.#sessionMode
          ? "本次结果仅保留在当前会话；完成索引后可保存本地记录"
          : review.errors.length
            ? "已记录错词"
            : "完全正确",
      });
    } catch (error) {
      if (!this.isCurrentQuestion(identity, epoch)) return;
      this.fail("DESYNC", "提交链路已暂停", error);
    }
  }

  async navigate(kind: "next" | "previous"): Promise<void> {
    const navigation = this.#navigation;
    const identity = this.#state.identity;
    const epoch = this.#latestNavigationEpoch;
    const generation = this.#initializeGeneration;
    if (!navigation || !identity || !canNavigateFromPhase(this.#state.phase)) {
      return;
    }
    // Wrong-question drive: next/previous walks the queue, not the site order.
    if (this.#reviewQueue) {
      const step = stepQueue(this.#reviewQueue, identity.questionId, kind);
      if (step.kind === "hold") {
        this.patch({ notice: "已经是错题集第一题" });
        return;
      }
      if (step.kind === "finished") {
        this.#reviewQueue = null;
        this.patch({
          reviewQueue: null,
          notice: "错题集刷完一轮；已恢复正常切题",
        });
        return;
      }
      await this.navigateToQuestion(step.questionId);
      return;
    }
    this.patch({ phase: "NAVIGATING", notice: "", siteStatus: "正在切题" });
    await this.flushDraft().catch(() => undefined);
    if (
      !this.isCurrentNavigationOperation(
        navigation,
        identity,
        identity,
        epoch,
        generation,
      )
    )
      return;
    try {
      const result = await navigation.navigate({ kind });
      if (
        !this.isCurrentNavigationOperation(
          navigation,
          identity,
          result.identity,
          result.epoch,
          generation,
        )
      )
        return;
      await this.acceptQuestion(result.identity, result.epoch, false);
    } catch (error) {
      if (this.shouldReportNavigationFailure(navigation, identity, generation))
        this.fail("DESYNC", "切题未被萤火虫确认", error);
    }
  }

  async navigateToQuestion(questionId: string): Promise<void> {
    const identity = this.#state.identity;
    const navigation = this.#navigation;
    const generation = this.#initializeGeneration;
    const initialEpoch = this.#latestNavigationEpoch;
    if (
      !identity ||
      !navigation ||
      !new Set(["ANSWERING", "REVIEW", "COMMAND"]).has(this.#state.phase)
    )
      return;
    if (!canPersistPredictionEdition(identity.predictionEdition)) {
      this.patch({ notice: "当前题集仅会话可用；请用上一题/下一题导航" });
      return;
    }
    const returnPhase =
      this.#state.phase === "REVIEW"
        ? "REVIEW"
        : this.#state.phase === "COMMAND"
          ? this.#commandReturnPhase
          : "ANSWERING";
    this.patch({ phase: "NAVIGATING", siteStatus: "正在读取复习索引" });
    let questions: ContractIndexedQuestion[];
    try {
      ({ questions } = await this.#runtime.loadIndexSnapshot(
        identity.predictionEdition,
      ));
    } catch {
      this.patch({ phase: returnPhase, notice: "读取复习索引失败" });
      return;
    }
    if (
      !this.isCurrentNavigationOperation(
        navigation,
        identity,
        identity,
        initialEpoch,
        generation,
      )
    )
      return;
    const target = questions.find(
      (question) => question.questionId === questionId,
    );
    if (!target) {
      this.patch({ phase: returnPhase, notice: "索引中没有该题" });
      return;
    }
    await this.flushDraft().catch(() => undefined);
    if (
      !this.isCurrentNavigationOperation(
        navigation,
        identity,
        identity,
        initialEpoch,
        generation,
      )
    )
      return;
    this.patch({ siteStatus: "正在跳转复习题" });
    try {
      let result:
        | Awaited<ReturnType<NavigationCoordinator["navigate"]>>
        | undefined;
      let expectedIdentity = identity;
      let expectedEpoch = initialEpoch;
      if (this.#site.capabilities().select) {
        result = await navigation.navigate({
          kind: "select",
          position: target.sitePosition,
          expectedQuestionId: target.questionId,
        });
        expectedIdentity = result.identity;
        expectedEpoch = result.epoch;
      } else {
        while (navigation.current.position !== target.sitePosition) {
          if (
            !this.isCurrentNavigationOperation(
              navigation,
              identity,
              expectedIdentity,
              expectedEpoch,
              generation,
            )
          )
            return;
          result = await navigation.navigate({
            kind:
              navigation.current.position < target.sitePosition
                ? "next"
                : "previous",
          });
          expectedIdentity = result.identity;
          expectedEpoch = result.epoch;
        }
      }
      const finalResult = result ?? {
        identity: navigation.current,
        epoch: navigation.epoch,
      };
      if (
        !this.isCurrentNavigationOperation(
          navigation,
          identity,
          finalResult.identity,
          finalResult.epoch,
          generation,
        )
      )
        return;
      if (finalResult.identity.questionId !== target.questionId)
        throw new Error("navigation:index-mismatch");
      await this.acceptQuestion(finalResult.identity, finalResult.epoch, false);
    } catch (error) {
      if (this.shouldReportNavigationFailure(navigation, identity, generation))
        this.fail("DESYNC", "索引跳转未被萤火虫确认", error);
    }
  }

  async redo(): Promise<void> {
    if (
      this.#state.phase !== "REVIEW" ||
      !this.#answerGate ||
      !this.#state.identity
    )
      return;
    const answerGate = this.#answerGate;
    const operation: ControllerOperationContext = {
      predictionEdition: this.#state.identity.predictionEdition,
      questionId: this.#state.identity.questionId,
      position: this.#state.identity.position,
      total: this.#state.identity.total,
      navigationEpoch: this.#latestNavigationEpoch,
      initializeGeneration: this.#initializeGeneration,
    };
    this.patch({ phase: "RESETTING", review: null, notice: "" });
    await runGuardedControllerOperation({
      run: () => answerGate.redo(),
      isCurrent: () => this.isCurrentRedo(operation, answerGate),
      onSuccess: () => {
        this.#replayCount = 0;
        this.#startedAt = performance.now();
        this.patch({
          phase: "ANSWERING",
          draft: "",
          review: null,
          notice: "已重置本题",
        });
      },
      onError: (error) => {
        this.fail("DESYNC", "重做未被萤火虫确认", error);
      },
    });
  }

  async play(): Promise<void> {
    const audio = this.#audio;
    const identity = this.#state.identity;
    const epoch = this.#latestNavigationEpoch;
    const generation = this.#initializeGeneration;
    if (!audio || !identity || this.#audioCommandPending) return;
    this.#audioCommandPending = true;
    try {
      await audio.play();
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      this.#replayCount += 1;
      this.patch({ notice: "" });
    } catch (error) {
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      const message = safeError(error);
      if (message === "audio:needs-gesture") {
        this.patch({ notice: "浏览器拦截了自动播放；按 Alt+P 或点击播放" });
        return;
      }
      if (message === "audio:not-ready") {
        this.patch({ notice: "音频尚未就绪；稍候一秒再按 Alt+P" });
        return;
      }
      this.patch({ audioStatus: "AUDIO_ERROR", notice: message });
    } finally {
      this.#audioCommandPending = false;
    }
  }

  audioSnapshot(): AudioSnapshot | null {
    return this.#audio?.snapshot() ?? null;
  }

  /*
   * Countdown-driven playback is best-effort convenience: whatever goes
   * wrong, it must degrade to a hint, never to AUDIO_ERROR. Manual play
   * keeps the strict error surface.
   */
  async autoPlayAudio(): Promise<void> {
    const audio = this.#audio;
    const identity = this.#state.identity;
    const epoch = this.#latestNavigationEpoch;
    const generation = this.#initializeGeneration;
    if (!audio || !identity || this.#audioCommandPending) return;
    this.#audioCommandPending = true;
    try {
      await audio.play();
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      this.#replayCount += 1;
      this.patch({ notice: "" });
    } catch {
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      this.patch({
        audioStatus:
          this.#state.audioStatus === "AUDIO_ERROR"
            ? "READY"
            : this.#state.audioStatus,
        notice: "自动播放未成功；按 Alt+P 或点击底部播放",
      });
    } finally {
      this.#audioCommandPending = false;
    }
  }

  async restartAudio(): Promise<void> {
    const audio = this.#audio;
    const identity = this.#state.identity;
    const epoch = this.#latestNavigationEpoch;
    const generation = this.#initializeGeneration;
    if (!audio || !identity || this.#audioCommandPending) return;
    this.#audioCommandPending = true;
    try {
      await audio.restart();
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      this.#replayCount += 1;
      this.patch({ notice: "" });
    } catch (error) {
      if (!this.isCurrentAudioOperation(audio, identity, epoch, generation))
        return;
      const message = safeError(error);
      if (message === "audio:needs-gesture") {
        this.patch({ notice: "浏览器拦截了自动播放；按 Alt+P 或点击播放" });
        return;
      }
      if (message === "audio:not-ready") {
        this.patch({ notice: "音频尚未就绪；稍候一秒再按 Alt+P" });
        return;
      }
      this.patch({ audioStatus: "AUDIO_ERROR", notice: message });
    } finally {
      this.#audioCommandPending = false;
    }
  }

  setCommand(open: boolean): void {
    if (
      open &&
      (this.#state.phase === "ANSWERING" || this.#state.phase === "REVIEW")
    ) {
      this.#rankRequestGeneration += 1;
      this.#commandReturnPhase = this.#state.phase;
      this.patch({ phase: "COMMAND" });
    } else if (!open && this.#state.phase === "COMMAND") {
      this.#rankRequestGeneration += 1;
      this.patch({ phase: this.#commandReturnPhase });
    }
  }

  async setMode(mode: PracticeMode): Promise<void> {
    this.#audio?.setMode(mode);
    this.#settings = {
      ...this.#settings,
      mode,
      updatedAt: new Date().toISOString(),
    };
    this.patch({
      mode,
      notice: mode === "exam" ? "考试模式：每题只允许一次成功播放" : "练习模式",
    });
    await this.#runtime.saveSettings(this.#settings).catch(() => undefined);
  }

  async saveKeymap(keymap: Record<string, string>): Promise<boolean> {
    const next = { ...DEFAULT_ALT_KEYMAP, ...keymap };
    if (!isValidKeymap(next)) return false;
    this.#settings = {
      ...this.#settings,
      keymap: next,
      updatedAt: new Date().toISOString(),
    };
    await this.#runtime.saveSettings(this.#settings);
    this.patch({ keymap: next, notice: "快捷键已保存" });
    return true;
  }

  async toggleMarked(): Promise<void> {
    const identity = this.#state.identity;
    if (!identity) return;
    const epoch = this.#latestNavigationEpoch;
    const marked = !this.#state.marked;
    if (canPersistPredictionEdition(identity.predictionEdition)) {
      await this.#runtime.setMarked(
        identity.predictionEdition,
        identity.questionId,
        marked,
      );
    } else {
      this.#sessionMarks.set(sessionQuestionKey(identity), marked);
    }
    if (!this.isCurrentQuestion(identity, epoch)) return;
    this.patch({ marked, notice: marked ? "已标记" : "已取消标记" });
  }

  async loadWords(): Promise<void> {
    this.patch({ words: await this.#runtime.listWordStats().catch(() => []) });
  }

  async loadRankedReview(): Promise<boolean> {
    const identity = this.#state.identity;
    if (!identity || this.#state.phase !== "COMMAND") return false;
    if (!canPersistPredictionEdition(identity.predictionEdition)) {
      this.patch({ notice: "完整索引后才能生成本地复习顺序" });
      return false;
    }
    const initializeGeneration = this.#initializeGeneration;
    const requestGeneration = ++this.#rankRequestGeneration;
    const isCurrent = () =>
      this.isCurrentInitialization(initializeGeneration) &&
      requestGeneration === this.#rankRequestGeneration &&
      this.#state.phase === "COMMAND" &&
      sameIdentity(this.#state.identity, identity);
    try {
      const { snapshot: indexSnapshot, questions } =
        await this.#runtime.loadIndexSnapshot(identity.predictionEdition);
      if (!isCurrent()) return false;
      if (!indexSnapshot || questions.length === 0) {
        this.patch({ notice: "题目索引尚未建立；先在命令层运行完整索引" });
        return false;
      }
      const allIds = questions.map((question) => question.questionId);
      const snapshot = await this.#runtime.getRankCandidates(
        identity.predictionEdition,
        allIds,
      );
      if (!isCurrent()) return false;
      const allCandidates = snapshot.candidates;
      const localOrder = rankLocally(allCandidates);
      const currentIndex = await this.#runtime.loadIndexSnapshot(
        identity.predictionEdition,
      );
      if (!isCurrent()) return false;
      const currentIds = currentIndex.questions.map(
        (question) => question.questionId,
      );
      if (currentIds.join("\u0000") !== allIds.join("\u0000")) return false;
      const candidatesById = new Map(
        allCandidates.map((candidate) => [candidate.questionId, candidate]),
      );
      const rankedEntries: RankedReviewEntry[] = localOrder.map(
        (questionId) => {
          const candidate = candidatesById.get(questionId);
          const attempted = (candidate?.attemptCount ?? 0) > 0;
          return {
            questionId,
            attempted,
            wrong: attempted && (candidate?.weaknessScore ?? 0) > 0,
            due: attempted && (candidate?.dueScore ?? 0) >= 0.5,
            marked: candidate?.marked ?? false,
          };
        },
      );
      this.patch({
        rankedEntries,
        notice:
          indexSnapshot.completeness === "complete"
            ? "本地复习顺序已生成"
            : "已按部分索引生成本地复习顺序；可稍后补全索引",
      });
      return true;
    } catch (error) {
      if (isCurrent())
        this.patch({ notice: `复习顺序生成失败：${safeError(error)}` });
      return false;
    }
  }

  /*
   * Wrong-question drive: pin next/previous to the given queue until the
   * round completes. Only meaningful on a verified set because it rides on
   * navigateToQuestion's index lookup.
   */
  async startWrongDrive(questionIds: string[]): Promise<boolean> {
    const identity = this.#state.identity;
    if (
      !identity ||
      this.#state.phase !== "COMMAND" ||
      !canPersistPredictionEdition(identity.predictionEdition) ||
      questionIds.length === 0
    ) {
      if (questionIds.length === 0) this.patch({ notice: "没有错题可刷" });
      return false;
    }
    this.#reviewQueue = [...questionIds];
    const position = queuePosition(this.#reviewQueue, identity.questionId);
    this.patch({
      reviewQueue: {
        position: position ?? 1,
        total: this.#reviewQueue.length,
      },
      notice: "错题循环开启；Enter/J 只在错题之间切换",
    });
    if (position !== null) {
      // Already on a wrong question: stay and leave the command layer.
      this.setCommand(false);
      return true;
    }
    const first = this.#reviewQueue[0];
    if (first) await this.navigateToQuestion(first);
    return true;
  }

  exitWrongDrive(): void {
    if (!this.#reviewQueue) return;
    this.#reviewQueue = null;
    this.patch({ reviewQueue: null, notice: "已退出错题循环" });
  }

  async buildFullIndex(): Promise<void> {
    if (this.#sessionMode) {
      await this.buildVerifiedIndexFromSession();
      return;
    }
    if (
      !this.#indexer ||
      !this.#navigation ||
      !this.#state.identity ||
      this.#state.phase !== "COMMAND"
    )
      return;
    const indexer = this.#indexer;
    const navigation = this.#navigation;
    const identity = this.#state.identity;
    const generation = this.#initializeGeneration;
    const isCurrent = () =>
      this.#indexer === indexer &&
      this.#navigation === navigation &&
      this.isCurrentInitialization(generation) &&
      this.#state.phase === "NAVIGATING" &&
      sameIdentity(this.#state.identity, identity);
    const traversal = indexer.controlledTraversal(this.flushDraft());
    this.patch({
      phase: "NAVIGATING",
      indexStatus: "INDEXING",
      notice: "索引时请勿操作原网页",
    });
    try {
      const snapshot = await traversal;
      if (!isCurrent()) return;
      const restored = this.#site.readIdentity();
      if (
        restored.predictionEdition !== identity.predictionEdition ||
        restored.total !== identity.total
      ) {
        void this.initialize(this.flushDraft().catch(() => undefined));
        return;
      }
      const failureReason = indexer.failureReason;
      this.patch({
        indexStatus:
          snapshot.completeness === "complete" ? "COMPLETE" : "PARTIAL",
      });
      await this.acceptQuestion(restored, navigation.epoch, false);
      if (
        !this.isCurrentInitialization(generation) ||
        !this.isCurrentQuestion(restored, navigation.epoch)
      )
        return;
      this.patch({
        notice:
          snapshot.completeness === "complete"
            ? `已索引 ${snapshot.siteTotal} 题`
            : failureReason
              ? `索引部分完成：${failureReason}`
              : "索引部分完成，可稍后继续",
      });
    } catch (error) {
      if (isCurrent()) {
        this.fail("DESYNC", "完整索引已暂停", error);
        this.patch({ indexStatus: "FAILED" });
      }
    }
  }

  pauseIndex(): void {
    if (this.#predictionBootstrap) {
      this.patch({ notice: "首次验证不能暂停；按 X 可取消并返回当前题" });
      return;
    }
    if (!this.#indexer?.pause()) return;
    this.patch({
      indexStatus: "PAUSED",
      notice: "索引已暂停；Enter/R 继续，X 取消并返回起始题",
    });
  }

  resumeIndex(): void {
    if (!this.#indexer?.resume()) return;
    this.patch({
      indexStatus: "INDEXING",
      notice: "索引继续；请勿操作原网页",
    });
  }

  cancelIndex(): void {
    if (this.#predictionBootstrap?.cancel()) {
      this.patch({
        indexStatus: "PARTIAL",
        notice: "正在取消完整验证并恢复当前题",
      });
      return;
    }
    if (!this.#indexer?.cancel()) return;
    this.patch({
      indexStatus: "PARTIAL",
      notice: "正在取消索引并恢复起始题",
    });
  }

  async flushDraft(): Promise<void> {
    const identity = this.#state.identity;
    if (!identity) return;
    if (!canPersistPredictionEdition(identity.predictionEdition)) {
      this.#sessionDrafts.set(
        sessionQuestionKey(identity),
        this.#draftProvider(),
      );
      return;
    }
    this.#draftRevision += 1;
    await this.#runtime.saveDraft({
      predictionEdition: identity.predictionEdition,
      questionId: identity.questionId,
      text: this.#draftProvider(),
      revision: this.#draftRevision,
      updatedAt: new Date().toISOString(),
    });
  }

  dispose(): void {
    this.#disposed = true;
    this.#initializeGeneration += 1;
    void this.teardownActivePorts();
  }

  private async restoreQuestion(
    question: QuestionRef,
    navigation: NavigationCoordinator,
  ): Promise<QuestionIdentity> {
    if (
      navigation.current.position === question.position &&
      navigation.current.questionId !== question.questionId
    ) {
      throw new Error("restore:stale-session");
    }
    if (this.#site.capabilities().select) {
      return (
        await navigation.navigate({
          kind: "select",
          position: question.position,
          expectedQuestionId: question.questionId,
        })
      ).identity;
    }
    while (navigation.current.position !== question.position) {
      await navigation.navigate({
        kind:
          navigation.current.position < question.position ? "next" : "previous",
      });
    }
    if (navigation.current.questionId !== question.questionId) {
      throw new Error("restore:question-mismatch");
    }
    return navigation.current;
  }

  private async buildVerifiedIndexFromSession(): Promise<void> {
    const identity = this.#state.identity;
    if (
      !identity ||
      // Reachable from the onboarding banner as well as the command layer.
      !(
        this.#state.phase === "ANSWERING" ||
        this.#state.phase === "REVIEW" ||
        this.#state.phase === "COMMAND"
      ) ||
      canPersistPredictionEdition(identity.predictionEdition)
    )
      return;
    const generation = this.#initializeGeneration;
    const sessionKey = sessionQuestionKey(identity);
    const sessionMarked = this.#sessionMarks.get(sessionKey) ?? false;
    await this.flushDraft().catch(() => undefined);
    const sessionDraft = this.#sessionDrafts.get(sessionKey) ?? "";
    if (!this.isCurrentInitialization(generation)) return;
    await this.teardownActivePorts();
    if (!this.isCurrentInitialization(generation)) return;

    const bootstrap = new PredictionEditionBootstrap(this.#site);
    this.#predictionBootstrap = bootstrap;
    bootstrap.addEventListener("progress", (event) => {
      if (
        !this.isCurrentInitialization(generation) ||
        this.#predictionBootstrap !== bootstrap
      )
        return;
      const { completed, total } = (
        event as CustomEvent<{ completed: number; total: number }>
      ).detail;
      this.patch({ notice: `正在验证并索引题集 ${completed}/${total}` });
    });
    this.patch({
      phase: "NAVIGATING",
      indexStatus: "INDEXING",
      siteStatus: "正在完整验证题集",
      notice: "这是唯一会遍历全部题目的操作；按 X 可取消",
    });

    let verifiedEdition: string | null = null;
    try {
      const result = await bootstrap.run();
      verifiedEdition = result.edition;
      if (
        !this.isCurrentInitialization(generation) ||
        this.#predictionBootstrap !== bootstrap
      )
        return;
      const checkpoints = new RuntimeIndexCheckpoints(this.#runtime);
      await checkpoints.adoptBootstrap(result);
      if (sessionDraft) {
        this.#draftRevision += 1;
        await this.#runtime
          .saveDraft({
            predictionEdition: result.edition,
            questionId: identity.questionId,
            text: sessionDraft,
            revision: this.#draftRevision,
            updatedAt: new Date().toISOString(),
          })
          .catch(() => undefined);
      }
      if (sessionMarked) {
        await this.#runtime
          .setMarked(result.edition, identity.questionId, true)
          .catch(() => undefined);
      }
      this.#sessionDrafts.clear();
      this.#sessionMarks.clear();
      this.#predictionBootstrap = null;
      await bootstrap.dispose();
      await this.initialize();
      if (!this.#disposed) {
        this.patch({
          indexStatus: "COMPLETE",
          notice: `已验证并索引 ${result.snapshot.siteTotal} 题；持久练习记录已启用`,
        });
      }
    } catch (error) {
      if (
        !this.isCurrentInitialization(generation) ||
        this.#predictionBootstrap !== bootstrap
      )
        return;
      this.#predictionBootstrap = null;
      await bootstrap.dispose();
      const message = safeError(error);
      if (verifiedEdition)
        this.#site.invalidateVerifiedPredictionEdition(verifiedEdition);
      await this.initialize();
      if (!this.#disposed) {
        const recoveredIdentity = this.#state.identity;
        if (
          recoveredIdentity &&
          !canPersistPredictionEdition(recoveredIdentity.predictionEdition)
        ) {
          const recoveredKey = sessionQuestionKey(recoveredIdentity);
          this.#sessionDrafts.set(recoveredKey, sessionDraft);
          this.#sessionMarks.set(recoveredKey, sessionMarked);
        }
        this.patch({
          indexStatus: "PARTIAL",
          draft: sessionDraft,
          marked: sessionMarked,
          notice: `完整验证未完成：${message}；已返回当前页会话`,
        });
      }
    }
  }

  private async acceptQuestion(
    identity: QuestionIdentity,
    epoch: number,
    manual: boolean,
  ): Promise<void> {
    const generation = this.#initializeGeneration;
    if (!this.isCurrentInitialization(generation)) return;
    if (
      this.#checkpoints?.hasCompleteEdition(
        identity.predictionEdition,
        identity.total,
      ) &&
      !this.#checkpoints.isCompleteFor(identity)
    ) {
      this.#site.invalidateVerifiedPredictionEdition(
        identity.predictionEdition,
      );
      this.patch({
        phase: "PROBING",
        indexStatus: "IDLE",
        notice: "检测到周预测题目变化，正在重新验证",
      });
      void this.initialize(this.flushDraft().catch(() => undefined));
      return;
    }
    if (epoch !== this.#latestNavigationEpoch) return;
    if (manual && this.#state.identity)
      await this.flushDraft().catch(() => undefined);
    if (!this.isCurrentInitialization(generation)) return;
    const [draft, marked] = await Promise.all([
      this.safeLoadDraft(identity),
      this.readMarked(identity),
    ]);
    if (
      !this.isCurrentInitialization(generation) ||
      epoch !== this.#latestNavigationEpoch
    )
      return;
    const current = this.#site.readIdentity();
    if (
      current.questionId !== identity.questionId ||
      current.position !== identity.position ||
      current.predictionEdition !== identity.predictionEdition
    )
      return;
    try {
      await this.persistSession(identity);
    } catch (error) {
      if (
        this.isCurrentInitialization(generation) &&
        epoch === this.#latestNavigationEpoch &&
        this.isSiteAt(identity)
      )
        this.fail("STORAGE_ERROR", "当前题会话保存失败", error);
      return;
    }
    if (
      !this.isCurrentInitialization(generation) ||
      epoch !== this.#latestNavigationEpoch ||
      !this.isSiteAt(identity)
    )
      return;
    this.#answerGate?.setNavigationEpoch(epoch);
    this.#audio?.bind(identity.questionId, epoch);
    this.#replayCount = 0;
    this.#startedAt = performance.now();
    this.patch({
      phase: "ANSWERING",
      identity,
      draft,
      marked,
      review: null,
      notice: manual ? "已跟随原网页切题" : "",
      siteStatus: "已同步",
      audioStatus: "EMPTY",
      reviewQueue: this.#reviewQueue
        ? {
            position:
              queuePosition(this.#reviewQueue, identity.questionId) ??
              this.#state.reviewQueue?.position ??
              1,
            total: this.#reviewQueue.length,
          }
        : null,
      fault: null,
    });
    if (this.#state.indexStatus !== "COMPLETE") {
      await this.#indexer?.learnCurrent().catch(() => undefined);
    }
  }

  private async readMarked(identity: QuestionIdentity): Promise<boolean> {
    if (!canPersistPredictionEdition(identity.predictionEdition))
      return this.#sessionMarks.get(sessionQuestionKey(identity)) ?? false;
    const snapshot = await this.#runtime
      .getRankCandidates(identity.predictionEdition, [identity.questionId])
      .catch(() => null);
    return snapshot?.candidates[0]?.marked ?? false;
  }

  private async persistSession(identity: QuestionIdentity): Promise<void> {
    if (!canPersistPredictionEdition(identity.predictionEdition)) return;
    const write = this.#sessionWriteChain
      .catch(() => undefined)
      .then(() => this.#runtime.saveSession(toQuestionRef(identity)));
    this.#sessionWriteChain = write;
    await write;
  }

  private async safeLoadDraft(identity: QuestionIdentity): Promise<string> {
    if (!canPersistPredictionEdition(identity.predictionEdition))
      return this.#sessionDrafts.get(sessionQuestionKey(identity)) ?? "";
    const checkpoint = await this.#runtime
      .loadDraft(identity.predictionEdition, identity.questionId)
      .catch(() => null);
    if (!checkpoint) return "";
    this.#draftRevision = Math.max(this.#draftRevision, checkpoint.revision);
    return checkpoint.text;
  }

  private async discoverIndex(): Promise<void> {
    const indexer = this.#indexer;
    const generation = this.#initializeGeneration;
    if (!indexer) return;
    this.patch({ indexStatus: "DISCOVERING" });
    try {
      const snapshot = await indexer.discover();
      if (
        this.#indexer !== indexer ||
        !this.isCurrentInitialization(generation)
      )
        return;
      this.patch({
        indexStatus:
          snapshot.completeness === "complete" ? "COMPLETE" : "PARTIAL",
      });
    } catch {
      if (this.#indexer === indexer && this.isCurrentInitialization(generation))
        this.patch({ indexStatus: "FAILED" });
    }
  }

  private async probeWithGrace(generation: number): Promise<ProbeResult> {
    const deadline = performance.now() + 2_500;
    let probe = this.#site.probe();
    while (
      !probe.ok &&
      shouldRetryProbe(probe.diagnostic) &&
      performance.now() < deadline &&
      this.isCurrentInitialization(generation)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (!this.isCurrentInitialization(generation)) return probe;
      probe = this.#site.probe();
    }
    return probe;
  }

  private isCurrentInitialization(generation: number): boolean {
    return !this.#disposed && generation === this.#initializeGeneration;
  }

  private isCurrentAudioOperation(
    audio: AudioBroker,
    identity: QuestionIdentity,
    epoch: number,
    generation: number,
  ): boolean {
    return (
      this.#audio === audio &&
      this.isCurrentInitialization(generation) &&
      this.isCurrentQuestion(identity, epoch)
    );
  }

  private isCurrentNavigationOperation(
    navigation: NavigationCoordinator,
    capturedIdentity: QuestionIdentity,
    expectedSiteIdentity: QuestionIdentity,
    expectedEpoch: number,
    generation: number,
  ): boolean {
    if (
      this.#navigation !== navigation ||
      !this.isCurrentInitialization(generation) ||
      this.#state.phase !== "NAVIGATING" ||
      this.#latestNavigationEpoch !== expectedEpoch ||
      !sameIdentity(this.#state.identity, capturedIdentity)
    )
      return false;
    try {
      return sameIdentity(this.#site.readIdentity(), expectedSiteIdentity);
    } catch {
      return false;
    }
  }

  private isSiteAt(identity: QuestionIdentity): boolean {
    try {
      return sameIdentity(this.#site.readIdentity(), identity);
    } catch {
      return false;
    }
  }

  private shouldReportNavigationFailure(
    navigation: NavigationCoordinator,
    capturedIdentity: QuestionIdentity,
    generation: number,
  ): boolean {
    return (
      this.#navigation === navigation &&
      this.isCurrentInitialization(generation) &&
      this.#state.phase === "NAVIGATING" &&
      sameIdentity(this.#state.identity, capturedIdentity)
    );
  }

  private isCurrentQuestion(
    identity: QuestionIdentity,
    epoch: number,
  ): boolean {
    return (
      !this.#disposed &&
      epoch === this.#latestNavigationEpoch &&
      sameIdentity(this.#state.identity, identity) &&
      this.isSiteAt(identity)
    );
  }

  private isCurrentRedo(
    captured: ControllerOperationContext,
    answerGate: AnswerGate,
  ): boolean {
    if (
      this.#disposed ||
      this.#state.phase !== "RESETTING" ||
      this.#answerGate !== answerGate ||
      !isSameControllerOperation(captured, {
        predictionEdition: this.#state.identity?.predictionEdition,
        questionId: this.#state.identity?.questionId,
        position: this.#state.identity?.position,
        total: this.#state.identity?.total,
        navigationEpoch: this.#latestNavigationEpoch,
        initializeGeneration: this.#initializeGeneration,
      })
    )
      return false;
    try {
      const siteIdentity = this.#site.readIdentity();
      return isSameControllerOperation(captured, {
        predictionEdition: siteIdentity.predictionEdition,
        questionId: siteIdentity.questionId,
        position: siteIdentity.position,
        total: siteIdentity.total,
        navigationEpoch: this.#latestNavigationEpoch,
        initializeGeneration: this.#initializeGeneration,
      });
    } catch {
      return false;
    }
  }

  private async teardownActivePorts(): Promise<void> {
    const bootstrap = this.#predictionBootstrap;
    this.#predictionBootstrap = null;
    this.#indexer?.cancel();
    this.#navigation?.dispose();
    this.#audio?.dispose();
    this.#navigation = null;
    this.#answerGate = null;
    this.#audio = null;
    this.#indexer = null;
    this.#checkpoints = null;
    if (bootstrap) await bootstrap.dispose();
  }

  private fail(code: string, siteStatus: string, error: unknown): void {
    const message = safeError(error);
    this.patch({
      phase: "DESYNC",
      siteStatus,
      notice: message,
      fault: diagnosticFault(code, message),
    });
  }

  private patch(change: Partial<CockpitViewState>): void {
    this.#state = { ...this.#state, ...change };
    this.dispatchEvent(new CustomEvent("statechange", { detail: this.#state }));
  }
}

export class SessionIndexCheckpoints implements ControllerIndexCheckpoints {
  readonly #questions = new Map<number, IndexedQuestion>();
  #snapshot: IndexSnapshot | null = null;

  get snapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeSnapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeQuestions(): IndexedQuestion[] {
    return [...this.#questions.values()].sort(
      (left, right) => left.sitePosition - right.sitePosition,
    );
  }

  isCompleteFor(identity: QuestionIdentity): boolean {
    return (
      this.hasCompleteEdition(identity.predictionEdition, identity.total) &&
      this.#questions.get(identity.position)?.questionId === identity.questionId
    );
  }

  hasCompleteEdition(predictionEdition: string, total: number): boolean {
    return (
      this.#snapshot?.completeness === "complete" &&
      this.#snapshot.predictionEdition === predictionEdition &&
      this.#snapshot.siteTotal === total
    );
  }

  async saveQuestion(question: IndexedQuestion): Promise<void> {
    this.#questions.set(question.sitePosition, question);
  }

  async saveSnapshot(snapshot: IndexSnapshot): Promise<void> {
    const questions = this.resumeQuestions().filter(
      (question) =>
        question.predictionEdition === snapshot.predictionEdition &&
        question.siteTotal === snapshot.siteTotal,
    );
    const complete =
      snapshot.completeness === "complete" &&
      questions.length === snapshot.siteTotal &&
      questions.every((question, index) => question.sitePosition === index + 1);
    this.#snapshot = {
      ...snapshot,
      orderedQuestionIds: questions.map((question) => question.questionId),
      completeness: complete ? "complete" : "partial",
    };
  }
}

export class RuntimeIndexCheckpoints implements ControllerIndexCheckpoints {
  readonly #runtime: RuntimeClient;
  readonly #questions = new Map<string, IndexedQuestion>();
  #snapshot: IndexSnapshot | null = null;

  constructor(runtime: RuntimeClient) {
    this.#runtime = runtime;
  }

  get snapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeSnapshot(): IndexSnapshot | null {
    return this.#snapshot;
  }

  resumeQuestions(): IndexedQuestion[] {
    if (!this.#snapshot) return [];
    return [...this.#questions.values()].filter(
      (question) =>
        question.predictionEdition === this.#snapshot?.predictionEdition &&
        question.siteTotal === this.#snapshot.siteTotal,
    );
  }

  isCompleteFor(identity: QuestionIdentity): boolean {
    if (
      this.#snapshot?.completeness !== "complete" ||
      this.#snapshot.predictionEdition !== identity.predictionEdition ||
      this.#snapshot.siteTotal !== identity.total
    )
      return false;
    const atPosition = [...this.#questions.values()].find(
      (question) =>
        question.predictionEdition === identity.predictionEdition &&
        question.sitePosition === identity.position,
    );
    return atPosition?.questionId === identity.questionId;
  }

  hasCompleteEdition(predictionEdition: string, total: number): boolean {
    return (
      this.#snapshot?.completeness === "complete" &&
      this.#snapshot.predictionEdition === predictionEdition &&
      this.#snapshot.siteTotal === total
    );
  }

  async adoptBootstrap(
    result: PredictionEditionBootstrapResult,
  ): Promise<void> {
    if (
      !isVerifiedQuestionSetEdition(
        result.edition,
        result.snapshot.siteTotal,
      ) ||
      result.snapshot.predictionEdition !== result.edition ||
      result.snapshot.completeness !== "complete" ||
      result.questions.length !== result.snapshot.siteTotal ||
      result.questions.some(
        (question, index) =>
          question.predictionEdition !== result.edition ||
          question.siteTotal !== result.snapshot.siteTotal ||
          question.sitePosition !== index + 1 ||
          question.questionId !== result.snapshot.orderedQuestionIds[index],
      )
    ) {
      throw new Error("index:invalid-bootstrap-result");
    }
    this.#questions.clear();
    this.#snapshot = null;
    for (const question of result.questions) {
      this.#questions.set(
        `${question.predictionEdition}:${question.questionId}`,
        question,
      );
    }
    await this.saveSnapshot(result.snapshot);
  }

  async hydrate(predictionEdition: string): Promise<void> {
    const { snapshot, questions } = await this.#runtime
      .loadIndexSnapshot(predictionEdition)
      .catch(() => ({
        snapshot: null,
        questions: [],
      }));
    this.#snapshot = snapshot as IndexSnapshot | null;
    for (const question of questions) {
      this.#questions.set(
        `${question.predictionEdition}:${question.questionId}`,
        question,
      );
    }
  }

  async saveQuestion(question: IndexedQuestion): Promise<void> {
    for (const [key, existing] of this.#questions) {
      if (
        existing.predictionEdition === question.predictionEdition &&
        existing.sitePosition === question.sitePosition &&
        existing.questionId !== question.questionId
      )
        this.#questions.delete(key);
    }
    this.#questions.set(
      `${question.predictionEdition}:${question.questionId}`,
      question,
    );
  }

  async saveSnapshot(snapshot: IndexSnapshot): Promise<void> {
    const previous = this.#snapshot;
    const preserveComplete =
      snapshot.completeness === "partial" &&
      previous?.completeness === "complete" &&
      previous.predictionEdition === snapshot.predictionEdition &&
      previous.siteTotal === snapshot.siteTotal &&
      previous.orderedQuestionIds.every((questionId, index) =>
        [...this.#questions.values()].some(
          (question) =>
            question.predictionEdition === snapshot.predictionEdition &&
            question.questionId === questionId &&
            question.sitePosition === index + 1,
        ),
      );
    const targetSnapshot = preserveComplete ? previous : snapshot;
    const completeIds =
      targetSnapshot.completeness === "complete"
        ? new Set(targetSnapshot.orderedQuestionIds)
        : null;
    const questions = [...this.#questions.values()]
      .filter(
        (question) =>
          question.predictionEdition === targetSnapshot.predictionEdition &&
          (!completeIds || completeIds.has(question.questionId)),
      )
      .sort((left, right) => left.sitePosition - right.sitePosition);
    const complete =
      targetSnapshot.completeness === "complete" &&
      questions.length === targetSnapshot.siteTotal &&
      questions.every((question, index) => question.sitePosition === index + 1);
    const merged: IndexSnapshot = {
      ...targetSnapshot,
      orderedQuestionIds: questions.map((question) => question.questionId),
      completeness: complete ? "complete" : "partial",
    };
    this.#snapshot = merged;
    await this.#runtime.saveIndexSnapshot(
      merged as ContractIndexSnapshot,
      questions as ContractIndexedQuestion[],
    );
  }
}

function sameIdentity(
  left: QuestionIdentity | null,
  right: QuestionIdentity,
): boolean {
  return (
    left?.predictionEdition === right.predictionEdition &&
    left.questionId === right.questionId &&
    left.position === right.position &&
    left.total === right.total
  );
}

function sessionQuestionKey(identity: QuestionIdentity): string {
  return `${identity.predictionEdition}:${identity.questionId}`;
}

function defaultSettings(): UserSettings {
  return {
    id: "current",
    mode: "practice",
    audioStrategy: "site-player-only",
    keymap: { ...DEFAULT_ALT_KEYMAP },
    updatedAt: new Date().toISOString(),
  };
}

function mergeSettings(settings: UserSettings): UserSettings {
  return { ...settings, keymap: { ...DEFAULT_ALT_KEYMAP, ...settings.keymap } };
}

function toQuestionRef(identity: QuestionIdentity): {
  predictionEdition: string;
  questionId: string;
  position: number;
  total: number;
} {
  return {
    predictionEdition: identity.predictionEdition,
    questionId: identity.questionId,
    position: identity.position,
    total: identity.total,
  };
}

function diagnosticFault(code: string, message: string): RuntimeFault {
  const mapped = new Set([
    "AUTH_REQUIRED",
    "SITE_CHANGED",
    "DESYNC",
    "AUDIO_ERROR",
    "INDEX_PARTIAL",
    "STORAGE_ERROR",
  ]).has(code)
    ? (code as RuntimeFault["code"])
    : "SITE_CHANGED";
  return { code: mapped, message, recoverable: true };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "未知错误";
}
