import { describe, expect, test } from "vitest";
import {
  type BackgroundBrowserApi,
  startCockpitBackground,
} from "./start-cockpit-background";

describe("startCockpitBackground", () => {
  test("starts and disposes local storage runtime without network setup", async () => {
    const listeners = new Set<(...args: never[]) => unknown>();
    const browserApi: BackgroundBrowserApi = {
      runtime: {
        id: "extension-id",
        onMessage: {
          addListener: (listener) => {
            listeners.add(listener as (...args: never[]) => unknown);
          },
          removeListener: (listener) => {
            listeners.delete(listener as (...args: never[]) => unknown);
          },
        },
      },
    };

    const dispose = await startCockpitBackground(browserApi, {
      databaseName: `pte-pilot-start-${crypto.randomUUID()}`,
    });

    expect(listeners.size).toBe(1);
    dispose();
    expect(listeners.size).toBe(0);
  });
});
