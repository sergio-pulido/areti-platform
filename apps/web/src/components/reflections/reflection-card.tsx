import Link from "next/link";
import { Mic, Star, Upload, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ReflectionStatusBadge } from "@/components/reflections/reflection-status-badge";
import type { ApiReflectionListItem, ApiReflectionSourceType } from "@/lib/backend-api";

type ReflectionCardProps = {
  item: ApiReflectionListItem;
};

function sourceLabel(sourceType: ApiReflectionSourceType): string {
  if (sourceType === "voice") {
    return "Voice note";
  }
  if (sourceType === "upload") {
    return "Audio upload";
  }
  return "Written";
}

function sourceIcon(sourceType: ApiReflectionSourceType) {
  if (sourceType === "voice") {
    return <Mic size={14} />;
  }
  if (sourceType === "upload") {
    return <Upload size={14} />;
  }
  return <Wand2 size={14} />;
}

export function ReflectionCard({ item }: ReflectionCardProps) {
  return (
    <Link href={`/reflections/${item.id}`} className="block">
      <Card
        variant="default"
        className="rounded-[var(--radius-2xl)] border-night-700/70 p-4 transition hover:border-sage-300/45 hover:bg-night-900/85"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-night-700 bg-night-950/80 p-1.5 text-night-200">
            {sourceIcon(item.sourceType)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-sand-100">{item.title}</p>
              {item.isFavorite ? <Star size={13} className="fill-sage-200 text-sage-200" /> : null}
              <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-night-300">
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-night-300">
              <span>{sourceLabel(item.sourceType)}</span>
              <ReflectionStatusBadge status={item.status} />
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-night-700/80 bg-night-950/70 px-2 py-0.5 text-[11px] text-night-200"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <p className="mt-3 line-clamp-3 text-sm text-night-200">{item.preview}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
