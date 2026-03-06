import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const resources = [
  {
    title: "Challenge Starter Kit",
    description: "Templates and checklists to start a focused group challenge.",
    href: "/dashboard/library?q=challenge",
    cta: "Open in library",
  },
  {
    title: "Facilitation Playbook",
    description: "Run small-group discussions with clear outcomes and next actions.",
    href: "/community",
    cta: "View circles",
  },
  {
    title: "Reflection Prompts Bank",
    description: "Prompts for weekly retrospectives and progress reviews.",
    href: "/dashboard/chat?prompt=Give%20me%2010%20high-quality%20reflection%20prompts%20for%20a%20community%20group.",
    cta: "Generate prompts",
  },
];

export default function CommunityResourcesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Resources"
        description="Use practical materials to run circles, challenges, and collaborative practice."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <SurfaceCard key={resource.title} title={resource.title}>
            <p className="text-sm text-night-200">{resource.description}</p>
            <Link
              href={resource.href}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              {resource.cta}
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
