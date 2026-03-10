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
const adminEmail = "admin@example.com";

async function waitForReflectionReady(
  appRef: import("express").Express,
  token: string,
  reflectionId: string,
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const detail = await request(appRef)
      .get(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${token}`);

    if (detail.status !== 200) {
      throw new Error(`Unable to read reflection while polling. status=${detail.status}`);
    }

    const data = detail.body.data as Record<string, unknown>;
    if (data.status === "ready") {
      return data;
    }

    if (data.status === "failed") {
      throw new Error(`Reflection processing failed: ${String(data.processingError ?? "")}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  throw new Error("Timed out waiting for reflection processing.");
}

beforeAll(async () => {
  mkdirSync(path.dirname(testDbPath), { recursive: true });
  rmSync(testDbPath, { force: true });

  process.env.NODE_ENV = "test";
  process.env.ATARAXIA_DB_PATH = testDbPath;
  process.env.CORS_ORIGINS = "http://localhost:3000";
  process.env.CHAT_PROVIDER_ORDER = "deepseek,openai";
  process.env.DEEPSEEK_API_KEY = "";
  process.env.OPENAI_API_KEY = "";
  process.env.CHAT_CONTEXT_CAPACITY = "1800";
  process.env.CHAT_CONTEXT_RECENT_RAW_MESSAGES = "4";
  process.env.CHAT_CONTEXT_SUMMARIZE_PERCENT = "45";
  process.env.CHAT_CONTEXT_WARNING_PERCENT = "60";
  process.env.CHAT_CONTEXT_DEGRADED_PERCENT = "80";

  const module = await import("./server.js");
  app = module.createApp();
});

afterAll(() => {
  rmSync(testDbPath, { force: true });
});

describe("API integration", () => {
  it("requires legal consent during signup", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      email: adminEmail,
      password: "StrongPass123",
    });

    expect(response.status).toBe(400);
  });

  it("signs up with verification-required response, blocks signin until verified, then verifies and returns auth token pair", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      email: adminEmail,
      password: "StrongPass123",
      acceptLegal: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.verificationRequired).toBe(true);
    expect(typeof response.body.data.debugVerificationCode).toBe("string");
    expect(typeof response.body.data.debugVerificationToken).toBe("string");

    const blockedSignin = await request(app).post("/api/v1/auth/signin").send({
      email: adminEmail,
      password: "StrongPass123",
    });
    expect(blockedSignin.status).toBe(401);
    expect(blockedSignin.body.error).toBe("EMAIL_NOT_VERIFIED");

    const verification = await request(app).post("/api/v1/auth/verify-email").send({
      token: "stale_token_value_which_is_long_enough",
      email: adminEmail,
      code: response.body.data.debugVerificationCode,
    });

    expect(verification.status).toBe(200);
    expect(verification.body.data.user.role).toBe("ADMIN");
    expect(typeof verification.body.data.accessToken).toBe("string");
    expect(typeof verification.body.data.refreshToken).toBe("string");

    adminToken = verification.body.data.accessToken;
    adminRefreshToken = verification.body.data.refreshToken;
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

  it("supports onboarding read/write and completion metadata", async () => {
    const initial = await request(app)
      .get("/api/v1/onboarding")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(initial.status).toBe(200);
    expect(initial.body.data.profile).toBeNull();
    expect(initial.body.data.onboardingCompletedAt).toBeNull();

    const saved = await request(app)
      .put("/api/v1/onboarding")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        primaryObjective: "Calm anxiety",
        dailyTimeCommitment: "10 min",
        preferredPracticeFormat: "A short practice",
        notes: "Need focused weekday routines.",
      });

    expect(saved.status).toBe(200);
    expect(saved.body.data.profile.primaryObjective).toBe("Calm anxiety");
    expect(typeof saved.body.data.onboardingCompletedAt).toBe("string");

    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(me.status).toBe(200);
    expect(typeof me.body.data.user.onboardingCompletedAt).toBe("string");
    expect(typeof me.body.data.profile.id).toBe("string");
    expect(typeof me.body.data.preferences.id).toBe("string");
    expect(typeof me.body.data.preferences.language).toBe("string");
  });

  it("patches account profile and preferences with persistence", async () => {
    const patchMe = await request(app)
      .patch("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Admin Updated",
        profile: {
          username: "admin_updated",
          summary: "Focused on practical stoicism.",
          phone: "+1 555 123 4567",
          city: "New York",
          country: "US",
          socialLinks: [
            { label: "Website", url: "https://example.com" },
            { label: "LinkedIn", url: "https://linkedin.com/in/example" },
          ],
        },
        preferences: {
          language: "es",
          timezone: "Europe/Madrid",
          profileVisibility: "contacts",
          showEmail: true,
          showPhone: true,
          allowContact: false,
        },
      });

    expect(patchMe.status).toBe(200);
    expect(patchMe.body.data.user.name).toBe("Admin Updated");
    expect(patchMe.body.data.profile.username).toBe("admin_updated");
    expect(patchMe.body.data.profile.city).toBe("New York");
    expect(patchMe.body.data.preferences.language).toBe("es");
    expect(patchMe.body.data.preferences.profileVisibility).toBe("contacts");
    expect(patchMe.body.data.preferences.allowContact).toBe(false);

    const meAfterPatch = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(meAfterPatch.status).toBe(200);
    expect(meAfterPatch.body.data.user.name).toBe("Admin Updated");
    expect(meAfterPatch.body.data.profile.username).toBe("admin_updated");
    expect(meAfterPatch.body.data.profile.city).toBe("New York");
    expect(meAfterPatch.body.data.preferences.timezone).toBe("Europe/Madrid");
  });

  it("exposes passkey option endpoints with expected auth boundaries", async () => {
    const unauthenticatedPasskeyOptions = await request(app).post("/api/v1/auth/passkey/options").send({
      email: adminEmail,
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

  it("creates journal entries, tracks content completion, and exposes dashboard summary", async () => {
    const rewardsBefore = await request(app)
      .get("/api/v1/progress/rewards")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(rewardsBefore.status).toBe(200);
    expect(rewardsBefore.body.data.earnedCount).toBe(0);
    expect(
      rewardsBefore.body.data.milestones.find(
        (item: { id: string; earned: boolean }) => item.id === "first-reflection",
      )?.earned,
    ).toBe(false);

    const createJournal = await request(app)
      .post("/api/v1/journal")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Morning reflection",
        body: "I focused on what is in my control and reduced unnecessary anxiety.",
        mood: "Grounded",
      });

    expect(createJournal.status).toBe(201);

    const completeLesson = await request(app)
      .post("/api/v1/progress/complete")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        contentKind: "lesson",
        contentSlug: "friendship-resilience",
      });
    expect(completeLesson.status).toBe(201);

    const completePractice = await request(app)
      .post("/api/v1/progress/complete")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        contentKind: "practice",
        contentSlug: "morning-premeditatio",
      });
    expect(completePractice.status).toBe(201);

    const summary = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(summary.status).toBe(200);
    expect(summary.body.data.entriesCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(summary.body.data.latestEntries)).toBe(true);
    expect(typeof summary.body.data.progress.streakDays).toBe("number");
    expect(typeof summary.body.data.progress.reflectionsThisWeek).toBe("number");
    expect(typeof summary.body.data.progress.daysSinceLastEntry).toBe("number");
    expect(typeof summary.body.data.progress.practicesCompletedThisWeek).toBe("number");
    expect(typeof summary.body.data.progress.lessonsCompleted).toBe("number");
    expect(typeof summary.body.data.progress.totalLessons).toBe("number");
    expect(Array.isArray(summary.body.data.progress.recentCompletions)).toBe(true);
    expect(summary.body.data.progress.practicesCompletedThisWeek).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.progress.lessonsCompleted).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.progress.recentCompletions.length).toBeGreaterThanOrEqual(2);

    const completions = await request(app)
      .get("/api/v1/progress/completions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(completions.status).toBe(200);
    expect(Array.isArray(completions.body.data)).toBe(true);
    expect(
      completions.body.data.some(
        (item: { contentKind: string; contentSlug: string }) =>
          item.contentKind === "lesson" && item.contentSlug === "friendship-resilience",
      ),
    ).toBe(true);

    const rewardsAfter = await request(app)
      .get("/api/v1/progress/rewards")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(rewardsAfter.status).toBe(200);
    expect(rewardsAfter.body.data.earnedCount).toBeGreaterThanOrEqual(2);
    expect(
      rewardsAfter.body.data.milestones.find(
        (item: { id: string; earned: boolean }) => item.id === "first-reflection",
      )?.earned,
    ).toBe(true);
    expect(
      rewardsAfter.body.data.milestones.find(
        (item: { id: string; earned: boolean }) => item.id === "lesson-1",
      )?.earned,
    ).toBe(true);
  });

  it("serves academy catalog, concept links, search, and internal query payloads", async () => {
    const overview = await request(app).get("/api/v1/academy");
    expect(overview.status).toBe(200);
    expect(overview.body.data.overview.domainCount).toBeGreaterThan(0);
    expect(overview.body.data.overview.pathCount).toBeGreaterThan(0);
    expect(Array.isArray(overview.body.data.featuredPaths)).toBe(true);

    const traditions = await request(app).get("/api/v1/academy/traditions?domain=philosophy");
    expect(traditions.status).toBe(200);
    expect(Array.isArray(traditions.body.data)).toBe(true);
    expect(
      traditions.body.data.some((item: { slug: string }) => item.slug === "stoicism"),
    ).toBe(true);

    const conceptLinks = await request(app).get("/api/v1/academy/concepts/virtue/links");
    expect(conceptLinks.status).toBe(200);
    expect(conceptLinks.body.data.concept.slug).toBe("virtue");
    expect(conceptLinks.body.data.traditions.length).toBeGreaterThan(0);
    expect(conceptLinks.body.data.persons.length).toBeGreaterThan(0);
    expect(conceptLinks.body.data.works.length).toBeGreaterThan(0);

    const search = await request(app).get("/api/v1/academy/search?q=stoic&limit=10");
    expect(search.status).toBe(200);
    expect(Array.isArray(search.body.data)).toBe(true);
    expect(search.body.data.length).toBeGreaterThan(0);

    const unauthQuery = await request(app).post("/api/v1/academy/query").send({
      entity: "paths",
      includeRelations: true,
      limit: 3,
    });
    expect(unauthQuery.status).toBe(401);

    const authQuery = await request(app)
      .post("/api/v1/academy/query")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        entity: "paths",
        includeRelations: true,
        limit: 3,
      });

    expect(authQuery.status).toBe(200);
    expect(authQuery.body.data.entity).toBe("paths");
    expect(Array.isArray(authQuery.body.data.paths)).toBe(true);
    expect(authQuery.body.data.paths.length).toBeGreaterThan(0);
    expect(typeof authQuery.body.data.paths[0].difficultyLevel).toBe("string");
    expect(typeof authQuery.body.data.paths[0].recommendationWeight).toBe("number");
  });

  it("supports admin academy curation workflows", async () => {
    const curation = await request(app)
      .get("/api/v1/admin/academy/curation?limit=120")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(curation.status).toBe(200);
    expect(Array.isArray(curation.body.data.paths)).toBe(true);
    expect(Array.isArray(curation.body.data.persons)).toBe(true);
    expect(Array.isArray(curation.body.data.concepts)).toBe(true);

    const path = curation.body.data.paths[0] as {
      id: number;
      title: string;
      summary: string;
      progressionOrder: number;
      recommendationWeight: number;
      recommendationHint: string;
      items: Array<{
        entityType: "tradition" | "person" | "work" | "concept";
        entityId: number;
        rationale: string;
        sortOrder: number;
      }>;
    };
    const person = curation.body.data.persons[0] as { id: number };
    const sourcePerson = curation.body.data.persons[0] as { id: number };
    const targetPerson = curation.body.data.persons[1] as { id: number };
    const concept = curation.body.data.concepts[0] as { id: number };
    const tradition = curation.body.data.traditions[0] as { id: number };
    const conceptTraditionLinks = curation.body.data.conceptTraditionLinks as Array<{
      conceptId: number;
      traditionId: number;
    }>;

    const availableConcepts = curation.body.data.concepts as Array<{ id: number }>;
    const availableTraditions = curation.body.data.traditions as Array<{ id: number }>;

    const existingPairs = new Set(
      conceptTraditionLinks.map((link) => `${link.conceptId}:${link.traditionId}`),
    );

    const candidatePair =
      availableConcepts.flatMap((conceptItem) =>
        availableTraditions.map((traditionItem) => ({
          conceptId: conceptItem.id,
          traditionId: traditionItem.id,
        })),
      ).find((pair) => !existingPairs.has(`${pair.conceptId}:${pair.traditionId}`)) ?? null;

    expect(path).toBeTruthy();
    expect(person).toBeTruthy();
    expect(sourcePerson).toBeTruthy();
    expect(targetPerson).toBeTruthy();
    expect(concept).toBeTruthy();
    expect(tradition).toBeTruthy();

    const updatedPath = await request(app)
      .patch(`/api/v1/admin/academy/paths/${path.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: path.title,
        summary: path.summary,
        progressionOrder: path.progressionOrder + 1,
        recommendationWeight: path.recommendationWeight + 1,
        recommendationHint: path.recommendationHint,
      });

    expect(updatedPath.status).toBe(200);
    expect(updatedPath.body.data.progressionOrder).toBe(path.progressionOrder + 1);

    const replacedItems = await request(app)
      .put(`/api/v1/admin/academy/paths/${path.id}/items`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        items: (path.items ?? []).slice(0, 3).map((item, index) => ({
          entityType: item.entityType,
          entityId: item.entityId,
          rationale: `${item.rationale ?? ""}`.slice(0, 100),
          sortOrder: index,
        })),
      });

    expect(replacedItems.status).toBe(200);
    expect(Array.isArray(replacedItems.body.data.items)).toBe(true);

    const updatedPerson = await request(app)
      .patch(`/api/v1/admin/academy/persons/${person.id}/editorial`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        credibilityBand: "major",
        evidenceProfile: "curated-editorial",
        claimRiskLevel: "low",
      });

    expect(updatedPerson.status).toBe(200);
    expect(updatedPerson.body.data.credibilityBand).toBe("major");
    expect(updatedPerson.body.data.evidenceProfile).toBe("curated-editorial");
    expect(updatedPerson.body.data.claimRiskLevel).toBe("low");

    const upsertRelationship = await request(app)
      .post("/api/v1/admin/academy/relationships/persons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sourcePersonId: sourcePerson.id,
        targetPersonId: targetPerson.id,
        relationshipType: "influenced_by",
        notes: "integration-test",
      });

    expect(upsertRelationship.status).toBe(200);
    expect(typeof upsertRelationship.body.data.id).toBe("number");

    const deleteRelationship = await request(app)
      .delete(`/api/v1/admin/academy/relationships/persons/${upsertRelationship.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRelationship.status).toBe(200);
    expect(deleteRelationship.body.data.ok).toBe(true);

    const conceptIdForRelation = candidatePair?.conceptId ?? concept.id;
    const traditionIdForRelation = candidatePair?.traditionId ?? tradition.id;

    const upsertConceptRelation = await request(app)
      .post("/api/v1/admin/academy/relationships/concepts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        conceptId: conceptIdForRelation,
        entityType: "tradition",
        entityId: traditionIdForRelation,
        sortOrder: 1,
      });

    expect(upsertConceptRelation.status).toBe(200);
    expect(upsertConceptRelation.body.data.ok).toBe(true);

    const deleteConceptRelation = await request(app)
      .delete("/api/v1/admin/academy/relationships/concepts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        conceptId: conceptIdForRelation,
        entityType: "tradition",
        entityId: traditionIdForRelation,
      });

    expect(deleteConceptRelation.status).toBe(200);
    expect(deleteConceptRelation.body.data.ok).toBe(true);

    if (!candidatePair) {
      const restoreConceptRelation = await request(app)
        .post("/api/v1/admin/academy/relationships/concepts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          conceptId: conceptIdForRelation,
          entityType: "tradition",
          entityId: traditionIdForRelation,
          sortOrder: 1,
        });

      expect(restoreConceptRelation.status).toBe(200);
    }
  });

  it("supports full reflections lifecycle, processing, and companion handoff", async () => {
    const created = await request(app)
      .post("/api/v1/reflections")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sourceType: "text",
        title: "Decision tension",
        rawText:
          "I keep saying I should stay in this role, but I want to move toward deeper work. I feel split between safety and meaning.",
        tags: ["career", "decision"],
      });

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("processing");
    expect(created.body.data.sourceType).toBe("text");
    expect(Array.isArray(created.body.data.tags)).toBe(true);

    const reflectionId = created.body.data.id as string;
    expect(typeof reflectionId).toBe("string");

    const ready = await waitForReflectionReady(app, adminToken, reflectionId);
    expect(ready.status).toBe("ready");
    expect(typeof ready.cleanTranscript).toBe("string");
    expect(typeof ready.refinedText).toBe("string");
    expect(typeof ready.commentary).toBe("string");
    expect(Array.isArray(ready.processingJobs)).toBe(true);

    const listed = await request(app)
      .get("/api/v1/reflections?page=1&pageSize=10&q=decision")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body.data.items)).toBe(true);
    expect(
      listed.body.data.items.some((item: { id: string }) => item.id === reflectionId),
    ).toBe(true);

    const updated = await request(app)
      .patch(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Decision tension (updated)",
        tags: ["career", "clarity"],
        isFavorite: true,
        refinedText: "I feel torn between stability and meaningful work. Naming that conflict helps me see the real choice ahead.",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Decision tension (updated)");
    expect(updated.body.data.isFavorite).toBe(true);
    expect(updated.body.data.tags).toContain("clarity");

    const commentaryRefresh = await request(app)
      .post(`/api/v1/reflections/${reflectionId}/commentary/regenerate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(commentaryRefresh.status).toBe(200);
    expect(typeof commentaryRefresh.body.data.commentary).toBe("string");
    expect(commentaryRefresh.body.data.commentary.length).toBeGreaterThan(0);

    const sendToCompanion = await request(app)
      .post(`/api/v1/reflections/${reflectionId}/send-to-companion`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(sendToCompanion.status).toBe(201);
    expect(typeof sendToCompanion.body.data.threadId).toBe("string");
    expect(sendToCompanion.body.data.href).toContain("/chat?thread=");

    const threadMessages = await request(app)
      .get(`/api/v1/chat/threads/${sendToCompanion.body.data.threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(threadMessages.status).toBe(200);
    expect(Array.isArray(threadMessages.body.data)).toBe(true);
    expect(threadMessages.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      threadMessages.body.data.some((message: { role: string }) => message.role === "user"),
    ).toBe(true);
    expect(
      threadMessages.body.data.some((message: { role: string }) => message.role === "assistant"),
    ).toBe(true);

    const deleted = await request(app)
      .delete(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(afterDelete.status).toBe(404);
  });

  it("enforces reflection ownership checks", async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `reflection-owner-${unique}@example.com`;
    const password = "StrongPass789";

    const signup = await request(app).post("/api/v1/auth/signup").send({
      email,
      password,
      acceptLegal: true,
    });
    expect(signup.status).toBe(201);

    const verify = await request(app).post("/api/v1/auth/verify-email").send({
      email,
      code: signup.body.data.debugVerificationCode,
    });
    expect(verify.status).toBe(200);
    const otherUserToken = verify.body.data.accessToken as string;

    const ownedReflection = await request(app)
      .post("/api/v1/reflections")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sourceType: "text",
        title: "Private note",
        rawText: "This should not be visible to another user.",
      });
    expect(ownedReflection.status).toBe(201);
    const reflectionId = ownedReflection.body.data.id as string;

    const forbiddenDetail = await request(app)
      .get(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${otherUserToken}`);
    expect(forbiddenDetail.status).toBe(404);

    const forbiddenPatch = await request(app)
      .patch(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({ title: "Hacked" });
    expect(forbiddenPatch.status).toBe(404);

    const forbiddenDelete = await request(app)
      .delete(`/api/v1/reflections/${reflectionId}`)
      .set("Authorization", `Bearer ${otherUserToken}`);
    expect(forbiddenDelete.status).toBe(404);
  });

  it("supports notifications read flows", async () => {
    const notifications = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(notifications.status).toBe(200);
    expect(Array.isArray(notifications.body.data.items)).toBe(true);
    expect(typeof notifications.body.data.unreadCount).toBe("number");

    const first = notifications.body.data.items[0] as { id?: string } | undefined;

    if (first?.id) {
      const markOne = await request(app)
        .patch(`/api/v1/notifications/${first.id}/read`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(markOne.status).toBe(200);
    }

    const readAll = await request(app)
      .post("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(readAll.status).toBe(200);
  });

  it("supports notification preferences read/write roundtrip", async () => {
    const initial = await request(app)
      .get("/api/v1/notifications/preferences")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(initial.status).toBe(200);
    expect(typeof initial.body.data.emailChallenges).toBe("boolean");
    expect(typeof initial.body.data.pushUpdates).toBe("boolean");

    const updated = await request(app)
      .patch("/api/v1/notifications/preferences")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emailChallenges: false,
        emailEvents: true,
        emailUpdates: false,
        emailMarketing: true,
        pushChallenges: false,
        pushEvents: true,
        pushUpdates: false,
        digest: "weekly",
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.emailChallenges).toBe(false);
    expect(updated.body.data.pushUpdates).toBe(false);
    expect(updated.body.data.digest).toBe("weekly");

    const after = await request(app)
      .get("/api/v1/notifications/preferences")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(after.status).toBe(200);
    expect(after.body.data.emailChallenges).toBe(false);
    expect(after.body.data.pushUpdates).toBe(false);
    expect(after.body.data.digest).toBe("weekly");
  });

  it("validates and updates password through change-password endpoint", async () => {
    const wrongCurrent = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        oldPassword: "WrongPass123",
        newPassword: "NewStrongPass123",
        confirmPassword: "NewStrongPass123",
      });

    expect(wrongCurrent.status).toBe(401);

    const weakOrMismatched = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        oldPassword: "StrongPass123",
        newPassword: "weak",
        confirmPassword: "different",
      });

    expect(weakOrMismatched.status).toBe(400);

    const changed = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        oldPassword: "StrongPass123",
        newPassword: "StrongPass456",
        confirmPassword: "StrongPass456",
      });

    expect(changed.status).toBe(200);

    const oldSignin = await request(app).post("/api/v1/auth/signin").send({
      email: adminEmail,
      password: "StrongPass123",
    });
    expect(oldSignin.status).toBe(401);

    const newSignin = await request(app).post("/api/v1/auth/signin").send({
      email: adminEmail,
      password: "StrongPass456",
    });
    expect(newSignin.status).toBe(200);
    expect(typeof newSignin.body.data.accessToken).toBe("string");
  });

  it("deletes account with confirmation and blocks future authentication", async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `delete+${unique}@example.com`;

    const signup = await request(app).post("/api/v1/auth/signup").send({
      email,
      password: "DeletePass123",
      acceptLegal: true,
    });

    expect(signup.status).toBe(201);
    const code = signup.body.data.debugVerificationCode as string;

    const verify = await request(app).post("/api/v1/auth/verify-email").send({
      email,
      code,
    });

    expect(verify.status).toBe(200);
    const token = verify.body.data.accessToken as string;

    const wrongDelete = await request(app)
      .post("/api/v1/auth/delete")
      .set("Authorization", `Bearer ${token}`)
      .send({
        emailConfirm: email,
        passwordConfirm: "WrongDeletePass",
      });

    expect(wrongDelete.status).toBe(401);

    const deleteResult = await request(app)
      .post("/api/v1/auth/delete")
      .set("Authorization", `Bearer ${token}`)
      .send({
        emailConfirm: email,
        passwordConfirm: "DeletePass123",
      });

    expect(deleteResult.status).toBe(200);
    expect(deleteResult.body.data.deleted).toBe(true);

    const meAfterDelete = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(meAfterDelete.status).toBe(401);

    const signinAfterDelete = await request(app).post("/api/v1/auth/signin").send({
      email,
      password: "DeletePass123",
    });
    expect(signinAfterDelete.status).toBe(401);
  });

  it("supports persisted chat threads and messages", async () => {
    const defaultPreferences = await request(app)
      .get("/api/v1/chat/preferences")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(defaultPreferences.status).toBe(200);
    expect(defaultPreferences.body.data.customInstructions).toBe("");

    const updatePreferences = await request(app)
      .patch("/api/v1/chat/preferences")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ customInstructions: "Keep responses concise and practical." });

    expect(updatePreferences.status).toBe(200);
    expect(updatePreferences.body.data.customInstructions).toContain("concise");

    const createdThread = await request(app)
      .post("/api/v1/chat/threads")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(createdThread.status).toBe(201);
    const threadId = createdThread.body.data.id as string;
    expect(typeof threadId).toBe("string");
    expect((createdThread.body.data.title as string).startsWith("Thread")).toBe(true);
    expect(createdThread.body.data.context.contextCapacity).toBe(1800);
    expect(createdThread.body.data.context.state).toBe("ok");
    expect(createdThread.body.data.context.usagePercent).toBe(0);
    expect(createdThread.body.data.branch).toBeNull();

    const sendMessage = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ prompt: "How can I stay calm before a hard meeting?" });

    expect(sendMessage.status).toBe(201);
    expect(typeof sendMessage.body.data.answer).toBe("string");
    expect(typeof sendMessage.body.data.context.usagePercent).toBe("number");
    expect(typeof sendMessage.body.data.context.estimatedPromptTokens).toBe("number");
    expect(typeof sendMessage.body.data.context.contextCapacity).toBe("number");
    expect(["ok", "warning", "degraded"]).toContain(sendMessage.body.data.context.state);

    const messages = await request(app)
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(messages.status).toBe(200);
    expect(Array.isArray(messages.body.data)).toBe(true);
    expect(messages.body.data.length).toBeGreaterThanOrEqual(2);

    const branchFromAssistant = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/branch`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        messageId: messages.body.data[1].id,
      });

    expect(branchFromAssistant.status).toBe(201);
    expect(typeof branchFromAssistant.body.data.threadId).toBe("string");
    expect(branchFromAssistant.body.data.href).toContain("/chat?thread=");
    expect(branchFromAssistant.body.data.copiedMessagesCount).toBe(2);
    expect(branchFromAssistant.body.data.thread.branch.sourceThreadId).toBe(threadId);
    expect(branchFromAssistant.body.data.thread.branch.sourceMessageId).toBe(messages.body.data[1].id);
    expect(typeof branchFromAssistant.body.data.thread.branch.sourceMessagePreview).toBe("string");

    const branchedMessages = await request(app)
      .get(`/api/v1/chat/threads/${branchFromAssistant.body.data.threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(branchedMessages.status).toBe(200);
    expect(Array.isArray(branchedMessages.body.data)).toBe(true);
    expect(branchedMessages.body.data.length).toBe(2);
    expect(branchedMessages.body.data[0].content).toBe(messages.body.data[0].content);
    expect(branchedMessages.body.data[1].content).toBe(messages.body.data[1].content);

    const threadsAfterBranch = await request(app)
      .get("/api/v1/chat/threads?scope=all")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(threadsAfterBranch.status).toBe(200);

    const branchedThread = threadsAfterBranch.body.data.find(
      (thread: { id: string }) => thread.id === branchFromAssistant.body.data.threadId,
    );
    expect(branchedThread).toBeDefined();
    expect(branchedThread.branch.sourceThreadId).toBe(threadId);

    const quotedEvent = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/events`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        eventType: "message_quoted",
        messageId: messages.body.data[0].id,
      });
    expect(quotedEvent.status).toBe(201);

    const pinnedEvent = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/events`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        eventType: "message_pinned",
        messageId: messages.body.data[0].id,
      });
    expect(pinnedEvent.status).toBe(201);

    const branchAutoAskEvent = await request(app)
      .post(`/api/v1/chat/threads/${branchFromAssistant.body.data.threadId}/events`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        eventType: "thread_branch_auto_asked",
      });
    expect(branchAutoAskEvent.status).toBe(201);

    let autoTitledThread: { id: string; title: string } | undefined;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const threads = await request(app)
        .get("/api/v1/chat/threads")
        .set("Authorization", `Bearer ${adminToken}`);

      autoTitledThread = threads.body.data.find(
        (thread: { id: string; title: string }) => thread.id === threadId,
      );

      if (autoTitledThread && !autoTitledThread.title.startsWith("Thread")) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(autoTitledThread).toBeDefined();
    expect(autoTitledThread?.title.startsWith("Thread")).toBe(false);

    const archive = await request(app)
      .patch(`/api/v1/chat/threads/${threadId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ archived: true });

    expect(archive.status).toBe(200);

    const activeThreads = await request(app)
      .get("/api/v1/chat/threads?scope=active")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(activeThreads.status).toBe(200);
    expect(
      activeThreads.body.data.some((thread: { id: string }) => thread.id === threadId),
    ).toBe(false);

    const archivedThreads = await request(app)
      .get("/api/v1/chat/threads?scope=archived")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(archivedThreads.status).toBe(200);
    expect(
      archivedThreads.body.data.some((thread: { id: string }) => thread.id === threadId),
    ).toBe(true);

    const restore = await request(app)
      .patch(`/api/v1/chat/threads/${threadId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ archived: false });

    expect(restore.status).toBe(200);

    const chatEvents = await request(app)
      .get("/api/v1/admin/chat/events?limit=200")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(chatEvents.status).toBe(200);
    const eventTypes = chatEvents.body.data.map((event: { eventType: string }) => event.eventType);
    expect(eventTypes).toContain("thread_first_message_created");
    expect(eventTypes).toContain("thread_auto_titled");
    expect(eventTypes).toContain("thread_archived");
    expect(eventTypes).toContain("thread_restored");
    expect(eventTypes).toContain("thread_branched");
    expect(eventTypes).toContain("thread_branch_auto_asked");
    expect(eventTypes).toContain("message_quoted");
    expect(eventTypes).toContain("message_pinned");
  });

  it("auto-summarizes long chat context and records memory telemetry events", async () => {
    const createdThread = await request(app)
      .post("/api/v1/chat/threads")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Memory Stress Test" });

    expect(createdThread.status).toBe(201);
    const threadId = createdThread.body.data.id as string;
    expect(typeof threadId).toBe("string");

    let observedSummarizedTurn = false;
    let observedWarningOrDegraded = false;

    for (let index = 0; index < 10; index += 1) {
      const prompt = [
        `Turn ${index + 1}: keep track of commitments, blockers, and deadlines.`,
        "I need the plan to remain consistent with previous constraints while adapting to new risks.",
        "Summarize what should happen next week and remind me what I promised to do today.",
        "Include references to emotional state, team concerns, and decisions already made.",
      ].join(" ");

      const send = await request(app)
        .post(`/api/v1/chat/threads/${threadId}/messages`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ prompt });

      expect(send.status).toBe(201);
      expect(typeof send.body.data.context.usagePercent).toBe("number");
      expect(typeof send.body.data.context.summarizedMessageCount).toBe("number");
      expect(typeof send.body.data.context.autoSummariesCount).toBe("number");
      if (send.body.data.context.summarizedThisTurn) {
        observedSummarizedTurn = true;
      }
      if (
        send.body.data.context.state === "warning" ||
        send.body.data.context.state === "degraded"
      ) {
        observedWarningOrDegraded = true;
      }
    }

    expect(observedSummarizedTurn).toBe(true);
    expect(observedWarningOrDegraded).toBe(true);

    const threads = await request(app)
      .get("/api/v1/chat/threads?scope=all")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(threads.status).toBe(200);

    const updatedThread = threads.body.data.find((item: { id: string }) => item.id === threadId);
    expect(updatedThread).toBeDefined();
    expect(updatedThread.context.autoSummariesCount).toBeGreaterThan(0);
    expect(updatedThread.context.summarizedMessageCount).toBeGreaterThan(0);
    expect(updatedThread.context.contextCapacity).toBe(1800);
    expect(typeof updatedThread.context.lastSummarizedAt).toBe("string");

    const chatEvents = await request(app)
      .get("/api/v1/admin/chat/events?limit=400")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(chatEvents.status).toBe(200);

    const eventTypesForThread = chatEvents.body.data
      .filter((event: { threadId: string | null }) => event.threadId === threadId)
      .map((event: { eventType: string }) => event.eventType);

    expect(eventTypesForThread).toContain("context_auto_summarized");
    expect(
      eventTypesForThread.includes("context_warning") ||
        eventTypesForThread.includes("context_degraded"),
    ).toBe(true);
  });

  it("supports manual context summarization and admin chat-event filters", async () => {
    const createdThread = await request(app)
      .post("/api/v1/chat/threads")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Manual Summary Test" });

    expect(createdThread.status).toBe(201);
    const threadId = createdThread.body.data.id as string;

    for (let index = 0; index < 3; index += 1) {
      const send = await request(app)
        .post(`/api/v1/chat/threads/${threadId}/messages`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ prompt: `Short turn ${index + 1}: keep this in memory.` });

      expect(send.status).toBe(201);
    }

    const summarize = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/context/summarize`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(summarize.status).toBe(200);
    expect(summarize.body.data.context.summarizedThisTurn).toBe(true);
    expect(summarize.body.data.context.autoSummariesCount).toBeGreaterThan(0);
    expect(typeof summarize.body.data.context.lastSummarizedAt).toBe("string");

    const manualOnly = await request(app)
      .get(`/api/v1/admin/chat/events?limit=200&threadId=${threadId}&eventType=context_manual_summarized`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(manualOnly.status).toBe(200);
    expect(manualOnly.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      manualOnly.body.data.every(
        (event: { threadId: string | null; eventType: string }) =>
          event.threadId === threadId && event.eventType === "context_manual_summarized",
      ),
    ).toBe(true);

    const memoryOnly = await request(app)
      .get("/api/v1/admin/chat/events?limit=200&memoryOnly=true")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(memoryOnly.status).toBe(200);
    expect(memoryOnly.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      memoryOnly.body.data.every((event: { eventType: string }) =>
        [
          "context_auto_summarized",
          "context_manual_summarized",
          "context_warning",
          "context_degraded",
        ].includes(event.eventType),
      ),
    ).toBe(true);
  });

  it("supports public preview chat and analytics conversion reporting", async () => {
    const blockedPreviewChat = await request(app).post("/api/v1/preview/chat").send({
      prompt: "test",
      interactionMs: 10,
    });
    expect(blockedPreviewChat.status).toBe(400);

    const previewChat = await request(app)
      .post("/api/v1/preview/chat")
      .set("User-Agent", "preview-integration-suite")
      .send({
        prompt: "Give me one calm next step before a stressful meeting.",
        maxResponseTokens: 48,
        interactionMs: 1200,
      });

    expect(previewChat.status).toBe(200);
    expect(typeof previewChat.body.data.answer).toBe("string");
    expect(previewChat.body.data.answer.length).toBeGreaterThan(0);
    expect(previewChat.body.data.usage.maxResponseTokens).toBe(48);

    const sessionId = `preview-${Date.now()}`;
    const previewViewEvent = await request(app).post("/api/v1/preview/events").send({
      sessionId,
      eventType: "preview_page_view",
      path: "/preview/chat",
      interactionMs: 1200,
    });

    expect(previewViewEvent.status).toBe(201);

    const signupClickEvent = await request(app).post("/api/v1/preview/events").send({
      sessionId,
      eventType: "preview_signup_click",
      path: "/preview/chat",
      interactionMs: 1200,
    });

    expect(signupClickEvent.status).toBe(201);

    const signupViewEvent = await request(app).post("/api/v1/preview/events").send({
      sessionId,
      eventType: "preview_signup_view",
      path: "/auth/signup",
      metadata: { from: "/preview/chat" },
      interactionMs: 1200,
    });

    expect(signupViewEvent.status).toBe(201);

    const blockedPreviewEvent = await request(app).post("/api/v1/preview/events").send({
      sessionId,
      eventType: "preview_signup_click",
      path: "/preview/chat",
      interactionMs: 10,
    });
    expect(blockedPreviewEvent.status).toBe(400);

    const analytics = await request(app)
      .get("/api/v1/admin/preview/analytics?days=30")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(analytics.status).toBe(200);
    expect(analytics.body.data.totals.sessionsPreviewed).toBeGreaterThanOrEqual(1);
    expect(analytics.body.data.totals.sessionsReachedSignup).toBeGreaterThanOrEqual(1);
    expect(analytics.body.data.countsByType.preview_signup_click).toBeGreaterThanOrEqual(1);
  });

  it("exposes admin system job run listings", async () => {
    const runs = await request(app)
      .get("/api/v1/admin/system/jobs/runs?limit=25&jobName=notification_digest")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(runs.status).toBe(200);
    expect(Array.isArray(runs.body.data)).toBe(true);

    const filteredRuns = await request(app)
      .get("/api/v1/admin/system/jobs/runs?limit=25&jobName=notification_digest&status=success&days=90")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(filteredRuns.status).toBe(200);
    expect(Array.isArray(filteredRuns.body.data)).toBe(true);

    const summary = await request(app)
      .get(
        "/api/v1/admin/system/jobs/summary?jobName=notification_digest&failureWindowMinutes=120&staleLockMinutes=30",
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(summary.status).toBe(200);
    expect(summary.body.data.jobName).toBe("notification_digest");
    expect(typeof summary.body.data.healthy).toBe("boolean");
    expect(typeof summary.body.data.runsLast24h).toBe("number");
    expect(typeof summary.body.data.successRate7d).toBe("number");
    expect(typeof summary.body.data.lock.exists).toBe("boolean");

    const unsupportedUnlock = await request(app)
      .post("/api/v1/admin/system/jobs/unlock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ jobName: "unknown_job", minAgeMinutes: 30 });
    expect(unsupportedUnlock.status).toBe(400);
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
        content:
          "Draft content should not appear publicly until published. This body validates detail endpoints.",
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

    const lessonDetail = await request(app).get("/api/v1/content/library/test-draft-lesson");
    expect(lessonDetail.status).toBe(200);
    expect(lessonDetail.body.data.slug).toBe("test-draft-lesson");
    expect(typeof lessonDetail.body.data.content).toBe("string");

    const lessonMissing = await request(app).get("/api/v1/content/library/does-not-exist");
    expect(lessonMissing.status).toBe(404);
  });

  it("returns practice details by slug and 404 for unknown slug", async () => {
    const createPractice = await request(app)
      .post("/api/v1/admin/content/practices")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        slug: "test-practice-detail",
        title: "Practice Detail",
        description: "Practice description for list view.",
        cadence: "Daily · 5 min",
        protocol:
          "1. Prepare your posture.\n2. Follow the breath.\n3. Log one concrete observation.",
        status: "PUBLISHED",
      });

    expect(createPractice.status).toBe(201);

    const detail = await request(app).get("/api/v1/content/practices/test-practice-detail");
    expect(detail.status).toBe(200);
    expect(detail.body.data.slug).toBe("test-practice-detail");
    expect(typeof detail.body.data.protocol).toBe("string");

    const missing = await request(app).get("/api/v1/content/practices/not-found");
    expect(missing.status).toBe(404);
  });

  it("keeps draft challenge private until published", async () => {
    const createChallenge = await request(app)
      .post("/api/v1/admin/content/challenges")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        slug: "test-draft-challenge",
        title: "Draft Challenge",
        duration: "7 days",
        summary: "Challenge should only appear after publishing.",
        status: "DRAFT",
      });

    expect(createChallenge.status).toBe(201);

    const publicBefore = await request(app).get("/api/v1/content/challenges");
    expect(publicBefore.status).toBe(200);
    const draftBefore = publicBefore.body.data.find(
      (item: { slug: string }) => item.slug === "test-draft-challenge",
    );
    expect(draftBefore).toBeUndefined();

    const adminContent = await request(app)
      .get("/api/v1/admin/content")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminContent.status).toBe(200);
    const challenge = adminContent.body.data.challenges.find(
      (item: { slug: string; id: number }) => item.slug === "test-draft-challenge",
    );

    expect(challenge).toBeDefined();

    const publish = await request(app)
      .patch(`/api/v1/admin/content/challenges/${challenge.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });

    expect(publish.status).toBe(200);

    const publicAfter = await request(app).get("/api/v1/content/challenges");
    expect(publicAfter.status).toBe(200);
    const draftAfter = publicAfter.body.data.find(
      (item: { slug: string }) => item.slug === "test-draft-challenge",
    );
    expect(draftAfter).toBeDefined();
  });
});
