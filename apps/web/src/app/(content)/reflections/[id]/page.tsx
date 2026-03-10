import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReflectionDetailClient } from "@/components/reflections/reflection-detail-client";
import { requireSession } from "@/lib/auth/session";
import { apiReflectionById, isApiHttpError } from "@/lib/backend-api";

type ReflectionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReflectionDetailPage({ params }: ReflectionDetailPageProps) {
  const { id } = await params;
  const session = await requireSession();

  let reflection;
  try {
    reflection = await apiReflectionById(session.accessToken, id);
  } catch (error) {
    if (isApiHttpError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reflections"
        title="Reflection detail"
        description="Review transcript quality, refine language, and continue the thread with Companion when ready."
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

      <ReflectionDetailClient initialReflection={reflection} />
    </div>
  );
}
