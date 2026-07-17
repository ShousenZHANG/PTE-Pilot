import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "PTE Pilot",
    description: "Local-first PTE Write From Dictation practice assistant",
    permissions: ["storage", "webRequest"],
    host_permissions: [
      "https://www.fireflyau.com/*",
      "https://upload.fireflyau.com/*",
    ],
  },
});
