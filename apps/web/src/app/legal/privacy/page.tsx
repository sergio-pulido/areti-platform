export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-sage-200/90">Legal</p>
        <h1 className="mt-1 font-title text-4xl text-sand-100">Privacy Policy</h1>
        <p className="mt-2 text-sm text-night-200">Last updated: March 1, 2026</p>
      </header>

      <section className="space-y-3 text-sm text-night-100">
        <p>
          We collect only the information needed to operate your account and improve your
          experience in the platform.
        </p>
        <p>
          Your credentials are protected with Argon2id hashing and session tokens are stored
          securely using HTTP-only cookies.
        </p>
        <p>
          We do not sell your personal information. Usage analytics may be used internally to
          improve content quality and product reliability.
        </p>
      </section>
    </div>
  );
}
