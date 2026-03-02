export default function TermsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-sage-200/90">Legal</p>
        <h1 className="mt-1 font-title text-4xl text-sand-100">Terms of Service</h1>
        <p className="mt-2 text-sm text-night-200">Last updated: March 1, 2026</p>
      </header>

      <section className="space-y-3 text-sm text-night-100">
        <p>
          By using this platform, you agree to use it responsibly and lawfully. You are
          responsible for maintaining the confidentiality of your account credentials.
        </p>
        <p>
          The philosophical and chatbot content is educational guidance, not medical, legal,
          or financial advice.
        </p>
        <p>
          We reserve the right to suspend accounts that abuse the platform, violate laws,
          or harm other users.
        </p>
      </section>
    </div>
  );
}
