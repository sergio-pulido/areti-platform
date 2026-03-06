"use server";

import { revalidatePath } from "next/cache";
import {
  apiRevokeDevice,
  apiSecurityDeletePasskey,
  apiSecurityRenamePasskey,
  apiSetMfa,
  apiSetPasskeys,
  apiTotpDisable,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

function parseEnabled(formData: FormData): boolean {
  const value = formData.get("enabled");

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("Invalid security toggle payload.");
}

function parseString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateSecurityViews(): void {
  revalidatePath("/account/settings");
  revalidatePath("/account");
}

export async function setMfaEnabledAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const enabled = parseEnabled(formData);

  await apiSetMfa(session.accessToken, enabled);

  revalidateSecurityViews();
}

export async function setPasskeyEnabledAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const enabled = parseEnabled(formData);

  await apiSetPasskeys(session.accessToken, enabled);

  revalidateSecurityViews();
}

export async function renamePasskeyAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const passkeyId = parseString(formData, "passkeyId");
  const nickname = parseString(formData, "nickname");

  if (!passkeyId || !nickname) {
    throw new Error("Passkey id and nickname are required.");
  }

  await apiSecurityRenamePasskey(session.accessToken, passkeyId, nickname);
  revalidateSecurityViews();
}

export async function deletePasskeyAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const passkeyId = parseString(formData, "passkeyId");

  if (!passkeyId) {
    throw new Error("Passkey id is required.");
  }

  await apiSecurityDeletePasskey(session.accessToken, passkeyId);
  revalidateSecurityViews();
}

export async function revokeDeviceAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const deviceId = parseString(formData, "deviceId");

  if (!deviceId) {
    throw new Error("Device id is required.");
  }

  await apiRevokeDevice(session.accessToken, deviceId);
  revalidateSecurityViews();
}

export async function disableTotpAction(): Promise<void> {
  const session = await requireSession();
  await apiTotpDisable(session.accessToken);
  revalidateSecurityViews();
}
