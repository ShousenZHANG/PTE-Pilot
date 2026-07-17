import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { extensionPath } from "./extension-fixture";

test("built manifest keeps the approved least-privilege boundary", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(extensionPath, "manifest.json"), "utf8"),
  ) as {
    manifest_version?: number;
    permissions?: string[];
    host_permissions?: string[];
    content_scripts?: Array<{ matches?: string[] }>;
  };

  expect(manifest.manifest_version).toBe(3);
  expect([...(manifest.permissions ?? [])].sort()).toEqual(["storage"]);
  expect([...(manifest.host_permissions ?? [])].sort()).toEqual([
    "https://www.fireflyau.com/*",
  ]);
  expect(manifest.permissions ?? []).not.toEqual(
    expect.arrayContaining([
      "cookies",
      "debugger",
      "downloads",
      "tabs",
      "webRequest",
    ]),
  );
  expect(manifest.host_permissions ?? []).not.toContain("<all_urls>");
  expect(
    manifest.content_scripts?.flatMap(({ matches }) => matches ?? []),
  ).toEqual(["https://www.fireflyau.com/ptehome/exercise*"]);
});
