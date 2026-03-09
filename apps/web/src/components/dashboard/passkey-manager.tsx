"use client";

import { startRegistration } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseClientApiData } from "@/lib/client-api";
import { cn } from "@/lib/cn";

type PasskeyManagerProps = {
  enabled: boolean;
  id?: string;
  className?: string;
};

type RegistrationOptionsResponse = {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export function PasskeyManager({ enabled, id, className }: PasskeyManagerProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleRegisterPasskey() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const optionsResponse = await fetch("/api/passkeys/register/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const optionsPayload = await parseClientApiData<RegistrationOptionsResponse>(optionsResponse);

      const registration = (await startRegistration({
        optionsJSON: optionsPayload.options,
      })) as RegistrationResponseJSON;

      const verifyResponse = await fetch("/api/passkeys/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeId: optionsPayload.challengeId,
          response: registration,
        }),
      });

      await parseClientApiData<{ verified: boolean; passkeyEnabled: boolean }>(verifyResponse);

      setNotice("Passkey registered successfully for this account.");
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Unable to register passkey.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div id={id} className={cn("rounded-xl border border-night-700 bg-night-950/70 p-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sand-100">Passkey registration</p>
          <p className="text-xs text-night-200">
            Register a hardware or platform passkey for passwordless sign-in.
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] ${
            enabled
              ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
              : "border-night-600 bg-night-900 text-night-200"
          }`}
        >
          {enabled ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      <button
        type="button"
        onClick={handleRegisterPasskey}
        disabled={pending}
        className="mt-3 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Registering passkey..." : "Register a passkey"}
      </button>

      {notice ? <p className="mt-2 text-xs text-sage-200">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
