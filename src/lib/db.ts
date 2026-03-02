import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export type UserRole = "MEMBER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  userId: string;
  title: string;
  body: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
};

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
};

const DATA_DIR = join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

const SQLITE_PATH = join(DATA_DIR, "ataraxia.db");

const sqlite = globalForDb.sqlite ?? new Database(SQLITE_PATH);
sqlite.pragma("journal_mode = WAL");

if (!globalForDb.sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      mood TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_journal_user_id_created_at
      ON journal_entries(user_id, created_at DESC);
  `);

  globalForDb.sqlite = sqlite;
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: String(row.role) as UserRole,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    tokenHash: String(row.token_hash),
    userId: String(row.user_id),
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
  };
}

function rowToJournalEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    mood: String(row.mood),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export const db = {
  user: {
    findByEmail(email: string): User | null {
      const row = sqlite
        .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
        .get(email) as Record<string, unknown> | undefined;
      return row ? rowToUser(row) : null;
    },

    findById(id: string): User | null {
      const row = sqlite
        .prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
        .get(id) as Record<string, unknown> | undefined;
      return row ? rowToUser(row) : null;
    },

    create(data: { id: string; name: string; email: string; passwordHash: string }): User {
      const timestamp = nowIso();
      sqlite
        .prepare(
          `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'MEMBER', ?, ?)`,
        )
        .run(data.id, data.name, data.email, data.passwordHash, timestamp, timestamp);

      const user = this.findById(data.id);
      if (!user) {
        throw new Error("Failed to create user");
      }

      return user;
    },
  },

  session: {
    create(data: { id: string; tokenHash: string; userId: string; expiresAt: string }): Session {
      const timestamp = nowIso();
      sqlite
        .prepare(
          `INSERT INTO sessions (id, token_hash, user_id, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(data.id, data.tokenHash, data.userId, data.expiresAt, timestamp);

      const session = sqlite
        .prepare("SELECT * FROM sessions WHERE id = ? LIMIT 1")
        .get(data.id) as Record<string, unknown> | undefined;

      if (!session) {
        throw new Error("Failed to create session");
      }

      return rowToSession(session);
    },

    deleteExpiredByUser(userId: string): void {
      sqlite
        .prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?")
        .run(userId, nowIso());
    },

    deleteByTokenHash(tokenHash: string): void {
      sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    },

    findValidByTokenHash(tokenHash: string): (Session & { user: User }) | null {
      const row = sqlite
        .prepare(
          `SELECT
             s.id,
             s.token_hash,
             s.user_id,
             s.expires_at,
             s.created_at,
             u.id as u_id,
             u.name as u_name,
             u.email as u_email,
             u.password_hash as u_password_hash,
             u.role as u_role,
             u.created_at as u_created_at,
             u.updated_at as u_updated_at
           FROM sessions s
           INNER JOIN users u ON u.id = s.user_id
           WHERE s.token_hash = ?
             AND s.expires_at > ?
           LIMIT 1`,
        )
        .get(tokenHash, nowIso()) as Record<string, unknown> | undefined;

      if (!row) {
        return null;
      }

      return {
        id: String(row.id),
        tokenHash: String(row.token_hash),
        userId: String(row.user_id),
        expiresAt: String(row.expires_at),
        createdAt: String(row.created_at),
        user: {
          id: String(row.u_id),
          name: String(row.u_name),
          email: String(row.u_email),
          passwordHash: String(row.u_password_hash),
          role: String(row.u_role) as UserRole,
          createdAt: String(row.u_created_at),
          updatedAt: String(row.u_updated_at),
        },
      };
    },
  },

  journalEntry: {
    create(data: { id: string; userId: string; title: string; body: string; mood: string }): JournalEntry {
      const timestamp = nowIso();
      sqlite
        .prepare(
          `INSERT INTO journal_entries (id, user_id, title, body, mood, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(data.id, data.userId, data.title, data.body, data.mood, timestamp, timestamp);

      const row = sqlite
        .prepare("SELECT * FROM journal_entries WHERE id = ? LIMIT 1")
        .get(data.id) as Record<string, unknown> | undefined;

      if (!row) {
        throw new Error("Failed to create journal entry");
      }

      return rowToJournalEntry(row);
    },

    countByUserId(userId: string): number {
      const row = sqlite
        .prepare("SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?")
        .get(userId) as { count: number };
      return row.count;
    },

    findManyByUserId(userId: string, limit: number): JournalEntry[] {
      const rows = sqlite
        .prepare(
          `SELECT * FROM journal_entries
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ?`,
        )
        .all(userId, limit) as Record<string, unknown>[];

      return rows.map(rowToJournalEntry);
    },
  },
};
