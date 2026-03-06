import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCommunityResources } from "@/lib/content-api";

export default async function CommunityResourcesPage() {
  const resources = await fetchCommunityResources();

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Resources"
        description="Use practical materials to run circles, challenges, and collaborative practice."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <SurfaceCard key={resource.slug} title={resource.title}>
            <p className="text-sm text-night-200">{resource.description}</p>
            <Link
              href={resource.href}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              {resource.cta}
            </Link>
          </SurfaceCard>
        ))}
        {resources.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No resources published yet. Add resources in Creator CMS.
          </p>
        ) : null}
      </div>
    </div>
  );
}
