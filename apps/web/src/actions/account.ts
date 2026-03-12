"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
  apiChangePassword,
  apiDeleteAccount,
  apiPatchMe,
  apiUpsertOnboarding,
  apiSetNotificationPreferences,
} from "@/lib/backend-api";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { avatarPresets } from "@/lib/avatar";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/config";
import { onboardingSchema } from "@/lib/onboarding";

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to save changes.";
}

function redirectWith(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  const normalized = normalizePath(path);
  redirect(search.size > 0 ? `${normalized}?${search.toString()}` : normalized);
}

const usernameSchema = z.string().trim().regex(/^[a-zA-Z0-9_-]{3,40}$/);
const avatarPresetSchema = z.enum(avatarPresets.map((preset) => preset.id) as [string, ...string[]]);
const MAX_AVATAR_UPLOAD_BYTES = 3 * 1024 * 1024;

export async function saveProfileAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const name = str(formData, "name");
  const usernameRaw = str(formData, "username");

  try {
    if (name.length < 2) {
      throw new Error("Name must be at least 2 characters.");
    }

    if (usernameRaw.length > 0) {
      const parsedUsername = usernameSchema.safeParse(usernameRaw);

      if (!parsedUsername.success) {
        throw new Error("Username must be 3-40 chars and use only letters, numbers, _ or -.");
      }
    }

    await apiPatchMe(session.accessToken, {
      name,
      profile: {
        username: usernameRaw.length > 0 ? usernameRaw : null,
        summary: str(formData, "summary"),
      },
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");
  } catch (error) {
    redirectWith("/account/profile", { error: toMessage(error) });
  }

  redirectWith("/account/profile", { saved: "profile" });
}

export async function saveProfileAvatarAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const avatarMode = str(formData, "avatarMode");
  const avatarPreset = str(formData, "avatarPreset");
  const avatarFileValue = formData.get("avatarFile");
  const avatarFile = avatarFileValue instanceof File && avatarFileValue.size > 0 ? avatarFileValue : null;

  try {
    if (avatarFile && avatarFile.size > MAX_AVATAR_UPLOAD_BYTES) {
      throw new Error("Avatar image is too large. Use an image smaller than 3 MB.");
    }

    let avatar:
      | {
          mode: "keep";
        }
      | {
          mode: "initials";
        }
      | {
          mode: "preset";
          preset: string;
        }
      | {
          mode: "upload";
          fileName: string;
          mimeType: string;
          base64Data: string;
        };

    if (avatarFile) {
      if (!avatarFile.type.toLowerCase().startsWith("image/")) {
        throw new Error("Avatar upload must be an image file.");
      }

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error("Avatar upload is empty.");
      }

      avatar = {
        mode: "upload",
        fileName: avatarFile.name || "avatar-image",
        mimeType: avatarFile.type || "image/jpeg",
        base64Data: buffer.toString("base64"),
      };
    } else if (avatarMode === "preset") {
      const parsedPreset = avatarPresetSchema.safeParse(avatarPreset);
      if (!parsedPreset.success) {
        throw new Error("Choose a valid avatar preset.");
      }

      avatar = {
        mode: "preset",
        preset: parsedPreset.data,
      };
    } else if (avatarMode === "initials") {
      avatar = {
        mode: "initials",
      };
    } else if (avatarMode === "keep") {
      avatar = {
        mode: "keep",
      };
    } else {
      throw new Error("Choose how you want to set your avatar.");
    }

    if (avatar.mode !== "keep") {
      await apiPatchMe(session.accessToken, {
        profile: {
          avatar,
        },
      });
    }

    revalidatePath("/account");
    revalidatePath("/account/profile");
  } catch (error) {
    redirectWith("/account/profile", { error: toMessage(error) });
  }

  redirectWith("/account/profile", { saved: "avatar" });
}

export async function savePersonalizationAction(formData: FormData): Promise<void> {
  const session = await requireSession();

  const input = {
    primaryGoal: str(formData, "primaryGoal"),
    preferredTopics: formData
      .getAll("preferredTopics")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0),
    experienceLevel: str(formData, "experienceLevel"),
  };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    redirectWith("/account/preferences", { error: "Choose a valid goal, 1-3 topics, and experience level." });
  }

  try {
    await apiUpsertOnboarding(session.accessToken, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    revalidatePath("/account/preferences");
  } catch (error) {
    redirectWith("/account/preferences", { error: toMessage(error) });
  }

  redirectWith("/account/preferences", { saved: "personalization" });
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const selectedLanguage = normalizeLocale(str(formData, "language") || "en");

  try {
    await apiPatchMe(session.accessToken, {
      preferences: {
        language: selectedLanguage,
        timezone: str(formData, "timezone") || "UTC",
        profileVisibility: (str(formData, "profileVisibility") as "public" | "private" | "contacts") || "private",
        showEmail: bool(formData, "showEmail"),
        showPhone: bool(formData, "showPhone"),
        allowContact: bool(formData, "allowContact"),
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, selectedLanguage, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/account");
    revalidatePath("/account/preferences");
  } catch (error) {
    redirectWith("/account/preferences", { error: toMessage(error) });
  }

  redirectWith("/account/preferences", { saved: "preferences" });
}

export async function saveNotificationPreferencesAction(formData: FormData): Promise<void> {
  const session = await requireSession();

  try {
    await apiSetNotificationPreferences(session.accessToken, {
      emailChallenges: bool(formData, "emailChallenges"),
      emailEvents: bool(formData, "emailEvents"),
      emailUpdates: bool(formData, "emailUpdates"),
      emailMarketing: bool(formData, "emailMarketing"),
      pushChallenges: bool(formData, "pushChallenges"),
      pushEvents: bool(formData, "pushEvents"),
      pushUpdates: bool(formData, "pushUpdates"),
      digest: (str(formData, "digest") as "immediate" | "daily" | "weekly") || "immediate",
    });

    revalidatePath("/account");
    revalidatePath("/account/notifications");
  } catch (error) {
    redirectWith("/account/notifications", { error: toMessage(error) });
  }

  redirectWith("/account/notifications", { saved: "1" });
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const focus = str(formData, "focus") || "password";

  try {
    const oldPassword = str(formData, "oldPassword");
    const newPassword = str(formData, "newPassword");
    const confirmPassword = str(formData, "confirmPassword");

    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new Error("All password fields are required.");
    }

    await apiChangePassword(session.accessToken, {
      oldPassword,
      newPassword,
      confirmPassword,
    });

    revalidatePath("/account/security");
  } catch (error) {
    redirectWith("/account/security", {
      error: toMessage(error),
      focus,
    });
  }

  redirectWith("/account/security", { saved: "1", focus });
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const session = await requireSession();

  try {
    await apiDeleteAccount(session.accessToken, {
      emailConfirm: str(formData, "emailConfirm"),
      passwordConfirm: str(formData, "passwordConfirm"),
    });

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    redirectWith("/account/privacy", { error: toMessage(error), focus: "deletion" });
  }

  redirectWith("/auth/signin", { deleted: "1" });
}
