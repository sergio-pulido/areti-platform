import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardCompanionContext } from "@/components/dashboard/home/types";

type DashboardCompanionPanelProps = {
  companion: DashboardCompanionContext;
};

export function DashboardCompanionPanel({ companion }: DashboardCompanionPanelProps) {
  return (
    <section aria-label="Companion">
      <Card
        variant="default"
        className="rounded-[var(--radius-2xl)] border-sage-300/25 bg-gradient-to-br from-sage-500/12 via-night-900/78 to-night-900/92"
      >
        <div className="flex items-center gap-2 text-sage-100">
          <Sparkles size={14} />
          <p className="text-xs uppercase tracking-[0.18em]">Companion</p>
        </div>
        <h2 className="mt-3 text-lg font-semibold text-sand-100">{companion.headline}</h2>
        <p className="mt-2 text-sm text-night-100">{companion.description}</p>

        <Link
          href={companion.cta.href}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sage-300/45 bg-sage-500/12 px-3 py-2 text-sm text-sage-100 hover:bg-sage-500/18"
        >
          {companion.cta.label}
          <ArrowUpRight size={13} />
        </Link>

        <div className="mt-5 flex flex-wrap gap-2">
          {companion.prompts.map((prompt) => (
            <Link
              key={prompt.label}
              href={prompt.href}
              className="rounded-full border border-night-700/90 bg-night-950/72 px-3 py-1.5 text-xs text-night-100 hover:border-sage-300/40"
            >
              {prompt.label}
            </Link>
          ))}
        </div>
      </Card>
    </section>
  );
}
