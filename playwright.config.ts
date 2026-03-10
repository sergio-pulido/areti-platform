import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const nodeBinDir = path.dirname(process.execPath);

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
        `PATH="${nodeBinDir}:$PATH" && E2E_DB_PATH=$(pwd)/data/ataraxia.e2e.db && rm -f "$E2E_DB_PATH" && ATARAXIA_DB_PATH="$E2E_DB_PATH" npm run db:seed:library-practices && EMAIL_TRANSPORT=disabled RESEND_API_KEY= RESEND_FROM_EMAIL= DEEPSEEK_API_KEY= OPENAI_API_KEY= CHAT_CONTEXT_CAPACITY=1200 CHAT_CONTEXT_RECENT_RAW_MESSAGES=2 CHAT_CONTEXT_SUMMARIZE_PERCENT=45 CHAT_CONTEXT_WARNING_PERCENT=60 CHAT_CONTEXT_DEGRADED_PERCENT=80 ATARAXIA_DB_PATH="$E2E_DB_PATH" API_PORT=43101 CORS_ORIGINS=http://localhost:43100 npm run dev:api`,
      port: 43101,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command:
        `PATH="${nodeBinDir}:$PATH" && rm -rf ./apps/web/.next && API_BASE_URL=http://localhost:43101 NEXT_PUBLIC_API_BASE_URL=http://localhost:43101 npm run dev --workspace @ataraxia/web -- --port 43100`,
      port: 43100,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
