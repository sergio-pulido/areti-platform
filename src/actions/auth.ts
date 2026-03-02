"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { createSession, deleteCurrentSession } from "@/lib/auth/session";
import { signinSchema, signupSchema } from "@/lib/auth/validation";
import { assertWithinRateLimit } from "@/lib/security/rate-limit";
import { db } from "@/lib/db";
import type { AuthActionState } from "@/actions/auth-state";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRateLimitKey(ip: string, email: string, intent: "signin" | "signup"): string {
  return `${intent}:${ip}:${email.toLowerCase()}`;
}

async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return headerList.get("x-real-ip") ?? "unknown";
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

  const ip = await getRequestIp();
  try {
    assertWithinRateLimit(buildRateLimitKey(ip, parsed.data.email, "signup"));
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  const existing = db.user.findByEmail(parsed.data.email);

  if (existing) {
    return {
      error: "An account with this email already exists.",
    };
  }

  const user = db.user.create({
    id: randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
  });

  await createSession(user.id);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signinAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = {
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  };

  const parsed = signinSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please check your email and password format.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ip = await getRequestIp();
  try {
    assertWithinRateLimit(buildRateLimitKey(ip, parsed.data.email, "signin"));
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  const user = db.user.findByEmail(parsed.data.email);

  if (!user) {
    return {
      error: "Invalid email or password.",
    };
  }

  const isValid = await verifyPassword(user.passwordHash, parsed.data.password);

  if (!isValid) {
    return {
      error: "Invalid email or password.",
    };
  }

  await createSession(user.id);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteCurrentSession();

  revalidatePath("/");
  redirect("/");
}
