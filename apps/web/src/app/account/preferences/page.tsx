import Link from "next/link";
import { saveSettingsAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { apiMe } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type PreferencesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

export default async function PreferencesPage({ searchParams }: PreferencesPageProps) {
  const session = await requireSession();
  const me = await apiMe(session.accessToken);
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved) === "1";
  const error = first(params.error);

  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Preferences"
        description="Manage language, timezone, and app experience defaults."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          Preferences saved.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Account preferences" subtitle="Personal defaults for your Areti experience">
          <form action={saveSettingsAction} className="space-y-3">
            <label className="space-y-1 text-sm text-sand-200">
              <span>Language</span>
              <select
                name="language"
                defaultValue={me.preferences.language}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="ca">Catalan</option>
              </select>
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Timezone</span>
              <input
                name="timezone"
                defaultValue={me.preferences.timezone}
                placeholder="UTC"
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              />
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Profile visibility</span>
              <select
                name="profileVisibility"
                defaultValue={me.preferences.profileVisibility}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                <option value="private">Private</option>
                <option value="contacts">Contacts</option>
                <option value="public">Public</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="showEmail" defaultChecked={me.preferences.showEmail} />
              Show email on profile
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="showPhone" defaultChecked={me.preferences.showPhone} />
              Show phone on profile
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="allowContact" defaultChecked={me.preferences.allowContact} />
              Allow direct contact requests
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save preferences
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Related controls" subtitle="Security and communication settings">
          <div className="space-y-2 text-sm">
            <Link
              href="/account/notifications"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Notification preferences
            </Link>
            <Link
              href="/account/security"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Security controls
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
