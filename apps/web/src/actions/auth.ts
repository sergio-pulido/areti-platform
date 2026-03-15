"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/actions/auth-state";
import { createSession, deleteCurrentSession, requireSession } from "@/lib/auth/session";
import { onboardingSchema, resolvePersonalizedOnboardingDestination } from "@/lib/onboarding";
import { completeSignupSchema, signinSchema, signupSchema } from "@/lib/auth/validation";
import {
  apiCompleteSignup,
  apiResendVerification,
  apiSignin,
  apiSignup,
  apiUpsertOnboarding,
  apiVerifyEmail,
  apiForgotPassword,
  apiResetPassword,
  isApiHttpError,
} from "@/lib/backend-api";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth/validation";

export type ForgotPasswordActionState = {
  error?: string;
  info?: string;
  email?: string;
  fieldErrors?: Record<string, string[]>;
};

export type ResetPasswordActionState = {
  error?: string;
  info?: string;
  fieldErrors?: Record<string, string[]>;
};

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

export type CompleteSignupActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  suggestedUsername?: string;
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
    email: getString(formData, "email").trim().toLowerCase(),
    acceptLegal: getBoolean(formData, "acceptLegal"),
    acceptTerms: getBoolean(formData, "acceptTerms"),
    acceptPrivacy: getBoolean(formData, "acceptPrivacy"),
    inviteToken: getString(formData, "inviteToken").trim() || undefined,
    locale: getString(formData, "locale").trim() || undefined,
  };

  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      email: input.email,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let result: Awaited<ReturnType<typeof apiSignup>>;

  try {
    result = await apiSignup(parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, email: input.email };
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
    redirect(`/auth/signup/complete?token=${encodeURIComponent(result.completionToken)}`);
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
        info: "Email already verified. Continue with account setup from your last verification link.",
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

export async function completeSignupAction(
  _prevState: CompleteSignupActionState,
  formData: FormData,
): Promise<CompleteSignupActionState> {
  const input = {
    completionToken: getString(formData, "completionToken").trim(),
    name: getString(formData, "name").trim(),
    username: getString(formData, "username").trim().toLowerCase(),
    password: getString(formData, "password"),
    locale: getString(formData, "locale").trim() || undefined,
    acceptLegal: getBoolean(formData, "acceptLegal"),
    acceptTerms: getBoolean(formData, "acceptTerms"),
    acceptPrivacy: getBoolean(formData, "acceptPrivacy"),
    requiresLegalAtCompletion: getBoolean(formData, "requiresLegalAtCompletion"),
  };

  const parsed = completeSignupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await apiCompleteSignup({
      completionToken: parsed.data.completionToken,
      name: parsed.data.name,
      username: parsed.data.username,
      password: parsed.data.password,
      locale: parsed.data.locale,
      acceptLegal: parsed.data.acceptLegal,
      acceptTerms: parsed.data.acceptTerms,
      acceptPrivacy: parsed.data.acceptPrivacy,
    });

    await createSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    if (isApiHttpError(error) && error.code === "USERNAME_UNAVAILABLE") {
      const suggestedUsername =
        typeof error.data === "object" &&
        error.data !== null &&
        "suggestedUsername" in error.data &&
        typeof (error.data as { suggestedUsername?: unknown }).suggestedUsername === "string"
          ? (error.data as { suggestedUsername: string }).suggestedUsername
          : undefined;

      return {
        error: error.message,
        suggestedUsername,
        fieldErrors: {
          username: [error.message],
        },
      };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/onboarding");
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
        error: "Email not verified. Check your inbox.",
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
    primaryGoal: getString(formData, "primaryGoal"),
    preferredTopics: formData
      .getAll("preferredTopics")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0),
    experienceLevel: getString(formData, "experienceLevel"),
  };

  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Choose one option in each step to continue.",
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
  revalidatePath("/account/preferences");

  const redirectTo = getString(formData, "redirectTo").trim();
  if (redirectTo.startsWith("/") && redirectTo !== "/dashboard") {
    redirect(redirectTo);
  }

  if (redirectTo === "/dashboard") {
    redirect(
      resolvePersonalizedOnboardingDestination({
        primaryGoal: parsed.data.primaryGoal,
        preferredTopics: parsed.data.preferredTopics,
        experienceLevel: parsed.data.experienceLevel,
      }),
    );
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteCurrentSession();

  revalidatePath("/");
  redirect("/");
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = getString(formData, "email").trim().toLowerCase();

  const parsed = forgotPasswordSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      error: "Please enter a valid email address.",
      email,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await apiForgotPassword(parsed.data.email);
    return {
      info: "If that email is registered, we have sent a password reset link.",
      email,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, email };
    }
    throw error;
  }
}

export async function resetPasswordAction(
  _prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const token = getString(formData, "token").trim();
  const newPassword = getString(formData, "newPassword");

  const parsed = resetPasswordSchema.safeParse({ token, newPassword });

  if (!parsed.success) {
    return {
      error: "Please check your new password according to the requirements.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await apiResetPassword({
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  redirect("/auth/signin?reset=success");
}
