import { Badge } from "@/components/ui/badge";
import type { ApiReflectionStatus } from "@/lib/backend-api";

type ReflectionStatusBadgeProps = {
  status: ApiReflectionStatus;
};

const statusLabelMap: Record<ApiReflectionStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  ready: "Ready",
  failed: "Needs retry",
};

const statusClassMap: Record<ApiReflectionStatus, string> = {
  draft: "border-night-700 bg-night-900/80 text-night-200",
  processing: "border-sage-300/30 bg-sage-500/10 text-sage-100",
  ready: "border-sage-300/40 bg-sage-500/15 text-sage-100",
  failed: "border-rose-300/40 bg-rose-500/10 text-rose-100",
};

export function ReflectionStatusBadge({ status }: ReflectionStatusBadgeProps) {
  return <Badge className={statusClassMap[status]}>{statusLabelMap[status]}</Badge>;
}
