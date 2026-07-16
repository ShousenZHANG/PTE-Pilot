import type {
  AttemptEvent,
  IndexedQuestion as ContractIndexedQuestion,
  IndexSnapshot as ContractIndexSnapshot,
  QuestionRef,
  RankCandidate,
  RuntimeFault,
  UserSettings,
  WordStatSummary,
} from "@pte-pilot/contracts";
import type {
  IndexedQuestion,
  IndexSnapshot,
  PracticeMode,
  PracticePhase,
  ProbeResult,
  QuestionIdentity,
  ReviewResult,
} from "../domain/types";
import { AnswerGate } from "../firefly/answer-gate";
import { AudioBroker } from "../firefly/audio-broker";
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
import {
  createRankRequest,
  rankLocally,
  rankWithGatewayFallback,
} from "../learning/ranking";
import { RuntimeClient } from "../runtime/runtime-client";
import { DEFAULT_ALT_KEYMAP, isValidKeymap } from "./keyboard";

export interface CockpitViewState {
  phase: PracticePhase;
  mode: PracticeMode;
  identity: QuestionIdentity | null;
  draft: string;
  review: ReviewResult | null;
  audioStatus: string;
  indexStatus: string;
  siteStatus: string;
  hermesStatus: string;
  notice: string;
  marked: boolean;
  words: WordStatSummary[];
  rankedQuestionIds: string[];
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

export function shouldBootstrapPredictionEdition(probe: ProbeResult): boolean {
  return (
    !probe.ok &&
    probe.diagnostic.detail === "question:prediction-edition-unverified"
  );
}

export class PracticeController extends EventTarget {
  readonly #site: FireflyDomAdapter;
  readonly #runtime: RuntimeClient;
  readonly #draftProvider: () => string;
  #navigation: NavigationCoordinator | null = null;
  #answerGate: AnswerGate | null = null;
  #audio: AudioBroker | null = null;
  #indexer: QuestionIndexer | null = null;
  #checkpoints: RuntimeIndexCheckpoints | null = null;
  #predictionBootstrap: PredictionEditionBootstrap | null = null;
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
    hermesStatus: "离线可用",
    notice: "",
    marked: false,
    words: [],
    rankedQuestionIds: [],
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
    this.patch({
      phase: "PROBING",
      siteStatus: "正在验证萤火虫页面",
      fault: null,
    });
    await cleanup;
    if (!this.isCurrentInitialization(generation)) return;
    if (preflight) {
      await preflight;
      if (!this.isCurrentInitialization(generation)) return;
    }
    let probe = this.#site.probe();
    let bootstrapResult: PredictionEditionBootstrapResult | null = null;
    if (shouldBootstrapPredictionEdition(probe)) {
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
        this.patch({ notice: `正在验证周预测题集 ${completed}/${total}` });
      });
      this.patch({
        phase: "PROBING",
        indexStatus: "DISCOVERING",
        siteStatus: "首次验证周预测题集",
        notice: "正在依次读取周预测题号；完成后自动恢复当前题",
      });
      try {
        bootstrapResult = await bootstrap.run();
      } catch (error) {
        if (
          !this.isCurrentInitialization(generation) ||
          this.#predictionBootstrap !== bootstrap
        )
          return;
        this.#predictionBootstrap = null;
        await bootstrap.dispose();
        const message = safeError(error);
        this.patch({
          phase: "SITE_CHANGED",
          indexStatus: "FAILED",
          siteStatus: "周预测题集验证失败",
          notice: message,
          fault: diagnosticFault("SITE_CHANGED", message),
        });
        return;
      }
      if (this.#predictionBootstrap === bootstrap)
        this.#predictionBootstrap = null;
      await bootstrap.dispose();
      if (!this.isCurrentInitialization(generation)) return;
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

    this.#navigation = new NavigationCoordinator(this.#site);
    this.#answerGate = new AnswerGate(this.#site);
    this.#answerGate.setNavigationEpoch(this.#navigation.epoch);
    this.#latestNavigationEpoch = this.#navigation.epoch;
    const audio = new AudioBroker(this.#site, {
      begin: (binding) => this.#runtime.beginAudioCapture(binding),
      cancel: (binding) => this.#runtime.cancelAudioCapture(binding),
    });
    this.#audio = audio;
    audio.addEventListener("statechange", (event) => {
      if (!this.isCurrentInitialization(generation) || this.#audio !== audio)
        return;
      this.patch({ audioStatus: (event as CustomEvent<string>).detail });
    });

    const checkpoints = new RuntimeIndexCheckpoints(this.#runtime);
    try {
      if (bootstrapResult) await checkpoints.adoptBootstrap(bootstrapResult);
      else await checkpoints.hydrate(probe.identity.predictionEdition);
    } catch (error) {
      if (this.isCurrentInitialization(generation))
        this.fail("STORAGE_ERROR", "周预测索引保存失败", error);
      return;
    }
    if (
      !bootstrapResult &&
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
      this.#runtime.restoreSession().catch(() => null),
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
      hermesStatus: "Hermes 检查中，本地练习可用",
      audioStatus: "EMPTY",
      indexStatus: checkpoints.isCompleteFor(activeIdentity)
        ? "COMPLETE"
        : checkpoints.snapshot
          ? "PARTIAL"
          : "IDLE",
    });
    this.#startedAt = performance.now();
    void this.#runtime.gatewayHealth().then((health) => {
      if (!this.isCurrentInitialization(generation)) return;
      this.patch({
        hermesStatus:
          health?.hermes.status === "ready"
            ? "Hermes 已连接"
            : "Hermes 离线，本地练习可用",
      });
    });
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
      await this.#runtime.commitAttempt(identity.predictionEdition, attempt);
      if (!this.isCurrentQuestion(identity, epoch)) return;
      this.patch({
        phase: "REVIEW",
        review,
        notice: review.errors.length ? "已记录错词" : "完全正确",
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
    if (
      !navigation ||
      !identity ||
      !new Set(["ANSWERING", "REVIEW", "COMMAND"]).has(this.#state.phase)
    ) {
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
      this.patch({ audioStatus: "AUDIO_ERROR", notice: safeError(error) });
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
      this.patch({ audioStatus: "AUDIO_ERROR", notice: safeError(error) });
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

  async pairGateway(pairingCode: string): Promise<boolean> {
    try {
      const health = await this.#runtime.pairGateway(
        pairingCode.trim().toUpperCase(),
      );
      this.patch({
        hermesStatus:
          health.hermes.status === "ready"
            ? "Hermes 已连接"
            : "Gateway 已配对，Hermes 离线",
        notice: "Gateway 配对成功",
      });
      return true;
    } catch {
      this.patch({ notice: "配对失败；确认本机 Gateway 与配对码" });
      return false;
    }
  }

  async syncGateway(): Promise<void> {
    try {
      const result = await this.#runtime.syncGateway();
      this.patch({
        notice: `记忆同步：确认 ${result.acknowledged}，待发 ${result.pending}`,
      });
    } catch {
      this.patch({ notice: "Gateway 离线；本地练习不受影响" });
    }
  }

  async toggleMarked(): Promise<void> {
    const identity = this.#state.identity;
    if (!identity) return;
    const epoch = this.#latestNavigationEpoch;
    const marked = !this.#state.marked;
    await this.#runtime.setMarked(
      identity.predictionEdition,
      identity.questionId,
      marked,
    );
    if (!this.isCurrentQuestion(identity, epoch)) return;
    this.patch({ marked, notice: marked ? "已标记" : "已取消标记" });
  }

  async loadWords(): Promise<void> {
    this.patch({ words: await this.#runtime.listWordStats().catch(() => []) });
  }

  async loadRankedReview(): Promise<boolean> {
    const identity = this.#state.identity;
    if (!identity || this.#state.phase !== "COMMAND") return false;
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
      const candidatesById = new Map(
        allCandidates.map((candidate) => [candidate.questionId, candidate]),
      );
      const boundedCandidates = localOrder
        .slice(0, 100)
        .map((questionId) => candidatesById.get(questionId))
        .filter(
          (candidate): candidate is RankCandidate => candidate !== undefined,
        );
      const request = await createRankRequest(
        boundedCandidates,
        snapshot.learnerStateVersion,
      );
      if (!isCurrent()) return false;
      const readCurrentState = async () => {
        const [currentFacts, currentIndex] = await Promise.all([
          this.#runtime.getRankCandidates(
            identity.predictionEdition,
            boundedCandidates.map((candidate) => candidate.questionId),
          ),
          this.#runtime.loadIndexSnapshot(identity.predictionEdition),
        ]);
        const currentIds = currentIndex.questions.map(
          (question) => question.questionId,
        );
        return {
          learnerStateVersion: currentFacts.learnerStateVersion,
          sameIndex: currentIds.join("\u0000") === allIds.join("\u0000"),
        };
      };
      const rankedTop = await rankWithGatewayFallback(
        {
          rank: (rankRequest) =>
            this.#runtime.rank(identity.predictionEdition, rankRequest),
        },
        request,
        undefined,
        async () => {
          const current = await readCurrentState();
          return current.sameIndex
            ? current.learnerStateVersion
            : request.learnerStateVersion + 1;
        },
      );
      if (!isCurrent()) return false;
      const current = await readCurrentState();
      if (
        !isCurrent() ||
        !current.sameIndex ||
        current.learnerStateVersion !== request.learnerStateVersion
      )
        return false;
      const rankedSet = new Set(rankedTop);
      this.patch({
        rankedQuestionIds: [
          ...rankedTop,
          ...localOrder.filter((questionId) => !rankedSet.has(questionId)),
        ],
        notice:
          indexSnapshot.completeness === "complete"
            ? "复习顺序已生成"
            : "已按部分索引生成复习顺序；可稍后补全索引",
      });
      return true;
    } catch (error) {
      if (isCurrent())
        this.patch({ notice: `复习顺序生成失败：${safeError(error)}` });
      return false;
    }
  }

  async buildFullIndex(): Promise<void> {
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
    if (!this.#indexer?.cancel()) return;
    this.patch({
      indexStatus: "PARTIAL",
      notice: "正在取消索引并恢复起始题",
    });
  }

  async flushDraft(): Promise<void> {
    const identity = this.#state.identity;
    if (!identity) return;
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
      fault: null,
    });
    if (this.#state.indexStatus !== "COMPLETE") {
      await this.#indexer?.learnCurrent().catch(() => undefined);
    }
  }

  private async readMarked(identity: QuestionIdentity): Promise<boolean> {
    const snapshot = await this.#runtime
      .getRankCandidates(identity.predictionEdition, [identity.questionId])
      .catch(() => null);
    return snapshot?.candidates[0]?.marked ?? false;
  }

  private async persistSession(identity: QuestionIdentity): Promise<void> {
    const write = this.#sessionWriteChain
      .catch(() => undefined)
      .then(() => this.#runtime.saveSession(toQuestionRef(identity)));
    this.#sessionWriteChain = write;
    await write;
  }

  private async safeLoadDraft(identity: QuestionIdentity): Promise<string> {
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

export class RuntimeIndexCheckpoints implements IndexCheckpointPort {
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
    "HERMES_OFFLINE",
    "STORAGE_ERROR",
  ]).has(code)
    ? (code as RuntimeFault["code"])
    : "SITE_CHANGED";
  return { code: mapped, message, recoverable: true };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "未知错误";
}
