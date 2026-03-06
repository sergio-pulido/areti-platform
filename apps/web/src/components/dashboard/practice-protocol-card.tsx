import Link from "next/link";
import type { PracticeRoutine } from "@/lib/content-api";

type PracticeProtocolCardProps = {
  routine: Pick<PracticeRoutine, "slug" | "title" | "description" | "cadence">;
};

export function PracticeProtocolCard({ routine }: PracticeProtocolCardProps) {
  return (
    <Link
      href={`/dashboard/practices/${encodeURIComponent(routine.slug)}`}
      aria-label={`Open practice ${routine.title}`}
      className="block rounded-3xl border border-night-800 bg-night-900/60 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.22)] transition hover:border-sage-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/70"
    >
      <h2 className="text-lg font-semibold text-sand-100">{routine.title}</h2>
      <p className="mt-1 text-sm text-night-300">{routine.cadence}</p>
      <p className="mt-4 text-sm text-night-200">{routine.description}</p>
      <p className="mt-4 text-xs text-sage-100">Start practice</p>
    </Link>
  );
}
