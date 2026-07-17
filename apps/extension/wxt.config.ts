import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "PTE Pilot",
    description: "Local-first PTE Write From Dictation practice assistant",
    permissions: ["storage"],
    host_permissions: ["https://www.fireflyau.com/*"],
  },
});
