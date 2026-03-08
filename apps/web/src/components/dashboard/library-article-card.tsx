import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LibraryLesson } from "@/lib/content-api";

type LibraryArticleCardProps = {
  lesson: Pick<
    LibraryLesson,
    "slug" | "title" | "tradition" | "level" | "minutes" | "summary"
  >;
};

export function LibraryArticleCard({ lesson }: LibraryArticleCardProps) {
  return (
    <Link
      href={`/library/${encodeURIComponent(lesson.slug)}`}
      aria-label={`Open article ${lesson.title}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/70"
    >
      <Card className="rounded-[var(--radius-2xl)] transition group-hover:border-sage-300/40">
        <h2 className="text-lg font-semibold text-sand-100">{lesson.title}</h2>
        <p className="mt-1 text-sm text-night-300">{lesson.tradition}</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="muted">{lesson.level}</Badge>
          <Badge variant="default">{lesson.minutes} min read</Badge>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-night-200">{lesson.summary}</p>
        <p className="mt-4 text-xs text-sage-100">Read article</p>
      </Card>
    </Link>
  );
}
