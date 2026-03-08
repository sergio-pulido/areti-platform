import { ShieldCheck, Sparkles, Timer } from "lucide-react";

const benefits = [
  {
    icon: Timer,
    label: "Guided daily practices in minutes",
  },
  {
    icon: Sparkles,
    label: "Private journal and personal progress",
  },
  {
    icon: ShieldCheck,
    label: "Calm AI support for reflection and clarity",
  },
] as const;

const trustPills = ["Private by default", "Passkey supported", "No spam"] as const;

export function AuthHeroPanel() {
  return (
    <section className="relative hidden overflow-hidden border-r border-night-800/70 lg:block" aria-label="Why Areti">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(166,200,160,0.15),transparent_36%),radial-gradient(circle_at_85%_75%,rgba(232,216,188,0.08),transparent_40%),linear-gradient(145deg,#0f131a_15%,#171f29_55%,#111820_100%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.32em] text-sage-200/90">Stoa + Garden</p>
          <h1 className="mt-5 font-title text-4xl leading-tight text-sand-100 xl:text-[2.6rem]">
            A private space for reflection, journaling, and guided growth.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-sand-200/90">
            Daily practices, thoughtful lessons, and AI guidance designed to help you think clearly and live better.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3">
            {benefits.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-night-700/60 bg-night-900/35 px-4 py-3 text-sm text-sand-100/95"
              >
                <item.icon size={16} className="text-sage-200" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Trust signals">
            {trustPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-night-600/80 bg-night-900/55 px-3 py-1 text-xs text-night-200"
              >
                {pill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
