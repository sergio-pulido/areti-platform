"use client";

import { MoreHorizontal } from "lucide-react";

type ReflectionActionsMenuProps = {
  onCopyClean: () => void;
  onCopyRefined: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function ReflectionActionsMenu({
  onCopyClean,
  onCopyRefined,
  onDelete,
  deleting = false,
}: ReflectionActionsMenuProps) {
  return (
    <details className="relative">
      <summary className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-night-700 bg-night-900/80 text-night-100 hover:border-night-500">
        <MoreHorizontal size={16} />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-night-700 bg-night-950/98 p-1.5 shadow-ui-elevated">
        <button
          type="button"
          onClick={onCopyClean}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-night-100 hover:bg-night-900/80"
        >
          Copy clean transcript
        </button>
        <button
          type="button"
          onClick={onCopyRefined}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-night-100 hover:bg-night-900/80"
        >
          Copy refined text
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-100 hover:bg-rose-500/16 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete reflection"}
        </button>
      </div>
    </details>
  );
}
