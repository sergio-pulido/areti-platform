import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

type AccountPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AccountPlaceholderPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: AccountPlaceholderPageProps) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <SurfaceCard title={emptyTitle} subtitle="This section is ready for real account data wiring.">
        <p className="text-sm text-night-200">{emptyDescription}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
          >
            {primaryLabel}
            <ArrowRight size={13} />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 rounded-lg border border-night-700 bg-night-950 px-3 py-1.5 text-xs text-night-100 hover:border-night-500"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}
