import Image from "next/image";
import { saveProfileAction, saveProfileAvatarAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";
import { getAvatarPreset, resolveAvatarInitials, avatarPresets } from "@/lib/avatar";
import { apiMe } from "@/lib/backend-api";

type AccountProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

function renderSavedMessage(saved: string): string {
  if (saved === "avatar") {
    return "Avatar updated.";
  }

  if (saved === "profile") {
    return "Profile details updated.";
  }

  return "Changes saved.";
}

export default async function AccountProfilePage({ searchParams }: AccountProfilePageProps) {
  const session = await requireSession();
  const me = await apiMe(session.accessToken);
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved);
  const error = first(params.error);

  const currentPreset = getAvatarPreset(me.profile.avatarPreset);
  const initials = resolveAvatarInitials(me.user.name);

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Profile"
        description="Manage your account identity. Avatar and bio are optional and never block activation."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          {renderSavedMessage(saved)}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard
          title="Avatar (optional)"
          subtitle="Pick a clean preset, upload a photo, or stay with initials."
        >
          <form action={saveProfileAvatarAction} className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-night-700 bg-night-950/80 p-3">
              <div
                data-testid="profile-avatar-preview"
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-night-700 bg-night-900 text-lg font-semibold text-sand-100"
              >
                {me.profile.avatarType === "upload" ? (
                  <Image
                    src={`/api/account/avatar?updated=${encodeURIComponent(me.profile.updatedAt)}`}
                    alt="Profile avatar"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : me.profile.avatarType === "preset" && currentPreset ? (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${currentPreset.gradientClassName}`}
                  >
                    <span>{currentPreset.symbol}</span>
                  </div>
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="space-y-1 text-sm text-night-200">
                <p className="font-medium text-sand-100">Current avatar</p>
                <p>
                  Fallback order: uploaded image, then preset, then initials.
                </p>
              </div>
            </div>

            <fieldset className="space-y-2 text-sm text-sand-200">
              <legend className="text-sm font-medium text-sand-100">Choose avatar source</legend>
              <label className="flex items-center gap-2">
                <input type="radio" name="avatarMode" value="keep" defaultChecked />
                Keep current avatar
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="avatarMode" value="initials" />
                Use initials fallback
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="avatarMode" value="preset" />
                Use preset avatar
              </label>
            </fieldset>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Preset avatar</span>
              <select
                name="avatarPreset"
                defaultValue={me.profile.avatarPreset ?? avatarPresets[0].id}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                {avatarPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Upload photo (optional)</span>
              <input
                type="file"
                name="avatarFile"
                accept="image/*"
                capture="user"
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100 file:mr-3 file:rounded-md file:border-0 file:bg-night-800 file:px-3 file:py-1 file:text-sand-100"
              />
              <p className="text-xs text-night-300">Max 3 MB. If selected, upload takes priority over preset.</p>
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save avatar
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Basic identity" subtitle="Core account details visible across your Areti experience.">
          <form action={saveProfileAction} className="space-y-3">
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

            <label className="space-y-1 text-sm text-sand-200">
              <span>Short bio (optional)</span>
              <textarea
                name="summary"
                defaultValue={me.profile.summary}
                rows={5}
                maxLength={500}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save profile
            </button>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
