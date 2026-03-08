export type AuthActionState = {
  error?: string;
  info?: string;
  mfaRequired?: boolean;
  mfaChallengeId?: string;
  email?: string;
  unverifiedEmail?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAuthActionState: AuthActionState = {};
