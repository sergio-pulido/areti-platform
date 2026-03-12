export const avatarPresets = [
  {
    id: "sage_horizon",
    label: "Sage Horizon",
    gradientClassName: "from-emerald-400/70 via-teal-500/65 to-slate-700/70",
    symbol: "A",
  },
  {
    id: "amber_resolve",
    label: "Amber Resolve",
    gradientClassName: "from-amber-300/80 via-orange-400/75 to-rose-600/70",
    symbol: "R",
  },
  {
    id: "ocean_focus",
    label: "Ocean Focus",
    gradientClassName: "from-cyan-300/80 via-sky-500/75 to-blue-700/70",
    symbol: "F",
  },
  {
    id: "forest_quiet",
    label: "Forest Quiet",
    gradientClassName: "from-lime-300/70 via-emerald-500/70 to-green-800/70",
    symbol: "Q",
  },
  {
    id: "charcoal_mind",
    label: "Charcoal Mind",
    gradientClassName: "from-zinc-300/65 via-slate-500/70 to-zinc-800/75",
    symbol: "M",
  },
  {
    id: "sunrise_balance",
    label: "Sunrise Balance",
    gradientClassName: "from-rose-200/80 via-fuchsia-300/70 to-amber-400/75",
    symbol: "B",
  },
] as const;

export type AvatarPresetId = (typeof avatarPresets)[number]["id"];

export function isAvatarPresetId(value: string): value is AvatarPresetId {
  return avatarPresets.some((preset) => preset.id === value);
}

export function getAvatarPreset(id: string | null | undefined): (typeof avatarPresets)[number] | null {
  if (!id) {
    return null;
  }

  return avatarPresets.find((preset) => preset.id === id) ?? null;
}

export function resolveAvatarInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return "AR";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AR";
}
