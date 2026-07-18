import { describe, expect, test, vi } from "vitest";
import { createRuntimeMessageHandler } from "./runtime-handler";
import type { CockpitRepositories } from "./storage/repositories";

const trustedSender = {
  id: "extension-id",
  url: "https://www.fireflyau.com/ptehome/exercise?pageSource=yc",
};
const requestId = "6ab7bfd2-6f84-4935-8f68-5ae8cae5da41";

function handlerWith(repository: Partial<CockpitRepositories>) {
  return createRuntimeMessageHandler({
    extensionId: "extension-id",
    repository: repository as CockpitRepositories,
  });
}

describe("runtime handler", () => {
  test("serves local storage requests from trusted Firefly pages", async () => {
    const loadSettings = vi.fn(async () => null);
    const handler = handlerWith({ loadSettings });

    const response = await handler(
      { requestId, action: "storage/loadSettings" },
      trustedSender,
    );

    expect(response).toMatchObject({
      action: "storage/loadSettings",
      ok: true,
      settings: null,
    });
    expect(loadSettings).toHaveBeenCalledOnce();
  });

  test("accepts the exercise route after pageSource is stripped", async () => {
    const loadSettings = vi.fn(async () => null);
    const handler = handlerWith({ loadSettings });

    await expect(
      handler(
        { requestId, action: "storage/loadSettings" },
        {
          id: "extension-id",
          url: "https://www.fireflyau.com/ptehome/exercise",
        },
      ),
    ).resolves.toMatchObject({ ok: true });
  });

  test.each([
    "https://attacker.invalid/",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=other",
    "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=yc",
    "http://www.fireflyau.com/ptehome/exercise?pageSource=yc",
  ])("ignores untrusted sender %s", async (url) => {
    const loadSettings = vi.fn(async () => null);
    const handler = handlerWith({ loadSettings });

    await expect(
      handler(
        { requestId, action: "storage/loadSettings" },
        { id: "extension-id", url },
      ),
    ).resolves.toBeUndefined();
    expect(loadSettings).not.toHaveBeenCalled();
  });

  test.each(["provisional:bootstrap", "session:current-tab"])(
    "blocks ephemeral prediction edition %s",
    async (predictionEdition) => {
      const setMarked = vi.fn();
      const handler = handlerWith({ setMarked });

      await expect(
        handler(
          {
            requestId,
            action: "storage/setMarked",
            predictionEdition,
            questionId: "131020",
            marked: true,
          },
          trustedSender,
        ),
      ).resolves.toMatchObject({
        action: "storage/setMarked",
        ok: false,
        reason: "invalid-request",
      });
      expect(setMarked).not.toHaveBeenCalled();
    },
  );
});
