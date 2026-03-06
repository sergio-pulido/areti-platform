import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:43100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "rm -f ./data/ataraxia.e2e.db && ATARAXIA_DB_PATH=./data/ataraxia.e2e.db npm run db:seed:library-practices && ATARAXIA_DB_PATH=./data/ataraxia.e2e.db API_PORT=43101 CORS_ORIGINS=http://localhost:43100 npm run dev:api",
      port: 43101,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command:
        "rm -f ./apps/web/.next/dev/lock && API_BASE_URL=http://localhost:43101 NEXT_PUBLIC_API_BASE_URL=http://localhost:43101 npm run dev --workspace @ataraxia/web -- --port 43100",
      port: 43100,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
