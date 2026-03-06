import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function expectUrl(page: Page, pattern: RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout: 15000 });
}

async function signupAndGoDashboard(page: Page): Promise<void> {
  await page.goto("/auth/signup");

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `user+${uniqueId}@example.com`;

  await page.getByLabel("Name").fill("Admin E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Confirm Password").fill("StrongPass123");

  await page.getByRole("button", { name: "Create Account" }).click();

  await expectUrl(page, /\/dashboard/);
}

test("landing loads API content and signup reaches dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Platform Pillars")).toBeVisible();
  await expect(page.getByText("Stoic Core")).toBeVisible();

  await signupAndGoDashboard(page);
  await expect(page.getByText("Welcome, Admin")).toBeVisible();

  const topbar = page.locator("header");
  await topbar.getByRole("link", { name: "Community" }).first().click();
  await expectUrl(page, /\/community/);

  const creatorTopbarLink = topbar.getByRole("link", { name: "Creator" }).first();
  const hasCreatorTopbarAccess = (await creatorTopbarLink.count()) > 0;
  if (hasCreatorTopbarAccess) {
    await creatorTopbarLink.click();
    await expectUrl(page, /\/creator\/cms/);
  }

  await page.getByLabel("Open user menu").click();
  await expect(page.getByRole("link", { name: "Open account section" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open community section" })).toBeVisible();
  if (hasCreatorTopbarAccess) {
    await expect(page.getByRole("link", { name: "Open creator section" })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "Open creator section" })).toHaveCount(0);
  }
});

test("dashboard CTAs remain clickable and route to actionable flows", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.getByRole("link", { name: "New Entry" }).click();
  await expectUrl(page, /\/dashboard\/journal/);

  await page.goto("/dashboard");
  await page.getByRole("link", { name: "AI Assist" }).click();
  await expectUrl(page, /\/dashboard\/chat/);

  await page.goto("/dashboard");
  await page.getByLabel("Notifications").click();
  await page.getByRole("link", { name: "Continue your practice streak" }).click();
  await expectUrl(page, /\/dashboard\/practices/);

  await page.goto("/dashboard");
  await page.getByLabel("Quick actions").click();
  await page.getByRole("link", { name: "Start a practice" }).click();
  await expectUrl(page, /\/dashboard\/practices/);

  await page.getByRole("link", { name: "Start practice" }).first().click();
  await expectUrl(page, /\/dashboard\/journal\?title=.*&mood=Focused/);
  await expect(page.getByLabel("Title")).toHaveValue(/Practice:/);
  await expect(page.getByLabel("Mood")).toHaveValue("Focused");

  await page.goto("/community");
  await page.getByRole("link", { name: "Request invite" }).first().click();
  await expectUrl(page, /\/dashboard\/chat\?prompt=/);
  await expect(page.getByText("I want to join", { exact: false })).toBeVisible();

  const firstPromptIdea = "I feel anxious before big meetings. What should I practice this week?";
  await page.goto("/dashboard/chat");
  await page.getByLabel(`Use prompt idea: ${firstPromptIdea}`).click();
  await expectUrl(page, /\/dashboard\/chat\?prompt=/);
  await expect(page.getByText(firstPromptIdea)).toHaveCount(2);
});

test("section sidebars are isolated across personal, community, and account sections", async ({
  page,
}) => {
  await signupAndGoDashboard(page);

  const topbar = page.locator("header");
  const sidebar = page.locator("aside");

  await expect(sidebar.getByRole("link", { name: "Library" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Circles" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "Profile" })).toHaveCount(0);

  await topbar.getByRole("link", { name: "Community" }).first().click();
  await page.goto("/community/events");
  await expect(sidebar.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Library" })).toHaveCount(0);

  await page.getByLabel("Open user menu").click();
  await page.getByRole("link", { name: "Open account section" }).click();
  await expect(sidebar.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Circles" })).toHaveCount(0);

  const canAccessCreator = (await topbar.getByRole("link", { name: "Creator" }).count()) > 0;
  if (canAccessCreator) {
    await topbar.getByRole("link", { name: "Creator" }).first().click();
    await expect(sidebar.getByRole("link", { name: "CMS" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Journal" })).toHaveCount(0);
  } else {
    await page.getByLabel("Open user menu").click();
    await expect(page.getByRole("link", { name: "Open creator section" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "CMS" })).toHaveCount(0);
  }
});
