import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReflectionNewFlow } from "@/components/reflections/reflection-new-flow";

export default function NewReflectionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Reflections"
        title="New reflection"
        description="Speak or write in your own words. Areti will transcribe, clean, refine, and add a short commentary."
        actions={
          <Link
            href="/reflections"
            className="inline-flex items-center gap-1 rounded-xl border border-night-700 bg-night-900/80 px-3 py-2 text-xs text-night-100 hover:bg-night-900"
          >
            <ChevronLeft size={14} />
            Back to history
          </Link>
        }
      />

      <ReflectionNewFlow />
    </div>
  );
}
