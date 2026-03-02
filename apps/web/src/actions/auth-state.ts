export type AuthActionState = {
  error?: string;
  info?: string;
  mfaRequired?: boolean;
  mfaChallengeId?: string;
  email?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAuthActionState: AuthActionState = {};
