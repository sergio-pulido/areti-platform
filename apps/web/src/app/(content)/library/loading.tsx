import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-56 rounded-[var(--radius-2xl)]" />
        <Skeleton className="h-56 rounded-[var(--radius-2xl)]" />
        <Skeleton className="h-56 rounded-[var(--radius-2xl)]" />
      </div>
    </div>
  );
}
