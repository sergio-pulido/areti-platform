import { MessageCircleQuestion } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex h-[360px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-night-800 bg-night-950/70 px-6 text-center">
      <div className="rounded-full border border-night-700 bg-night-900/80 p-3">
        <MessageCircleQuestion size={20} className="text-sage-200" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-sand-100">No thread selected</h2>
      <p className="mt-2 max-w-md text-sm text-night-200">
        Pick a thread from the sidebar or create a new one to start a Companion conversation.
      </p>
    </div>
  );
}
