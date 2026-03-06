"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TotpManagerProps = {
  enabled: boolean;
};

type SetupPayload = {
  secret: string;
  otpAuthUrl: string;
};

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!response.ok || payload.data === undefined) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload.data;
}

export function TotpManager({ enabled }: TotpManagerProps) {
  const router = useRouter();
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSetup() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const nextSetup = await parseJsonOrThrow<SetupPayload>(
        await fetch("/api/security/mfa/totp/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      setSetup(nextSetup);
      setNotice("Scan the secret and verify with a 6-digit code.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start TOTP setup.");
    } finally {
      setPending(false);
    }
  }

  async function handleVerify() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await parseJsonOrThrow<{ mfaEnabled: boolean }>(
        await fetch("/api/security/mfa/totp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }),
      );
      setSetup(null);
      setCode("");
      setNotice("TOTP verified and MFA enabled.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to verify TOTP code.");
    } finally {
      setPending(false);
    }
  }

  async function handleDisable() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch("/api/security/mfa/totp", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }),
      );
      setSetup(null);
      setCode("");
      setNotice("TOTP disabled.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to disable TOTP.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-night-700 bg-night-950/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sand-100">TOTP MFA</p>
          <p className="text-xs text-night-200">
            Configure authenticator-app verification for sign-in.
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] ${
            enabled
              ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
              : "border-night-600 bg-night-900 text-night-200"
          }`}
        >
          {enabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSetup}
          disabled={pending}
          className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300 disabled:opacity-60"
        >
          {pending ? "Working..." : "Setup TOTP"}
        </button>
        {enabled ? (
          <button
            type="button"
            onClick={handleDisable}
            disabled={pending}
            className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
          >
            Disable TOTP
          </button>
        ) : null}
      </div>

      {setup ? (
        <div className="mt-3 rounded-lg border border-night-700 p-3 text-xs text-night-200">
          <p className="font-semibold text-sand-100">Secret: {setup.secret}</p>
          <p className="mt-1 break-all">URI: {setup.otpAuthUrl}</p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter 6-digit code"
              className="flex-1 rounded-md border border-night-700 bg-night-900 px-2 py-1.5 text-xs text-sand-100"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={pending}
              className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1.5 text-xs text-sage-100"
            >
              Verify
            </button>
          </div>
        </div>
      ) : null}

      {notice ? <p className="mt-2 text-xs text-sage-200">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
