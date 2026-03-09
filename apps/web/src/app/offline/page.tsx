import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Offline mode
      </p>
      <h1 className="text-3xl font-semibold text-slate-900">You’re offline right now</h1>
      <p className="mt-3 text-sm text-slate-600">
        Areti is still available for previously visited pages. Reconnect to sync your latest progress and continue live features.
      </p>
      <Link
        className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        href="/"
      >
        Try again
      </Link>
    </main>
  );
}
