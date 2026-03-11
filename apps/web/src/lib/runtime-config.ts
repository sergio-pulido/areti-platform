import "server-only";
import path from "node:path";

function loadOptionalEnvFile(filePath: string): void {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  try {
    process.loadEnvFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function loadSignupEnvFallbacks(): void {
  const cwd = process.cwd();
  const candidates = new Set([
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
    path.join(cwd, "apps", "web", ".env.local"),
    path.join(cwd, "apps", "web", ".env"),
    path.resolve(cwd, "..", ".env"),
    path.resolve(cwd, "..", "..", ".env"),
  ]);

  for (const filePath of candidates) {
    loadOptionalEnvFile(filePath);
  }
}

loadSignupEnvFallbacks();

const PRIVATE_BETA_TITLE = "Private beta";
const PRIVATE_BETA_BODY = "Areti is currently available by invitation only.";
const SIGNUP_DISABLED_MESSAGE = "Signup is currently disabled. This beta is invite-only.";

function parseBooleanEnvFlag(rawValue: string | undefined, envName: string): boolean | null {
  const normalized = rawValue?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`Unsupported ${envName} value "${rawValue}". Use: true or false.`);
}

export function isSignupEnabled(): boolean {
  const parsed = parseBooleanEnvFlag(process.env.SIGNUP_ENABLED, "SIGNUP_ENABLED");

  if (parsed !== null) {
    return parsed;
  }

  // Safety default: production stays invite-only unless explicitly opened.
  // Non-production defaults to enabled for local/dev/test workflows.
  return process.env.NODE_ENV === "production" ? false : true;
}

export function getSignupGateCopy(): {
  title: string;
  body: string;
  apiMessage: string;
} {
  return {
    title: PRIVATE_BETA_TITLE,
    body: PRIVATE_BETA_BODY,
    apiMessage: SIGNUP_DISABLED_MESSAGE,
  };
}
