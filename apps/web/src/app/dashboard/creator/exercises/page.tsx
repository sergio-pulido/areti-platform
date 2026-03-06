import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const exerciseTemplates = [
  "Morning intention reset",
  "Evening control audit",
  "Discomfort practice ladder",
];

export default function CreatorExercisesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Exercises Studio"
        description="Design practical exercises that community members can run daily or weekly."
      />

      <SurfaceCard title="Exercise pipelines" subtitle="Draft, review, publish">
        <ul className="space-y-2 text-sm text-night-200">
          {exerciseTemplates.map((template) => (
            <li key={template} className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              {template}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/creator/cms"
            className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Open CMS
          </Link>
          <Link
            href="/dashboard/practices"
            className="inline-flex rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Preview member experience
          </Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
