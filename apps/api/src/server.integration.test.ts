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

beforeAll(async () => {
  mkdirSync(path.dirname(testDbPath), { recursive: true });
  rmSync(testDbPath, { force: true });

  process.env.NODE_ENV = "test";
  process.env.ATARAXIA_DB_PATH = testDbPath;
  process.env.CORS_ORIGINS = "http://localhost:3000";
  process.env.CHAT_PROVIDER_ORDER = "deepseek,openai";
  process.env.DEEPSEEK_API_KEY = "";
  process.env.OPENAI_API_KEY = "";

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
        biggestDifficulty: "Overthinking",
        mainNeed: "Clarity",
        dailyTimeCommitment: "10 min",
        coachingStyle: "Direct",
        contemplativeExperience: "New",
        preferredPracticeFormat: "Mixed",
        successDefinition30d: "Greater inner calm",
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

    const sendMessage = await request(app)
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ prompt: "How can I stay calm before a hard meeting?" });

    expect(sendMessage.status).toBe(201);
    expect(typeof sendMessage.body.data.answer).toBe("string");

    const messages = await request(app)
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(messages.status).toBe(200);
    expect(Array.isArray(messages.body.data)).toBe(true);
    expect(messages.body.data.length).toBeGreaterThanOrEqual(2);

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
