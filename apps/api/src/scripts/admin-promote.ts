import { randomUUID } from "node:crypto";
import { createAdminAuditLog, promoteUserByEmail } from "@areti/db";

function parseEmailArg(argv: string[]): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";

    if (arg.startsWith("--email=")) {
      const value = arg.slice("--email=".length).trim().toLowerCase();
      return value || null;
    }

    if (arg === "--email") {
      const value = (argv[index + 1] ?? "").trim().toLowerCase();
      return value || null;
    }
  }

  return null;
}

function printUsageAndExit(): never {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run admin:promote -- --email=<user@example.com>");
  process.exit(1);
}

const email = parseEmailArg(process.argv.slice(2));

if (!email) {
  printUsageAndExit();
}

const result = promoteUserByEmail(email);

if (result.status === "not_found" || !result.user) {
  // eslint-disable-next-line no-console
  console.error(`No active user found for email "${email}".`);
  process.exit(1);
}

if (result.status === "promoted") {
  createAdminAuditLog({
    id: randomUUID(),
    adminUserId: result.user.id,
    action: "admin_promoted_manual",
    entityType: "user",
    entityId: result.user.id,
    payloadJson: JSON.stringify({
      targetUserId: result.user.id,
      targetEmail: result.user.email,
      via: "admin-promote-cli",
    }),
  });
}

// eslint-disable-next-line no-console
console.log(
  result.status === "already_admin"
    ? `User "${result.user.email}" is already an admin. No changes made.`
    : `User "${result.user.email}" promoted to admin.`,
);
