import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

function defaultDbFileName() {
  if (process.env.NODE_ENV === "test") {
    return "ataraxia.test.db";
  }

  if (process.env.NODE_ENV === "production") {
    return "ataraxia.prod.db";
  }

  return "ataraxia.dev.db";
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const dbUrl = process.env.ATARAXIA_DB_PATH ?? path.join(repoRoot, "data", defaultDbFileName());

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
