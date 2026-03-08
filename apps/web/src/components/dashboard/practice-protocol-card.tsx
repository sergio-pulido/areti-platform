import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PracticeRoutine } from "@/lib/content-api";

type PracticeProtocolCardProps = {
  routine: Pick<PracticeRoutine, "slug" | "title" | "description" | "cadence">;
};

export function PracticeProtocolCard({ routine }: PracticeProtocolCardProps) {
  return (
    <Link
      href={`/practices/${encodeURIComponent(routine.slug)}`}
      aria-label={`Open practice ${routine.title}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/70"
    >
      <Card className="rounded-[var(--radius-2xl)] transition group-hover:border-sage-300/40">
        <h2 className="text-lg font-semibold text-sand-100">{routine.title}</h2>
        <div className="mt-2">
          <Badge variant="success">{routine.cadence}</Badge>
        </div>
        <p className="mt-4 line-clamp-3 text-sm text-night-200">{routine.description}</p>
        <p className="mt-4 text-xs text-sage-100">Start practice</p>
      </Card>
    </Link>
  );
}
