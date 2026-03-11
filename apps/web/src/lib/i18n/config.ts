export const LOCALE_COOKIE_NAME = "areti_locale";

export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(value: string | null | undefined): AppLocale {
  const locale = (value ?? "").trim().toLowerCase();
  return locale.startsWith("es") ? "es" : "en";
}
