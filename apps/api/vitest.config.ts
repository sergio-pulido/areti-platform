import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts", "src/modules/rate-limit/**/*.test.ts"],
    testTimeout: 30000,
  },
});
