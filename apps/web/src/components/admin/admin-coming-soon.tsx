type AdminComingSoonProps = {
  title: string;
  description: string;
};

export function AdminComingSoon({ title, description }: AdminComingSoonProps) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-sand-100">{title}</h1>
        <p className="mt-2 text-sm text-night-200">{description}</p>
      </header>

      <section className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
        <p className="text-sm text-night-200">Coming soon.</p>
      </section>
    </div>
  );
}
