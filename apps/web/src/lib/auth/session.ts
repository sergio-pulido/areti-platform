import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  apiLogout,
  apiMe,
  apiRefresh,
  isApiHttpError,
  type AuthTokenPair,
} from "@/lib/backend-api";
import {
  SESSION_COOKIE_NAME,
  SESSION_TOKEN_SEPARATOR,
  SESSION_TTL_DAYS,
} from "@/lib/auth/constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
};

type SessionTokens = {
  accessToken: string;
  refreshToken: string | null;
};

export type SessionContext = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string | null;
};

function isApiUnavailableError(error: unknown): boolean {
  return isApiHttpError(error) && error.status >= 500;
}

function createExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_TTL_DAYS);
  return expires;
}

function encodeSessionTokens(tokens: SessionTokens): string {
  if (!tokens.refreshToken) {
    return tokens.accessToken;
  }

  return `${tokens.accessToken}${SESSION_TOKEN_SEPARATOR}${tokens.refreshToken}`;
}

function decodeSessionTokens(value: string | undefined): SessionTokens | null {
  if (!value) {
    return null;
  }

  const [accessToken, refreshToken] = value.split(SESSION_TOKEN_SEPARATOR, 2);

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken || null,
  };
}

async function setSessionCookie(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encodeSessionTokens(tokens), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: createExpiryDate(),
    path: "/",
  });
}

async function readSessionTokens(): Promise<SessionTokens | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decodeSessionTokens(rawValue);
}

async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function trySetSessionCookie(tokens: SessionTokens): Promise<void> {
  try {
    await setSessionCookie(tokens);
  } catch {
    // Cookie mutation is not allowed in some render contexts.
  }
}

async function tryClearSessionCookie(): Promise<void> {
  try {
    await clearSessionCookie();
  } catch {
    // Cookie mutation is not allowed in some render contexts.
  }
}

async function getSessionFromAccess(tokens: SessionTokens): Promise<SessionContext> {
  const me = await apiMe(tokens.accessToken);

  const nextTokens: SessionTokens = {
    accessToken: me.accessToken,
    refreshToken: tokens.refreshToken,
  };

  if (nextTokens.accessToken !== tokens.accessToken) {
    await trySetSessionCookie(nextTokens);
  }

  return {
    user: me.user,
    accessToken: nextTokens.accessToken,
    refreshToken: nextTokens.refreshToken,
  };
}

async function resolveSession(): Promise<SessionContext | null> {
  const tokens = await readSessionTokens();

  if (!tokens) {
    return null;
  }

  try {
    return await getSessionFromAccess(tokens);
  } catch (error) {
    if (isApiUnavailableError(error)) {
      return null;
    }

    if (!isApiHttpError(error) || error.status !== 401 || !tokens.refreshToken) {
      if (isApiHttpError(error) && error.status === 401) {
        await tryClearSessionCookie();
        return null;
      }

      throw error;
    }

    try {
      const rotated = await apiRefresh(tokens.refreshToken);

      await trySetSessionCookie({
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
      });

      return await getSessionFromAccess({
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
      });
    } catch (refreshError) {
      if (isApiUnavailableError(refreshError)) {
        return null;
      }

      if (isApiHttpError(refreshError) && refreshError.status === 401) {
        await tryClearSessionCookie();
        return null;
      }

      throw refreshError;
    }
  }
}

export async function createSession(tokens: AuthTokenPair): Promise<void> {
  await setSessionCookie({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const session = await resolveSession();
  return session?.accessToken ?? null;
}

export async function getSessionRefreshToken(): Promise<string | null> {
  const session = await resolveSession();
  return session?.refreshToken ?? null;
}

export async function deleteCurrentSession(): Promise<void> {
  const tokens = await readSessionTokens();

  let logoutError: Error | null = null;

  if (tokens) {
    try {
      await apiLogout(tokens.accessToken, tokens.refreshToken ?? undefined);
    } catch (error) {
      if (
        isApiHttpError(error) &&
        error.status === 401 &&
        tokens.refreshToken
      ) {
        try {
          const rotated = await apiRefresh(tokens.refreshToken);
          await apiLogout(rotated.accessToken, rotated.refreshToken);
        } catch (refreshError) {
          if (refreshError instanceof Error) {
            logoutError = refreshError;
          } else {
            throw refreshError;
          }
        }
      } else if (error instanceof Error) {
        logoutError = error;
      } else {
        throw error;
      }
    }
  }

  await clearSessionCookie();

  if (logoutError) {
    throw logoutError;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await resolveSession();
  return session?.user ?? null;
}

export async function requireSession(): Promise<SessionContext> {
  const session = await resolveSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return session;
}

export async function requireUser(): Promise<CurrentUser> {
  const session = await requireSession();
  return session.user;
}

export async function requireOnboardedSession(): Promise<SessionContext> {
  const session = await requireSession();

  if (!session.user.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return session;
}
