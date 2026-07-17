import { existsSync } from "node:fs";
import path from "node:path";
import {
  type BrowserContext,
  test as base,
  chromium,
  expect,
} from "@playwright/test";

type ExtensionFixtures = {
  extensionContext: BrowserContext;
  extensionId: string;
};

export const extensionPath = path.resolve(
  process.cwd(),
  "apps/extension/.output/chrome-mv3",
);

export const test = base.extend<ExtensionFixtures>({
  extensionContext: async ({ browserName: _browserName }, use) => {
    expect(existsSync(path.join(extensionPath, "manifest.json"))).toBe(true);
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--autoplay-policy=no-user-gesture-required",
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ extensionContext }, use) => {
    let [serviceWorker] = extensionContext.serviceWorkers();
    serviceWorker ??= await extensionContext.waitForEvent("serviceworker");
    const extensionId = new URL(serviceWorker.url()).hostname;
    await use(extensionId);
  },
});

export { expect };
