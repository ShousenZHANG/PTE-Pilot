import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestionIdentity } from "../domain/types";
import {
  NavigationCoordinator,
  type NavigationSitePort,
} from "./navigation-coordinator";

const question = (questionId: string, position: number): QuestionIdentity => ({
  predictionEdition: "weekly-2026-W29",
  questionId,
  position,
  total: 3,
  tags: [],
});

function siteFixture() {
  let current = question("q-1", 1);
  const observers = new Set<(identity: QuestionIdentity) => void>();
  const set = (identity: QuestionIdentity) => {
    current = identity;
    for (const observer of observers) observer(identity);
  };
  const site: NavigationSitePort = {
    readIdentity: () => current,
    click: () => undefined,
    selectQuestion: () => undefined,
    observeQuestionChanges: (callback) => {
      observers.add(callback);
      return () => observers.delete(callback);
    },
  };
  return { site, set };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("NavigationCoordinator", () => {
  it("accepts only the final stable identity for a manual site change", async () => {
    vi.useFakeTimers();
    const fixture = siteFixture();
    const coordinator = new NavigationCoordinator(fixture.site);
    const changes: QuestionIdentity[] = [];
    coordinator.addEventListener("manualchange", (event) => {
      changes.push(
        (event as CustomEvent<{ identity: QuestionIdentity }>).detail.identity,
      );
    });

    fixture.set(question("q-1", 2));
    await vi.advanceTimersByTimeAsync(60);
    fixture.set(question("q-2", 2));
    await vi.advanceTimersByTimeAsync(119);
    expect(changes).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);

    expect(changes).toEqual([question("q-2", 2)]);
    expect(coordinator.current).toEqual(question("q-2", 2));
    coordinator.dispose();
  });

  it("waits through a mixed programmatic DOM transition", async () => {
    vi.useFakeTimers();
    const fixture = siteFixture();
    fixture.site.click = () => {
      fixture.set(question("q-1", 2));
      setTimeout(() => fixture.set(question("q-2", 2)), 20);
    };
    const coordinator = new NavigationCoordinator(fixture.site);

    const navigation = coordinator.navigate({ kind: "next" });
    await vi.advanceTimersByTimeAsync(250);

    await expect(navigation).resolves.toMatchObject({
      identity: question("q-2", 2),
      epoch: 1,
    });
    coordinator.dispose();
  });
});
