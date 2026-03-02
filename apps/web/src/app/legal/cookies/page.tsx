export default function CookiesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-sage-200/90">Legal</p>
        <h1 className="mt-1 font-title text-4xl text-sand-100">Cookie Policy</h1>
        <p className="mt-2 text-sm text-night-200">Last updated: March 1, 2026</p>
      </header>

      <section className="space-y-3 text-sm text-night-100">
        <p>
          We use essential cookies to keep you signed in and maintain session security.
          These cookies are required for core platform functionality.
        </p>
        <p>
          We may add optional analytics cookies in the future to understand feature usage.
          If enabled, users will be informed and given controls where required by law.
        </p>
        <p>
          You can clear cookies in your browser settings, but doing so may sign you out.
        </p>
      </section>
    </div>
  );
}
