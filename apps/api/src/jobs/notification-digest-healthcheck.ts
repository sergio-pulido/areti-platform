import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { listSystemJobRuns } from "@areti/db";

function resolveLockPath(): string {
  const configured = process.env.NOTIFICATION_DIGEST_LOCK_PATH?.trim();
  if (configured) {
    return configured;
  }

  return path.join(process.cwd(), ".notification-digest.lock");
}

function lockAgeMinutes(lockPath: string): number | null {
  if (!existsSync(lockPath)) {
    return null;
  }

  try {
    const payload = JSON.parse(readFileSync(lockPath, "utf8")) as {
      startedAt?: string;
    };
    if (!payload.startedAt) {
      return null;
    }
    const startedAtMs = Date.parse(payload.startedAt);
    if (Number.isNaN(startedAtMs)) {
      return null;
    }
    return Math.max(0, Math.floor((Date.now() - startedAtMs) / (60 * 1000)));
  } catch {
    return null;
  }
}

function runHealthcheck(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const lockPath = resolveLockPath();
  const staleLockThresholdMinutes = Math.max(
    1,
    Number(process.env.NOTIFICATION_DIGEST_STALE_LOCK_MINUTES ?? "30"),
  );
  const recentFailureWindowMinutes = Math.max(
    1,
    Number(process.env.NOTIFICATION_DIGEST_ERROR_WINDOW_MINUTES ?? "120"),
  );

  const ageMinutes = lockAgeMinutes(lockPath);
  if (ageMinutes !== null && ageMinutes > staleLockThresholdMinutes) {
    issues.push(
      `stale lock detected (${ageMinutes}m > ${staleLockThresholdMinutes}m) at ${lockPath}`,
    );
  }

  const latestRun = listSystemJobRuns({
    jobName: "notification_digest",
    limit: 1,
  })[0];

  if (!latestRun) {
    issues.push("no notification_digest run record found");
  } else {
    const startedAtMs = Date.parse(latestRun.startedAt);
    const ageMinutesLatest = Number.isNaN(startedAtMs)
      ? null
      : Math.max(0, Math.floor((Date.now() - startedAtMs) / (60 * 1000)));

    if (
      latestRun.status === "error" &&
      ageMinutesLatest !== null &&
      ageMinutesLatest <= recentFailureWindowMinutes
    ) {
      issues.push(
        `latest run failed ${ageMinutesLatest}m ago (${latestRun.errorMessage ?? "unknown error"})`,
      );
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

const result = runHealthcheck();
if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`[notification-digest:healthcheck] FAIL: ${result.issues.join(" | ")}`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("[notification-digest:healthcheck] OK");
