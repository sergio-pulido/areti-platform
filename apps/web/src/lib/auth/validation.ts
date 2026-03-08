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
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: baseEmail,
    password: basePassword,
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
    acceptPrivacy: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms, {
    message: "You must accept the Terms of Service",
    path: ["acceptTerms"],
  })
  .refine((data) => data.acceptPrivacy, {
    message: "You must accept the Privacy Policy",
    path: ["acceptPrivacy"],
  });

export const signinSchema = z.object({
  email: baseEmail,
  password: z.string().min(1, "Password is required"),
});
