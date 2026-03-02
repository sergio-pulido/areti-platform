import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { createSessionToken, hashSessionToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/auth/constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "ADMIN";
};

function createExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_TTL_DAYS);
  return expires;
}

async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function createSession(userId: string): Promise<void> {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = createExpiryDate();

  db.session.deleteExpiredByUser(userId);
  db.session.create({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  });

  await setSessionCookie(token, expiresAt);
}

export async function deleteCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    db.session.deleteByTokenHash(hashSessionToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = db.session.findValidByTokenHash(hashSessionToken(token));

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return user;
}
