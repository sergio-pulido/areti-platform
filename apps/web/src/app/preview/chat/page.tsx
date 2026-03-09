import Link from "next/link";
import { TokenLimitedPreview } from "@/components/chat/token-limited-preview";
import { PageHeader } from "@/components/dashboard/page-header";

export default function PreviewChatPage() {
  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Public Preview"
        title="Companion Chat"
        description="Chat in a constrained token sandbox without creating an account."
        actions={
          <Link
            href="/preview"
            className="inline-flex rounded-xl border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
          >
            All previews
          </Link>
        }
      />

      <TokenLimitedPreview endpoint="/api/preview/chat" analyticsPath="/preview/chat" />
    </div>
  );
}
