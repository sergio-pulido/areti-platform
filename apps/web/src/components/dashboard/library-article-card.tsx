import Link from "next/link";
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
      href={`/dashboard/library/${encodeURIComponent(lesson.slug)}`}
      aria-label={`Open article ${lesson.title}`}
      className="block rounded-3xl border border-night-800 bg-night-900/60 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.22)] transition hover:border-sage-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/70"
    >
      <h2 className="text-lg font-semibold text-sand-100">{lesson.title}</h2>
      <p className="mt-1 text-sm text-night-300">{lesson.tradition}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-night-300">
        <span>{lesson.level}</span>
        <span>{lesson.minutes} min read</span>
      </div>
      <p className="mt-3 text-sm text-night-200">{lesson.summary}</p>
      <p className="mt-4 text-xs text-sage-100">Read article</p>
    </Link>
  );
}
