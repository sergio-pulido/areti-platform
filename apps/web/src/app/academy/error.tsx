"use client";

import { useEffect } from "react";

type AcademyErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AcademyError({ error, reset }: AcademyErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5 text-sand-100">
      <h2 className="text-lg font-semibold">Academy is temporarily unavailable</h2>
      <p className="mt-2 text-sm text-night-200">
        We could not load the Academy knowledge layer. Try reloading this section.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl border border-rose-300/45 bg-rose-500/12 px-3 py-2 text-xs text-rose-100 hover:bg-rose-500/18"
      >
        Retry
      </button>
    </div>
  );
}
