import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function expectUrl(page: Page, pattern: RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout: 15000 });
}

async function openUserMenu(page: Page): Promise<void> {
  const accountLink = page.getByRole("link", { name: "Open account section" });
  await page.getByLabel("Open user menu").click();
  if ((await accountLink.count()) === 0 || !(await accountLink.first().isVisible().catch(() => false))) {
    await page.getByLabel("Open user menu").click();
  }
  await expect(accountLink).toBeVisible();
}

async function signupAndGoDashboard(page: Page): Promise<void> {
  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `user.${uniqueId}@example.com`;

  const emailInput = page.getByRole("textbox", { name: "Email", exact: true });
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/i }).check();

  await page.getByRole("button", { name: "Create free account" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    // Retry once if client-side validation state de-syncs during first hydration pass.
    await emailInput.fill(email);
    await expect(emailInput).toHaveValue(email);
    await page.getByRole("button", { name: "Create free account" }).click();
  }
  await expectUrl(page, /\/auth\/verify-email/);
  await page.getByRole("button", { name: "Verify Email" }).click();
  await expectUrl(page, /\/onboarding/);

  await page.getByLabel("Primary objective").selectOption("Calm anxiety");
  await page.getByLabel("Current biggest difficulty").selectOption("Overthinking");
  await page.getByLabel("Main need right now").selectOption("Clarity");
  await page.getByLabel("Daily time available").selectOption("10 min");
  await page.getByLabel("Preferred coaching style").selectOption("Direct");
  await page
    .getByLabel("Experience with contemplative practice")
    .selectOption("New");
  await page.getByLabel("Preferred practice format").selectOption("Mixed");
  await page.getByLabel("30-day success definition").selectOption("Greater inner calm");

  await page.getByRole("button", { name: "Continue to dashboard" }).click();
  await expectUrl(page, /\/dashboard/);
}

async function createJournalReflection(page: Page): Promise<void> {
  await page.goto("/journal");
  await page.getByLabel("Title").fill("Momentum checkpoint");
  await page.getByLabel("Mood").selectOption("Focused");
  await page
    .getByRole("textbox", { name: "Reflection", exact: true })
    .fill("I clarified what I can control and chose one concrete next action for today.");
  await page.getByRole("button", { name: "Save Reflection" }).click();
  await expect(page.getByRole("heading", { name: "Momentum checkpoint" })).toBeVisible();
}

async function expectFocusedRoundedContainer(page: Page, selector: string): Promise<void> {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  await expect(target).toHaveClass(/account-focus-highlight/);
  const radius = await target.evaluate((element) => getComputedStyle(element).borderTopLeftRadius);
  expect(Number.parseFloat(radius)).toBeGreaterThan(0);
}

test("landing loads API content and signup reaches dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Platform Pillars")).toBeVisible();
  await expect(page.getByText("Stoic Core")).toBeVisible();

  await signupAndGoDashboard(page);
  await expect(page.getByText(/^Good (morning|afternoon|evening),/)).toBeVisible();

  const topbar = page.locator("header");
  await page.getByLabel("Open user menu").click();
  await page.getByRole("link", { name: "Open community section" }).click();
  await expectUrl(page, /\/community/);
  await topbar.getByRole("link", { name: "Companion" }).first().click();
  await expectUrl(page, /\/chat/);

  await openUserMenu(page);
  const hasCreatorTopbarAccess = (await page.getByRole("link", { name: "Open creator section" }).count()) > 0;
  if (hasCreatorTopbarAccess) {
    await page.getByRole("link", { name: "Open creator section" }).click();
    await expectUrl(page, /\/creator/);
  }

  await openUserMenu(page);
  await expect(page.getByRole("link", { name: "Open account section" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open community section" })).toBeVisible();
  if (hasCreatorTopbarAccess) {
    await expect(page.getByRole("link", { name: "Open creator section" })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "Open creator section" })).toHaveCount(0);
  }
});

test("public preview section is accessible without authentication", async ({ page }) => {
  await page.goto("/preview");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }
  await expect(page).toHaveURL(/\/preview$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Try Areti Without Signing In" })).toBeVisible();

  await page.goto("/preview/chat");
  await expect(page).toHaveURL(/\/preview\/chat$/, { timeout: 15000 });
  await expect(page.getByText("Token budget:", { exact: false })).toBeVisible();

  const composer = page.getByPlaceholder("Write a concise prompt (Shift+Enter for newline).");
  await composer.fill("Help me reset quickly before a difficult conversation.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Help me reset quickly before a difficult conversation.")).toBeVisible();

  await composer.fill("x".repeat(500));
  await expect(page.getByText(/Prompt too long:/)).toBeVisible();

  await page.goto("/preview/journal");
  await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();

  await page.goto("/preview/library");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();

  await page.goto("/preview/practices");
  await expect(page.getByRole("heading", { name: "Practices" })).toBeVisible();

  await page.goto("/preview/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("preview pages route to signup with conversion params", async ({ page }) => {
  await page.goto("/preview");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const checks: Array<{ path: string; ctaName: RegExp; mainOnly?: boolean }> = [
    { path: "/preview", ctaName: /^Create account$/, mainOnly: true },
    { path: "/preview/journal", ctaName: /Create account to unlock journal/i },
    { path: "/preview/library", ctaName: /Create account to unlock library/i },
    { path: "/preview/practices", ctaName: /Create account to unlock practices/i },
    { path: "/preview/dashboard", ctaName: /Create account to unlock dashboard/i },
  ];

  for (const check of checks) {
    await page.goto(check.path);
    const cta = check.mainOnly
      ? page.getByRole("main").getByRole("link", { name: check.ctaName })
      : page.getByRole("link", { name: check.ctaName });
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/signup\?source=preview&from=/, { timeout: 15000 });
  }
});

test("cookie consent gate redirects protected routes until accepted", async ({ page }) => {
  await page.goto("/dashboard");
  await expectUrl(page, /\/legal\/cookies\?next=/);
  await page.getByRole("button", { name: "Accept cookies" }).click();
  await page.goto("/dashboard");
  await expectUrl(page, /\/auth\/signin/);
});

test("signin unverified state offers resend link and opens code verification", async ({ page }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `pending.${uniqueId}@example.com`;
  const password = "StrongPass123";

  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const pendingEmailInput = page.getByRole("textbox", { name: "Email", exact: true });
  await pendingEmailInput.fill(email);
  await expect(pendingEmailInput).toHaveValue(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/i }).check();
  await page.getByRole("button", { name: "Create free account" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    await pendingEmailInput.fill(email);
    await expect(pendingEmailInput).toHaveValue(email);
    await page.getByRole("button", { name: "Create free account" }).click();
  }
  await expectUrl(page, /\/auth\/verify-email/);

  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/Email not verified/i)).toBeVisible();

  await page.getByRole("link", { name: "Request a new verification email" }).click();
  await expect(page).toHaveURL(
    /\/auth\/verify-email\?email=.*&(resendStatus=sent|resendStatus=already-verified|resendError=.*)/,
    { timeout: 15000 },
  );
  await expect(page.getByLabel("Verification code")).toBeVisible();
});

test("dashboard CTAs remain clickable and route to actionable flows", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.getByRole("link", { name: "New Entry" }).click();
  await expectUrl(page, /\/journal/);

  await page.goto("/dashboard");
  await page.locator("header").getByRole("link", { name: "Companion" }).first().click();
  await expectUrl(page, /\/chat/);

  await page.goto("/dashboard");
  await page.getByLabel("Notifications").click();
  await page.getByRole("link", { name: /Explore the Library/i }).click();
  await expectUrl(page, /\/library/);
  await page.getByRole("link", { name: /Open article/i }).first().click();
  await expectUrl(page, /\/library\/.+/);
  await expect(page.getByText("Action Prompt")).toBeVisible();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expectUrl(page, /\/library\/.+\?completed=1/);
  await expect(page.getByText("Lesson marked complete.")).toBeVisible();
  await page.getByRole("link", { name: "Back to library" }).click();
  await expectUrl(page, /\/library/);

  await page.goto("/dashboard");
  await page.getByLabel("Quick actions").click();
  await page.getByRole("link", { name: "Start a practice" }).click();
  await expectUrl(page, /\/practices/);

  await page.getByRole("link", { name: /Open practice/i }).first().click();
  await expectUrl(page, /\/practices\/.+/);
  await expect(page.getByText("After Practice")).toBeVisible();
  await page.getByRole("button", { name: "Mark practice complete" }).click();
  await expectUrl(page, /\/practices\/.+\?completed=1/);
  await expect(page.getByText("Practice marked complete.")).toBeVisible();
  await page.getByRole("link", { name: "Log reflection" }).click();
  await expectUrl(page, /\/journal\?title=.*&mood=Focused/);
  await expect(page.getByLabel("Title")).toHaveValue(/Practice:/);
  await expect(page.getByLabel("Mood")).toHaveValue("Focused");

  await page.goto("/community");
  await page.getByRole("link", { name: "Request invite" }).first().click();
  await expect(page).toHaveURL(/\/chat(\?.*(prompt|thread)=.*)?/, { timeout: 15000 });
  await expect(page.getByText("I want to join", { exact: false }).first()).toBeVisible();

  await page.goto("/chat");
  await page
    .getByRole("button", { name: /I feel anxious and scattered\. Help me settle/i })
    .first()
    .click();
  await expect(page.getByLabel("Chat prompt")).toHaveValue(/I feel anxious and scattered/i);
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page).toHaveURL(/\/chat\?.*thread=/, { timeout: 15000 });
});

test("dashboard prioritizes next action and adapts from new user to returning user", async ({ page }) => {
  await signupAndGoDashboard(page);

  await expect(page.getByText("Begin with one short check-in.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today for you" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start your path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent reflections" })).toBeVisible();
  await expect(
    page.getByText("No reflections yet. Start with one short check-in and your home will personalize."),
  ).toBeVisible();

  await createJournalReflection(page);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Continue your path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Momentum checkpoint" }).first()).toBeVisible();
});

test("account focus query highlights rounded target containers", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account/security?focus=totp");
  await expectFocusedRoundedContainer(page, "#totp");

  await page.goto("/account/security?focus=passkeys");
  await expectFocusedRoundedContainer(page, "#passkeys");

  await page.goto("/account/privacy?focus=deletion");
  await expectFocusedRoundedContainer(page, "#deletion-card");
});

test("companion supports thread lifecycle and persisted messaging", async ({ page }) => {
  await signupAndGoDashboard(page);
  await page.goto("/chat");

  await expect(page).toHaveURL(/\/chat$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Reflective Companion" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Begin where you are" })).toBeVisible();
  await expect(page.getByLabel("Chat prompt")).toBeVisible();

  await page.getByLabel("Create a new conversation thread").first().click();
  await expect(page).toHaveURL(/\/chat$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Begin where you are" })).toBeVisible();
  await expect(page.getByLabel("Create a new conversation thread").first()).toBeVisible();

  await page.getByLabel("Chat prompt").fill("What is areti?");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Begin where you are" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Reflective Companion" })).toHaveCount(0);

  await page.getByLabel("Open thread actions").click();
  await page.getByRole("button", { name: "Rename" }).first().click();
  await page.getByLabel("Rename thread title").fill("Plan Sprint Decisions");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("main").getByText("Plan Sprint Decisions")).toBeVisible();
  await expect(page.getByText("What is areti?", { exact: false })).toBeVisible();

  await page.getByLabel("Open thread actions").click();
  await expect(page.getByRole("button", { name: /^Archive$/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /^Archive$/ }).first().click();
  await page.getByLabel("Open thread actions").click();
  await expect(page.getByRole("button", { name: "Restore" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).first().click();
  await page.getByLabel("Open thread actions").first().click();
  await expect(page.getByRole("button", { name: /^Archive$/ }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
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

  await topbar.getByRole("link", { name: "Companion" }).first().click();
  await expect(sidebar.getByLabel("Create a new conversation thread").first()).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Library" })).toHaveCount(0);

  await openUserMenu(page);
  await page.getByRole("link", { name: "Open community section" }).click();
  await page.goto("/community/events");
  await expect(sidebar.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Library" })).toHaveCount(0);

  await openUserMenu(page);
  await page.getByRole("link", { name: "Open account section" }).click();
  await expect(sidebar.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Circles" })).toHaveCount(0);

  await openUserMenu(page);
  const canAccessCreator = (await page.getByRole("link", { name: "Open creator section" }).count()) > 0;
  if (canAccessCreator) {
    await page.getByRole("link", { name: "Open creator section" }).click();
    await expect(sidebar.getByRole("link", { name: "CMS" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Journal" })).toHaveCount(0);
  } else {
    await openUserMenu(page);
    await expect(page.getByRole("link", { name: "Open creator section" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "CMS" })).toHaveCount(0);
  }
});

test("account preferences and profile fields persist after save", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account/preferences");
  await page.getByLabel("Language").selectOption("es");
  await page.getByLabel("Timezone").fill("America/New_York");
  await page.getByLabel("Profile visibility").selectOption("contacts");
  await page.getByRole("checkbox", { name: "Show email on profile" }).check();
  await page.getByRole("checkbox", { name: "Show phone on profile" }).check();
  await page.getByRole("checkbox", { name: "Allow direct contact requests" }).uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page).toHaveURL(/\/account\/preferences\?saved=1/, { timeout: 15000 });
  await page.goto("/account/preferences");
  await expect(page.getByLabel("Timezone")).toHaveValue("America/New_York");
  await expect(page.getByLabel("Profile visibility")).toHaveValue("contacts");

  await page.goto("/account/profile");
  await page.getByLabel("Name", { exact: true }).fill("Persisted Name");
  await page.getByLabel("Username").fill("persisted_user");
  await page.getByLabel("Summary").fill("Profile persistence check.");
  await page.getByLabel("Phone").fill("+1 555 444 3333");
  await page.getByLabel("City").fill("Barcelona");
  await page.getByLabel("Country").fill("ES");
  await page.getByLabel("Website").fill("https://example.com");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page).toHaveURL(/\/account\/profile\?saved=1/, { timeout: 15000 });
  await page.goto("/account/profile");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Persisted Name");
  await expect(page.getByLabel("Username")).toHaveValue("persisted_user");
  await expect(page.getByLabel("Phone")).toHaveValue("+1 555 444 3333");
  await expect(page.getByLabel("City")).toHaveValue("Barcelona");
});

test("account sidebar matches simplified B2C IA", async ({ page }) => {
  await signupAndGoDashboard(page);
  await page.goto("/account/profile");

  const sidebar = page.locator("aside");
  const accountLinks = sidebar.locator('a[href^="/account/"]');
  await expect(accountLinks).toHaveCount(6);
  await expect(accountLinks.nth(0)).toHaveText("Profile");
  await expect(accountLinks.nth(1)).toHaveText("Preferences");
  await expect(accountLinks.nth(2)).toHaveText("Notifications");
  await expect(accountLinks.nth(3)).toHaveText("Security");
  await expect(accountLinks.nth(4)).toHaveText("Subscription");
  await expect(accountLinks.nth(5)).toHaveText("Privacy");

  await expect(sidebar.getByText("Home", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Settings", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Password", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Sessions", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Danger Zone", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Personal identity and contact details")).toHaveCount(0);
  await expect(sidebar.getByText("Language and app experience settings")).toHaveCount(0);
});

test("account password flow validates failure and success", async ({ page }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `password.${uniqueId}@example.com`;
  const oldPassword = "StrongPass123";
  const newPassword = "StrongPass456";

  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const signupEmailInput = page.getByLabel("Email");
  await signupEmailInput.fill(email);
  await expect(signupEmailInput).toHaveValue(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/i }).check();
  await page.getByRole("button", { name: "Create free account" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    await signupEmailInput.fill(email);
    await expect(signupEmailInput).toHaveValue(email);
    await page.getByRole("button", { name: "Create free account" }).click();
  }
  await expectUrl(page, /\/auth\/verify-email/);
  await page.getByRole("button", { name: "Verify Email" }).click();
  await expectUrl(page, /\/onboarding/);

  await page.getByLabel("Primary objective").selectOption("Calm anxiety");
  await page.getByLabel("Current biggest difficulty").selectOption("Overthinking");
  await page.getByLabel("Main need right now").selectOption("Clarity");
  await page.getByLabel("Daily time available").selectOption("10 min");
  await page.getByLabel("Preferred coaching style").selectOption("Direct");
  await page.getByLabel("Experience with contemplative practice").selectOption("New");
  await page.getByLabel("Preferred practice format").selectOption("Mixed");
  await page.getByLabel("30-day success definition").selectOption("Greater inner calm");
  await page.getByRole("button", { name: "Continue to dashboard" }).click();
  await expectUrl(page, /\/dashboard/);

  await page.goto("/account/security");
  await page.getByLabel("Current password").fill("wrong-pass");
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/account\/security\?error=.*focus=password/, { timeout: 15000 });

  await page.goto("/account/security");
  await page.getByLabel("Current password").fill(oldPassword);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/account\/security\?saved=1&focus=password/, { timeout: 15000 });

  await page.getByLabel("Open user menu").click();
  await page.getByRole("button", { name: "Logout" }).click();
  await expectUrl(page, /\/$/);
  await page.goto("/auth/signin");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectUrl(page, /\/dashboard/);
});

test("legacy account routes redirect to canonical IA routes", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/profile/, { timeout: 15000 });

  await page.goto("/account/settings");
  await expect(page).toHaveURL(/\/account\/preferences/, { timeout: 15000 });

  await page.goto("/account/password");
  await expect(page).toHaveURL(/\/account\/security\?focus=password/, { timeout: 15000 });

  await page.goto("/account/sessions");
  await expect(page).toHaveURL(/\/account\/security\?focus=sessions/, { timeout: 15000 });

  await page.goto("/account/danger");
  await expect(page).toHaveURL(/\/account\/privacy\?focus=deletion/, { timeout: 15000 });

  await page.goto("/account/billing");
  await expect(page).toHaveURL(/\/account\/subscription/, { timeout: 15000 });
});
