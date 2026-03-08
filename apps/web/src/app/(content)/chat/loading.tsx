import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1.3fr_0.7fr]">
        <Skeleton className="h-[66vh] rounded-[var(--radius-2xl)]" />
        <Skeleton className="h-[66vh] rounded-[var(--radius-2xl)]" />
      </div>
    </div>
  );
}
