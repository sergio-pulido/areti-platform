# Specification: Forgot & Reset Password

## 1. Goal
Provide a secure way for users to reset their forgotten passwords via email link.

## 2. Requirements
- Send a password reset email if the user exists. Wait, to prevent email enumeration, we should return a success message regardless of whether the email exists.
- Expiration time for reset links (e.g., 30 minutes).
- One-time use for the reset link.
- Secure token generation (cryptographically secure random string).
- Store only the hash of the token in the database.
- A user UI for entering the email.
- A user UI for entering the new password (with the token provided in the URL).

## 3. Database Schema Updates
Add a new table `password_reset_tokens` to `packages/db/src/schema.ts` (SQLite):
```typescript
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  consumedAt: text("consumed_at"),
});
```

## 4. API Endpoints
**`POST /auth/forgot-password`**
- Input: `{ email: string }`
- Actions:
  - If user not found, return `200 OK` (prevent email enumeration).
  - If user found, generate a 32-byte secure token.
  - Hash token via SHA-256.
  - Insert record into `password_reset_tokens` (expires in 30 mins).
  - Send email with link: `https://<domain>/reset-password?token=<token>`.
- Output: `200 OK`

**`POST /auth/reset-password`**
- Input: `{ token: string, newPassword: string }`
- Actions:
  - Hash the incoming token via SHA-256 to find matching record in DB.
  - If token not found, expired, or consumed, return `400 Bad Request`.
  - Hash `newPassword` (Argon2 as per package.json argon2 dependency).
  - Update `users.passwordHash`.
  - Set `consumedAt = fn.now()` on the token record.
- Output: `200 OK`

## 5. Web UI Pages (Next.js 16/React 19)
- `apps/web/src/app/(auth)/forgot-password/page.tsx`: Presents a form for the email. Success state shows "If an account exists, an email has been sent."
- `apps/web/src/app/(auth)/reset-password/page.tsx`: Expects `?token=` in search params. Form to enter `newPassword`. On success, redirect to login.

## 6. Email Service
Add to `apps/api/src/services/email.service.ts` (or similar) a method to send the `ForgotPasswordEmail`.
