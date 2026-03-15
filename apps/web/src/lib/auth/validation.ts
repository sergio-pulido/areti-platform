import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";

const baseEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Use a valid email address")
  .max(120, "Email is too long");

const basePassword = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  )
  .regex(/[a-z]/, "Password needs at least one lowercase letter")
  .regex(/[A-Z]/, "Password needs at least one uppercase letter")
  .regex(/\d/, "Password needs at least one number");

export const signupSchema = z
  .object({
    email: baseEmail,
    acceptLegal: z.boolean().optional(),
    acceptTerms: z.boolean().optional(),
    acceptPrivacy: z.boolean().optional(),
    inviteToken: z.string().trim().min(32).max(512).optional(),
    locale: z.string().trim().min(2).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    const hasInviteToken = Boolean(data.inviteToken);
    const acceptedTerms = data.acceptTerms === true || data.acceptLegal === true;
    const acceptedPrivacy = data.acceptPrivacy === true || data.acceptLegal === true;

    if (!hasInviteToken && !acceptedTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the Terms of Service",
        path: ["acceptTerms"],
      });
    }

    if (!hasInviteToken && !acceptedPrivacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the Privacy Policy",
        path: ["acceptPrivacy"],
      });
    }
  });

export const completeSignupSchema = z.object({
  completionToken: z.string().trim().min(16).max(512),
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,40}$/, "Username must use 3-40 lowercase letters, numbers, _ or -"),
  password: basePassword,
  locale: z.string().trim().min(2).max(20).optional(),
  acceptLegal: z.boolean().optional(),
  acceptTerms: z.boolean().optional(),
  acceptPrivacy: z.boolean().optional(),
  requiresLegalAtCompletion: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.requiresLegalAtCompletion) {
    const acceptedTerms = data.acceptTerms === true || data.acceptLegal === true;
    const acceptedPrivacy = data.acceptPrivacy === true || data.acceptLegal === true;
    if (!acceptedTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the Terms of Service",
        path: ["acceptTerms"],
      });
    }
    if (!acceptedPrivacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the Privacy Policy",
        path: ["acceptPrivacy"],
      });
    }
  }
});

export const signinSchema = z.object({
  email: baseEmail,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: baseEmail,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(512),
  newPassword: basePassword,
});
