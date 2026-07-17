import { describe, expect, it, vi } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import { AudioBroker, type AudioSitePort } from "./audio-broker";

const identity: QuestionIdentity = {
  predictionEdition: "weekly-2026-W29",
  questionId: "131020",
  position: 12,
  total: 193,
  tags: ["WFD"],
};

class FakeAudioElement extends EventTarget {
  paused = true;
  ended = false;
  currentTime = 30;
  duration = 6;
  readyState = 4;
  preload = "metadata";
  src = "https://upload.fireflyau.com/audio/131020.mp3";
  currentSrc = this.src;

  async play(): Promise<void> {
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event("play"));
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  load(): void {}

  finish(): void {
    this.paused = true;
    this.ended = true;
    this.dispatchEvent(new Event("ended"));
  }
}

function siteFixture(overrides: Partial<AudioSitePort> = {}): AudioSitePort {
  return {
    readQuestionIdFast: () => identity.questionId,
    siteAudioElements: () => [],
    playAudio: () => undefined,
    pauseAudio: () => undefined,
    ...overrides,
  };
}

describe("AudioBroker direct element control", () => {
  it("plays instantly through the page audio element and replays from zero", async () => {
    const element = new FakeAudioElement();
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);
    expect(element.currentTime).toBe(0);

    element.currentTime = 4.2;
    await broker.play();
    expect(broker.state).toBe("PLAYING");
    expect(element.paused).toBe(false);

    await broker.restart();
    expect(element.currentTime).toBe(0);
    expect(broker.state).toBe("PLAYING");
  });

  it("toggles pause and resumes without touching site controls", async () => {
    const element = new FakeAudioElement();
    const playAudio = vi.fn();
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
        playAudio,
      }),
    );
    broker.bind(identity.questionId, 1);

    await broker.play();
    await broker.play();
    expect(broker.state).toBe("PAUSED");
    expect(element.paused).toBe(true);

    await broker.play();
    expect(broker.state).toBe("PLAYING");
    expect(playAudio).not.toHaveBeenCalled();
  });

  it("mirrors the element lifecycle so site-driven events stay truthful", async () => {
    const element = new FakeAudioElement();
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);
    await broker.play();

    element.finish();
    expect(broker.state).toBe("ENDED");

    const snapshot = broker.snapshot();
    expect(snapshot).toMatchObject({ duration: 6, playing: false });
  });

  it("enforces the exam single-play rule on both play and restart", async () => {
    const element = new FakeAudioElement();
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.setMode("exam");
    broker.bind(identity.questionId, 1);

    await broker.play();
    element.finish();

    await expect(broker.play()).rejects.toThrow("audio:exam-play-consumed");
    await expect(broker.restart()).rejects.toThrow("audio:exam-play-consumed");
    expect(broker.state).toBe("AUDIO_ERROR");
  });

  it("fails closed when the page question no longer matches the binding", async () => {
    const element = new FakeAudioElement();
    let currentQuestion = identity.questionId;
    const broker = new AudioBroker(
      siteFixture({
        readQuestionIdFast: () => currentQuestion,
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);
    currentQuestion = "999999";

    await expect(broker.play()).rejects.toThrow("audio:stale-binding");
    expect(broker.state).toBe("AUDIO_ERROR");
    expect(element.paused).toBe(true);
  });

  it("falls back to the site play control when no unique element exists", async () => {
    const playAudio = vi.fn();
    const broker = new AudioBroker(siteFixture({ playAudio }));
    broker.bind(identity.questionId, 1);

    await broker.play();
    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(broker.state).toBe("PLAYING");
  });

  it("requests full preload at bind and surfaces buffering on a cold first play", async () => {
    const element = new FakeAudioElement();
    element.readyState = 0;
    let releasePlay: (() => void) | undefined;
    element.play = () =>
      new Promise<void>((resolve) => {
        releasePlay = () => {
          element.paused = false;
          resolve();
        };
      });
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    const states: string[] = [];
    broker.addEventListener("statechange", (event) => {
      states.push((event as CustomEvent<string>).detail);
    });
    broker.bind(identity.questionId, 1);
    expect(element.preload).toBe("auto");

    const playing = broker.play();
    expect(broker.state).toBe("BUFFERING");
    releasePlay?.();
    await playing;
    expect(broker.state).toBe("PLAYING");
    expect(states).toContain("BUFFERING");
  });

  it("reports a blocked autoplay as READY with a gesture hint, never as an error", async () => {
    const element = new FakeAudioElement();
    element.play = () =>
      Promise.reject(new DOMException("blocked", "NotAllowedError"));
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);

    await expect(broker.play()).rejects.toThrow("audio:needs-gesture");
    expect(broker.state).toBe("READY");
  });

  it("treats a missing source as not-ready instead of an error", async () => {
    const element = new FakeAudioElement();
    element.play = () =>
      Promise.reject(new DOMException("no source", "NotSupportedError"));
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);

    await expect(broker.play()).rejects.toThrow("audio:not-ready");
    expect(broker.state).toBe("EMPTY");
  });

  it("swallows a play() aborted by a competing pause", async () => {
    const element = new FakeAudioElement();
    element.play = () =>
      Promise.reject(new DOMException("interrupted", "AbortError"));
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);

    await expect(broker.play()).resolves.toBeUndefined();
    expect(broker.state).not.toBe("AUDIO_ERROR");
  });

  it("adopts the most-loaded element when the site leaves several behind", async () => {
    const stale = new FakeAudioElement();
    stale.readyState = 1;
    const active = new FakeAudioElement();
    active.readyState = 4;
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () =>
          [stale, active] as unknown as HTMLAudioElement[],
      }),
    );
    broker.bind(identity.questionId, 1);

    await broker.play();
    expect(active.paused).toBe(false);
    expect(stale.paused).toBe(true);
    expect(broker.state).toBe("PLAYING");
  });

  it("stops playback and detaches on invalidate", async () => {
    const element = new FakeAudioElement();
    const broker = new AudioBroker(
      siteFixture({
        siteAudioElements: () => [element as unknown as HTMLAudioElement],
      }),
    );
    broker.bind(identity.questionId, 1);
    await broker.play();

    broker.invalidate();
    expect(broker.state).toBe("EMPTY");
    expect(element.paused).toBe(true);
    expect(element.currentTime).toBe(0);

    element.dispatchEvent(new Event("ended"));
    expect(broker.state).toBe("EMPTY");
  });
});
