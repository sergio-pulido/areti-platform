import { saveProfileAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";
import { apiMe } from "@/lib/backend-api";

type AccountProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

function getLink(links: Array<{ label: string; url: string }>, label: string): string {
  const item = links.find((entry) => entry.label.toLowerCase() === label.toLowerCase());
  return item?.url ?? "";
}

export default async function AccountProfilePage({ searchParams }: AccountProfilePageProps) {
  const session = await requireSession();
  const me = await apiMe(session.accessToken);
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved) === "1";
  const error = first(params.error);

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Profile"
        description="Update who you are and how others can recognize or contact you."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          Profile updated.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <SurfaceCard title="Personal information" subtitle="Editable account identity and profile fields">
        <form action={saveProfileAction} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-sand-200">
            <span>Name</span>
            <input
              name="name"
              defaultValue={me.user.name}
              required
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>Username</span>
            <input
              name="username"
              defaultValue={me.profile.username ?? ""}
              placeholder="your_handle"
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200 md:col-span-2">
            <span>Summary</span>
            <textarea
              name="summary"
              defaultValue={me.profile.summary}
              rows={5}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>Phone</span>
            <input
              name="phone"
              defaultValue={me.profile.phone}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>City</span>
            <input
              name="city"
              defaultValue={me.profile.city}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>Country</span>
            <input
              name="country"
              defaultValue={me.profile.country}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200 md:col-span-2">
            <span>Website</span>
            <input
              name="website"
              defaultValue={getLink(me.profile.socialLinks, "Website")}
              placeholder="https://"
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>LinkedIn</span>
            <input
              name="linkedin"
              defaultValue={getLink(me.profile.socialLinks, "LinkedIn")}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>X</span>
            <input
              name="x"
              defaultValue={getLink(me.profile.socialLinks, "X")}
              placeholder="https://x.com/..."
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save profile
            </button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
