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

function runDigestJob(): { usersScanned: number; notificationsCreated: number } {
  const userIds = listActiveUserIds(5000);
  let notificationsCreated = 0;

  for (const userId of userIds) {
    const preferences = getUserNotificationPreferencesByUserId(userId);

    if (preferences.digest === "immediate") {
      continue;
    }

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
      }
    }
  }

  return {
    usersScanned: userIds.length,
    notificationsCreated,
  };
}

const summary = runDigestJob();
// eslint-disable-next-line no-console
console.log(
  `[notification-digest] scanned=${summary.usersScanned} created=${summary.notificationsCreated}`,
);
