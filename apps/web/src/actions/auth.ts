"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/actions/auth-state";
import { createSession, deleteCurrentSession, requireSession } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/onboarding";
import { signinSchema, signupSchema } from "@/lib/auth/validation";
import {
  apiResendVerification,
  apiSignin,
  apiSignup,
  apiUpsertOnboarding,
  apiVerifyEmail,
  isApiHttpError,
} from "@/lib/backend-api";

export type EmailVerificationActionState = {
  error?: string;
  info?: string;
  email?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export type OnboardingActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1";
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
    acceptTerms: getBoolean(formData, "acceptTerms"),
    acceptPrivacy: getBoolean(formData, "acceptPrivacy"),
  };

  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let result: Awaited<ReturnType<typeof apiSignup>>;

  try {
    result = await apiSignup(parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  const search = new URLSearchParams({ email: result.email });

  if (result.debugVerificationToken) {
    search.set("token", result.debugVerificationToken);
  }

  redirect(`/auth/verify-email?${search.toString()}`);
}

export async function verifyEmailAction(
  _prevState: EmailVerificationActionState,
  formData: FormData,
): Promise<EmailVerificationActionState> {
  const token = getString(formData, "token").trim();
  const email = getString(formData, "email").trim().toLowerCase();
  const code = getString(formData, "code").trim();
  const hasCodePayload = Boolean(email) && /^\d{6}$/.test(code);

  if (!token && !hasCodePayload) {
    return {
      error: "Enter the 6-digit verification code.",
      email,
      code,
      fieldErrors: {
        code: ["Verification code must be exactly 6 digits."],
      },
    };
  }

  try {
    const result = await apiVerifyEmail(
      hasCodePayload ? { email, code } : { token, email: email || undefined },
    );
    await createSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
        email,
        code,
      };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/onboarding");
}

export async function resendVerificationAction(
  _prevState: EmailVerificationActionState,
  formData: FormData,
): Promise<EmailVerificationActionState> {
  const email = getString(formData, "email").trim().toLowerCase();

  if (!email) {
    return {
      error: "Enter your email to resend verification.",
      fieldErrors: {
        email: ["Email is required."],
      },
    };
  }

  try {
    const result = await apiResendVerification(email);

    if (result.alreadyVerified) {
      return {
        info: "This account is already verified. You can sign in now.",
        email,
      };
    }

    return {
      info: "Verification email sent. Check your inbox.",
      email,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, email };
    }

    throw error;
  }
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

    if (isApiHttpError(error) && error.code === "EMAIL_NOT_VERIFIED") {
      return {
        error: "Email not verified. Check your inbox or request a new verification email.",
        email,
        unverifiedEmail: email,
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

export async function saveOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await requireSession();

  const input = {
    primaryObjective: getString(formData, "primaryObjective"),
    biggestDifficulty: getString(formData, "biggestDifficulty"),
    mainNeed: getString(formData, "mainNeed"),
    dailyTimeCommitment: getString(formData, "dailyTimeCommitment"),
    coachingStyle: getString(formData, "coachingStyle"),
    contemplativeExperience: getString(formData, "contemplativeExperience"),
    preferredPracticeFormat: getString(formData, "preferredPracticeFormat"),
    successDefinition30d: getString(formData, "successDefinition30d"),
    notes: getString(formData, "notes"),
  };

  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please complete all required onboarding fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await apiUpsertOnboarding(session.accessToken, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/account/settings");

  const redirectTo = getString(formData, "redirectTo").trim();
  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteCurrentSession();

  revalidatePath("/");
  redirect("/");
}
