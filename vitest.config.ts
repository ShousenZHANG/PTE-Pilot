import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    setupFiles: ["./tests/setup-indexeddb.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
