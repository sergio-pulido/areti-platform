import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ReflectionEmptyState() {
  return (
    <Card
      variant="default"
      className="rounded-[var(--radius-2xl)] border-night-700/75 bg-night-900/70 p-8 text-center"
    >
      <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sage-300/30 bg-sage-500/10 text-sage-100">
        <Sparkles size={18} />
      </div>
      <h2 className="text-lg font-semibold text-sand-100">Your reflections will appear here</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-night-200">
        Speak naturally or write freely. Areti will help you turn scattered thoughts into clearer text you can revisit.
      </p>
      <Link
        href="/reflections/new"
        className="mt-5 inline-flex rounded-xl border border-sage-300/45 bg-sage-500/12 px-4 py-2 text-sm font-medium text-sage-100 hover:bg-sage-500/22"
      >
        Create your first reflection
      </Link>
    </Card>
  );
}
