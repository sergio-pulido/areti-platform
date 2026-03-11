"use client";

import { useLocale } from "@/components/i18n/i18n-provider";
import { type AppLocale } from "@/lib/i18n/config";

const LANGUAGE_OPTIONS: Array<{ locale: AppLocale; label: string }> = [
  { locale: "en", label: "English" },
  { locale: "es", label: "Español" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const heading = locale === "es" ? "Idioma" : "Language";

  return (
    <div className="px-2 py-1" data-i18n-ignore="true">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-night-300">{heading}</p>
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const active = option.locale === locale;

          return (
            <button
              key={option.locale}
              type="button"
              onClick={() => setLocale(option.locale)}
              aria-pressed={active}
              className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                active
                  ? "border-sage-300 bg-sage-500/20 text-sage-100"
                  : "border-night-700 text-sand-200 hover:border-night-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
