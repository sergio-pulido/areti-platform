"use server";

import { revalidatePath } from "next/cache";
import {
  apiAdminCreateInvitation,
  apiAdminRevokeInvitation,
  isApiHttpError,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export type AdminInvitationCreateState = {
  error?: string;
  created?: {
    id: string;
    token: string;
    inviteUrl: string;
    email: string | null;
    expiresAt: string;
  };
};

export const initialAdminInvitationCreateState: AdminInvitationCreateState = {};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminAccessToken(): Promise<string> {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return session.accessToken;
}

export async function createInvitationAdminAction(
  _prevState: AdminInvitationCreateState,
  formData: FormData,
): Promise<AdminInvitationCreateState> {
  const token = await requireAdminAccessToken();
  const email = getString(formData, "email").toLowerCase();
  const expiresAtRaw = getString(formData, "expiresAt");

  let expiresAt: string | undefined;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Expiration date is invalid." };
    }
    expiresAt = parsed.toISOString();
  }

  try {
    const created = await apiAdminCreateInvitation(token, {
      email: email || undefined,
      expiresAt,
      maxUses: 1,
      roleToGrant: "user",
    });

    revalidatePath("/admin/invitations");

    return {
      created: {
        id: created.invitation.id,
        token: created.token,
        inviteUrl: created.inviteUrl,
        email: created.invitation.email,
        expiresAt: created.invitation.expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Unable to create invitation." };
  }
}

export async function revokeInvitationAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminAccessToken();
  const invitationId = getString(formData, "invitationId");
  if (!invitationId) {
    throw new Error("Invitation id is required.");
  }

  try {
    await apiAdminRevokeInvitation(token, invitationId);
  } catch (error) {
    if (isApiHttpError(error)) {
      throw new Error(error.message);
    }
    throw error;
  }

  revalidatePath("/admin/invitations");
}
