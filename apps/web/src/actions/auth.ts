"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, deleteCurrentSession } from "@/lib/auth/session";
import { signinSchema, signupSchema } from "@/lib/auth/validation";
import type { AuthActionState } from "@/actions/auth-state";
import { apiSignin, apiSignup, isApiHttpError } from "@/lib/backend-api";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validateSigninMfaInput(
  mfaChallengeId: string,
  mfaCode: string,
): { fieldErrors?: Record<string, string[]> } {
  const hasChallengeId = mfaChallengeId.length > 0;
  const hasCode = mfaCode.length > 0;

  if (hasChallengeId !== hasCode) {
    return {
      fieldErrors: {
        mfaCode: ["Enter the 6-digit MFA code for this challenge."],
      },
    };
  }

  if (hasCode && !/^\d{6}$/.test(mfaCode)) {
    return {
      fieldErrors: {
        mfaCode: ["MFA code must be exactly 6 digits."],
      },
    };
  }

  if (
    hasChallengeId &&
    mfaChallengeId !== "totp" &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      mfaChallengeId,
    )
  ) {
    return {
      fieldErrors: {
        mfaCode: ["MFA challenge is invalid. Sign in again to request a new code."],
      },
    };
  }

  return {};
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = {
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  };

  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await apiSignup(parsed.data);
    await createSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signinAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");
  const mfaChallengeId = getString(formData, "mfaChallengeId").trim();
  const mfaCode = getString(formData, "mfaCode").trim();

  const parsed = signinSchema.safeParse({
    email,
    password,
  });

  if (!parsed.success) {
    return {
      error: "Please check your email and password format.",
      email,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const mfaInputValidation = validateSigninMfaInput(mfaChallengeId, mfaCode);

  if (mfaInputValidation.fieldErrors) {
    return {
      error: "Please provide a valid MFA code.",
      email,
      mfaRequired: true,
      mfaChallengeId,
      fieldErrors: mfaInputValidation.fieldErrors,
    };
  }

  try {
    const result = await apiSignin({
      email: parsed.data.email,
      password: parsed.data.password,
      ...(mfaChallengeId && mfaCode ? { mfaChallengeId, mfaCode } : {}),
    });

    if (result.mfaRequired) {
      return {
        info: "MFA is enabled. Enter the 6-digit code from your authenticator app.",
        email,
        mfaRequired: true,
        mfaChallengeId: result.mfaChallengeId,
      };
    }

    await createSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (isApiHttpError(error) && error.code === "MFA_REQUIRED") {
      return {
        info: "MFA is enabled. Enter the 6-digit verification code.",
        email,
        mfaRequired: true,
      };
    }

    if (error instanceof Error) {
      return {
        error: error.message,
        email,
        ...(mfaChallengeId
          ? {
              mfaRequired: true,
              mfaChallengeId,
            }
          : {}),
      };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteCurrentSession();

  revalidatePath("/");
  redirect("/");
}
