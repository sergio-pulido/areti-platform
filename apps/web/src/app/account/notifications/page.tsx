import {
  markNotificationReadAction,
  openNotificationAction,
  readAllNotificationsAction,
} from "@/actions/notifications";
import { saveNotificationPreferencesAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { apiNotificationPreferences, apiNotifications, type ApiNotification, type ApiNotificationPreferences } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type AccountNotificationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

const defaultPreferences: ApiNotificationPreferences = {
  id: "",
  userId: "",
  emailChallenges: true,
  emailEvents: true,
  emailUpdates: true,
  emailMarketing: false,
  pushChallenges: true,
  pushEvents: false,
  pushUpdates: true,
  digest: "immediate",
  createdAt: "",
  updatedAt: "",
};

export default async function AccountNotificationsPage({ searchParams }: AccountNotificationsPageProps) {
  const session = await requireSession();
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved) === "1";
  const actionError = first(params.error);

  let notifications: { items: ApiNotification[]; unreadCount: number } = {
    items: [],
    unreadCount: 0,
  };
  let preferences = defaultPreferences;
  let loadError = "";

  try {
    const [loadedNotifications, loadedPreferences] = await Promise.all([
      apiNotifications(session.accessToken, 60),
      apiNotificationPreferences(session.accessToken),
    ]);
    notifications = loadedNotifications;
    preferences = loadedPreferences;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load notification data.";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Communication"
        title="Notifications"
        description="Review notification history and persist category/channel preferences."
        actions={
          <form action={readAllNotificationsAction}>
            <button
              type="submit"
              className="rounded-lg border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-sand-100 hover:border-night-500"
            >
              Mark all as read
            </button>
          </form>
        }
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          Notification preferences saved.
        </p>
      ) : null}
      {actionError ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {actionError}
        </p>
      ) : null}
      {loadError ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Preferences" subtitle="Delivery channels and digest mode">
          <form action={saveNotificationPreferencesAction} className="space-y-3 text-sm text-sand-200">
            <p className="text-xs uppercase tracking-[0.2em] text-night-300">Email channels</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="emailChallenges" defaultChecked={preferences.emailChallenges} />
              Challenges
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="emailEvents" defaultChecked={preferences.emailEvents} />
              Events
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="emailUpdates" defaultChecked={preferences.emailUpdates} />
              Product updates
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="emailMarketing" defaultChecked={preferences.emailMarketing} />
              Marketing
            </label>

            <p className="pt-2 text-xs uppercase tracking-[0.2em] text-night-300">Push channels</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="pushChallenges" defaultChecked={preferences.pushChallenges} />
              Challenges
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="pushEvents" defaultChecked={preferences.pushEvents} />
              Events
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="pushUpdates" defaultChecked={preferences.pushUpdates} />
              Product updates
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Digest mode</span>
              <select
                name="digest"
                defaultValue={preferences.digest}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save notification preferences
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard
          title="Inbox"
          subtitle={`${notifications.unreadCount} unread${notifications.unreadCount === 1 ? " notification" : " notifications"}`}
        >
          <div className="space-y-2">
            {notifications.items.length === 0 ? (
              <p className="rounded-lg border border-night-700 bg-night-950/70 p-3 text-sm text-night-300">
                No notifications yet.
              </p>
            ) : (
              notifications.items.map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-lg border border-night-700 bg-night-950/70 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sand-100">{notification.title}</p>
                      <p className="mt-1 text-sm text-night-200">{notification.body}</p>
                      <p className="mt-1 text-xs text-night-300">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        notification.readAt
                          ? "border-night-600 bg-night-900 text-night-200"
                          : "border-sage-300/40 bg-sage-500/15 text-sage-100"
                      }`}
                    >
                      {notification.readAt ? "READ" : "UNREAD"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={openNotificationAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <input type="hidden" name="href" value={notification.href} />
                      <button
                        type="submit"
                        className="rounded-md border border-night-600 px-2 py-1 text-xs text-sand-100 hover:border-sage-300"
                      >
                        Open
                      </button>
                    </form>

                    {!notification.readAt ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-night-600 px-2 py-1 text-xs text-night-100 hover:border-night-500"
                        >
                          Mark read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
