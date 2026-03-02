import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const testDbPath = path.join(repoRoot, "data", "ataraxia.integration.db");

let app: import("express").Express;
let adminToken = "";
let adminRefreshToken = "";

beforeAll(async () => {
  mkdirSync(path.dirname(testDbPath), { recursive: true });
  rmSync(testDbPath, { force: true });

  process.env.NODE_ENV = "test";
  process.env.ATARAXIA_DB_PATH = testDbPath;
  process.env.CORS_ORIGINS = "http://localhost:3000";

  const module = await import("./server.js");
  app = module.createApp();
});

afterAll(() => {
  rmSync(testDbPath, { force: true });
});

describe("API integration", () => {
  it("signs up first user as admin and returns auth token pair", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "Admin User",
      email: "admin@example.com",
      password: "StrongPass123",
      confirmPassword: "StrongPass123",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe("ADMIN");
    expect(typeof response.body.data.accessToken).toBe("string");
    expect(typeof response.body.data.refreshToken).toBe("string");

    adminToken = response.body.data.accessToken;
    adminRefreshToken = response.body.data.refreshToken;
  });

  it("rotates refresh token and invalidates previous refresh session", async () => {
    const refreshed = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: adminRefreshToken,
    });

    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.accessToken).toBe("string");
    expect(typeof refreshed.body.data.refreshToken).toBe("string");

    const staleRefreshAttempt = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: adminRefreshToken,
    });

    expect(staleRefreshAttempt.status).toBe(401);

    adminToken = refreshed.body.data.accessToken;
    adminRefreshToken = refreshed.body.data.refreshToken;
  });

  it("exposes passkey option endpoints with expected auth boundaries", async () => {
    const unauthenticatedPasskeyOptions = await request(app).post("/api/v1/auth/passkey/options").send({
      email: "admin@example.com",
    });

    expect(unauthenticatedPasskeyOptions.status).toBe(401);

    const registerOptions = await request(app)
      .post("/api/v1/security/passkeys/register/options")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(registerOptions.status).toBe(200);
    expect(typeof registerOptions.body.data.challengeId).toBe("string");
    expect(typeof registerOptions.body.data.options.challenge).toBe("string");
  });

  it("creates journal entries and exposes dashboard summary", async () => {
    const createJournal = await request(app)
      .post("/api/v1/journal")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Morning reflection",
        body: "I focused on what is in my control and reduced unnecessary anxiety.",
        mood: "Grounded",
      });

    expect(createJournal.status).toBe(201);

    const summary = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(summary.status).toBe(200);
    expect(summary.body.data.entriesCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(summary.body.data.latestEntries)).toBe(true);
  });

  it("keeps draft lesson private until published", async () => {
    const createLesson = await request(app)
      .post("/api/v1/admin/content/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        slug: "test-draft-lesson",
        title: "Draft Lesson",
        tradition: "Stoicism",
        level: "Beginner",
        minutes: 5,
        summary: "Draft content should not appear publicly until published.",
        status: "DRAFT",
      });

    expect(createLesson.status).toBe(201);

    const publicBefore = await request(app).get("/api/v1/content/library");
    expect(publicBefore.status).toBe(200);
    const draftBefore = publicBefore.body.data.find(
      (item: { slug: string }) => item.slug === "test-draft-lesson",
    );
    expect(draftBefore).toBeUndefined();

    const adminContent = await request(app)
      .get("/api/v1/admin/content")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminContent.status).toBe(200);
    const lesson = adminContent.body.data.lessons.find(
      (item: { slug: string; id: number }) => item.slug === "test-draft-lesson",
    );

    expect(lesson).toBeDefined();

    const publish = await request(app)
      .patch(`/api/v1/admin/content/lessons/${lesson.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });

    expect(publish.status).toBe(200);

    const publicAfter = await request(app).get("/api/v1/content/library");
    expect(publicAfter.status).toBe(200);
    const draftAfter = publicAfter.body.data.find(
      (item: { slug: string }) => item.slug === "test-draft-lesson",
    );
    expect(draftAfter).toBeDefined();
  });
});
