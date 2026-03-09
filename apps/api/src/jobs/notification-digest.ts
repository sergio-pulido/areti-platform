import { closeSync, existsSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  countJournalEntriesByUser,
  createNotificationIfRecentDuplicateAbsent,
  getUserContentCompletionSummary,
  getUserNotificationPreferencesByUserId,
  listActiveUserIds,
  listJournalEntriesByUser,
} from "@ataraxia/db";

function utcDayStart(input: Date): number {
  return Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
}

function dayDiffFromNow(isoTimestamp: string): number {
  const now = new Date();
  const source = new Date(isoTimestamp);
  return Math.max(0, Math.floor((utcDayStart(now) - utcDayStart(source)) / (24 * 60 * 60 * 1000)));
}

type LockHandle = {
  path: string;
  fd: number;
};

type DigestJobStats = {
  usersScanned: number;
  usersWithDigestEnabled: number;
  notificationsCreated: number;
  duplicatesSkipped: number;
};

function resolveLockPath(): string {
  const configured = process.env.NOTIFICATION_DIGEST_LOCK_PATH?.trim();
  if (configured) {
    return configured;
  }

  return path.join(process.cwd(), ".notification-digest.lock");
}

function acquireJobLock(lockPath: string, staleAfterMinutes = 30): LockHandle | null {
  const staleThresholdMs = Math.max(1, staleAfterMinutes) * 60 * 1000;
  const now = Date.now();

  try {
    const fd = openSync(lockPath, "wx");
    writeFileSync(
      fd,
      JSON.stringify({ pid: process.pid, startedAt: new Date(now).toISOString() }, null, 2),
      "utf8",
    );
    return { path: lockPath, fd };
  } catch {
    if (!existsSync(lockPath)) {
      return null;
    }

    try {
      const payload = JSON.parse(readFileSync(lockPath, "utf8")) as {
        startedAt?: string;
      };
      const startedAtMs = payload.startedAt ? Date.parse(payload.startedAt) : NaN;
      const stale = Number.isNaN(startedAtMs) || now - startedAtMs > staleThresholdMs;
      if (stale) {
        rmSync(lockPath, { force: true });
        const fd = openSync(lockPath, "wx");
        writeFileSync(
          fd,
          JSON.stringify({ pid: process.pid, startedAt: new Date(now).toISOString() }, null, 2),
          "utf8",
        );
        return { path: lockPath, fd };
      }
    } catch {
      rmSync(lockPath, { force: true });
      const fd = openSync(lockPath, "wx");
      writeFileSync(
        fd,
        JSON.stringify({ pid: process.pid, startedAt: new Date(now).toISOString() }, null, 2),
        "utf8",
      );
      return { path: lockPath, fd };
    }
  }

  return null;
}

function releaseJobLock(lock: LockHandle): void {
  closeSync(lock.fd);
  rmSync(lock.path, { force: true });
}

function runDigestJob(): DigestJobStats {
  const userIds = listActiveUserIds(5000);
  let notificationsCreated = 0;
  let duplicatesSkipped = 0;
  let usersWithDigestEnabled = 0;

  for (const userId of userIds) {
    const preferences = getUserNotificationPreferencesByUserId(userId);

    if (preferences.digest === "immediate") {
      continue;
    }
    usersWithDigestEnabled += 1;

    const entriesCount = countJournalEntriesByUser(userId);
    const latestEntries = listJournalEntriesByUser(userId, 20);
    const daysSinceLastEntry = latestEntries[0] ? dayDiffFromNow(latestEntries[0].createdAt) : 999;
    const reflectionsThisWeek = latestEntries.filter((entry) => dayDiffFromNow(entry.createdAt) <= 6).length;
    const completionSummary = getUserContentCompletionSummary(userId);

    const shouldCreateDailyReset =
      preferences.digest === "daily" &&
      entriesCount > 0 &&
      daysSinceLastEntry >= 2;

    if (shouldCreateDailyReset) {
      const created = createNotificationIfRecentDuplicateAbsent({
        id: crypto.randomUUID(),
        userId,
        title: "Daily reset reminder",
        body: "You have been away for a couple of days. A 2-minute check-in can restart momentum.",
        href: "/journal?title=Daily%20reset&mood=Restless",
        dedupeWithinHours: 20,
      });
      if (created) {
        notificationsCreated += 1;
      } else {
        duplicatesSkipped += 1;
      }
    }

    const shouldCreateWeeklyDigest =
      preferences.digest === "weekly" &&
      (reflectionsThisWeek === 0 || completionSummary.practicesCompletedThisWeek === 0);

    if (shouldCreateWeeklyDigest) {
      const digestBody =
        reflectionsThisWeek === 0
          ? "No reflections logged this week yet. Capture one check-in to keep your path active."
          : "No practices completed this week yet. Run one short protocol to keep continuity.";
      const created = createNotificationIfRecentDuplicateAbsent({
        id: crypto.randomUUID(),
        userId,
        title: "Weekly momentum digest",
        body: digestBody,
        href: reflectionsThisWeek === 0 ? "/journal" : "/practices",
        dedupeWithinHours: 24 * 6,
      });
      if (created) {
        notificationsCreated += 1;
      } else {
        duplicatesSkipped += 1;
      }
    }
  }

  return {
    usersScanned: userIds.length,
    usersWithDigestEnabled,
    notificationsCreated,
    duplicatesSkipped,
  };
}

const lock = acquireJobLock(resolveLockPath(), 30);
if (!lock) {
  // eslint-disable-next-line no-console
  console.log("[notification-digest] skipped: another run is active");
  process.exit(0);
}

try {
  const summary = runDigestJob();
  // eslint-disable-next-line no-console
  console.log(
    `[notification-digest] scanned=${summary.usersScanned} digestEnabled=${summary.usersWithDigestEnabled} created=${summary.notificationsCreated} dedupeSkipped=${summary.duplicatesSkipped}`,
  );
} finally {
  releaseJobLock(lock);
}
