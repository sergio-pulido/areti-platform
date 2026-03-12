import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function expectUrl(page: Page, pattern: RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout: 15000 });
}

async function acceptSignupLegal(page: Page): Promise<void> {
  await page.getByRole("checkbox", { name: /Terms of Service/i }).check();
  await page.getByRole("checkbox", { name: /Privacy Policy/i }).check();
}

async function openUserMenu(page: Page): Promise<void> {
  const accountLink = page.getByRole("link", { name: "Open account section" });
  await page.getByLabel("Open user menu").click();
  if ((await accountLink.count()) === 0 || !(await accountLink.first().isVisible().catch(() => false))) {
    await page.getByLabel("Open user menu").click();
  }
  await expect(accountLink).toBeVisible();
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.getByText("Reduce stress", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Mindfulness", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("New to philosophy", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expectUrl(page, /\/(practices|journal|library)(\?|$)/);
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
  await acceptSignupLegal(page);

  await page.getByRole("button", { name: "Continue" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    // Retry once if client-side validation state de-syncs during first hydration pass.
    await emailInput.fill(email);
    await expect(emailInput).toHaveValue(email);
    await acceptSignupLegal(page);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page).toHaveURL(/\/auth\/(verify-email|signup\/complete)/, { timeout: 15000 });
  if (/\/auth\/verify-email/.test(page.url())) {
    await expectUrl(page, /\/auth\/signup\/complete/);
  }
  await expectUrl(page, /\/auth\/signup\/complete/);

  await page.getByLabel("Name", { exact: true }).fill("Playwright User");
  await page.getByLabel("Username", { exact: true }).fill(`user_${Date.now().toString().slice(-6)}`);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expectUrl(page, /\/onboarding/);

  await completeOnboarding(page);
  await page.goto("/dashboard");
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

async function expectRewardMilestoneState(
  page: Page,
  title: string,
  state: "Earned" | "In progress",
): Promise<void> {
  const card = page.getByRole("heading", { name: title }).locator("xpath=ancestor::section[1]");
  await expect(card.getByText(state)).toBeVisible();
}

async function remainingConversationScroll(page: Page): Promise<number> {
  return page.getByTestId("chat-conversation-scroller").evaluate((element) => {
    return element.scrollHeight - element.scrollTop - element.clientHeight;
  });
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

test("language switch in user dropdown updates copy without navigation refresh", async ({ page }) => {
  await signupAndGoDashboard(page);

  const originalUrl = page.url();
  await expect(page.getByRole("heading", { name: "Today for you" })).toBeVisible();

  await page.getByLabel("Open user menu").click();
  await expect(page.getByRole("button", { name: "Español" })).toBeVisible();
  await page.getByRole("button", { name: "Español" }).click();

  await expect(page).toHaveURL(originalUrl);
  await expect(page.getByRole("heading", { name: "Hoy para ti" })).toBeVisible();
  await expect(page.getByText("Idioma", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "English" }).click();
  await expect(page).toHaveURL(originalUrl);
  await expect(page.getByRole("heading", { name: "Today for you" })).toBeVisible();
});

test("academy supports structured navigation, search, and credibility context", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/academy");
  await expect(page.getByRole("heading", { name: "A Structured Library for Philosophy and Psychology" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open all paths" })).toBeVisible();

  await page.goto("/academy/thinkers");
  await expect(page.getByRole("heading", { name: "Thinkers" })).toBeVisible();
  await expect(page.getByText("Foundational").first()).toBeVisible();
  await expect(page.getByText(/Evidence:/).first()).toBeVisible();

  await page.goto("/academy/search?q=virtue");
  await expect(page.getByText("Query: virtue")).toBeVisible();
  const openResult = page.getByRole("link", { name: "Open" }).first();
  await expect(openResult).toBeVisible();
  await openResult.click();
  await expect(page).toHaveURL(/\/academy\/(traditions|thinkers|works|concepts|paths|search|$)/, {
    timeout: 15000,
  });
});

test("reflections flow creates, processes, and sends to companion", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/reflections/new");
  await expect(page.getByRole("heading", { name: "New reflection" })).toBeVisible();

  await page.getByRole("button", { name: "Write text" }).click();
  await page.getByLabel("Title").fill("Decision clarity");
  await page.getByLabel("Tags").fill("career, clarity");
  await page.locator("#reflection-body").fill(
    "I keep saying I should stay where I am, but I want to move toward deeper work and I feel split.",
  );

  await page.getByRole("button", { name: "Create reflection" }).click();
  await expect(page).toHaveURL(/\/reflections\/[0-9a-fA-F-]+$/, { timeout: 15000 });

  await expect(page.getByText("Ready", { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Commentary", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Continue in Companion" }).click();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
});

test("chat message actions support pin reorder and branch+ask idempotency", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/chat");
  const composer = page.getByLabel("Chat prompt");
  const send = page.getByRole("button", { name: "Send chat message" });

  await composer.fill("First thread message for action testing.");
  await send.click();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  const sourceThreadId = new URL(page.url()).searchParams.get("thread");
  expect(sourceThreadId).toBeTruthy();

  await composer.fill("Second thread message so we can pin and reorder.");
  await send.click();

  const threadButtons = page.getByRole("button", { name: /Mar \d+/ });
  const threadCountBeforeBranch = await threadButtons.count();

  const pinButtons = page.getByRole("button", { name: "Pin message as insight" });
  await expect(pinButtons.first()).toBeVisible();
  await pinButtons.nth(0).click();
  await pinButtons.nth(1).click();

  const pinnedChips = page.getByTestId("pinned-insight-chip");
  await expect(pinnedChips).toHaveCount(2);
  const firstBeforeReorder = (await pinnedChips.nth(0).textContent()) ?? "";
  await pinnedChips.nth(1).dragTo(pinnedChips.nth(0));
  await expect
    .poll(async () => (await pinnedChips.nth(0).textContent()) ?? "", { timeout: 5000 })
    .not.toBe(firstBeforeReorder);

  const branchAndAskButton = page
    .getByRole("button", { name: "Create a branch and send a first prompt" })
    .first();

  let promptDialogCount = 0;
  page.on("dialog", (dialog) => {
    promptDialogCount += 1;
    void dialog.accept("Start this branch with one practical next step.");
  });

  await branchAndAskButton.dblclick();
  await expect.poll(() => promptDialogCount, { timeout: 5000 }).toBe(1);
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });

  await expect.poll(async () => await threadButtons.count(), { timeout: 20000 }).toBe(threadCountBeforeBranch + 1);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Branch:", { timeout: 20000 });

  await expect
    .poll(() => new URL(page.url()).searchParams.get("thread"), { timeout: 20000 })
    .not.toBe(sourceThreadId);
  const resolvedBranchedThreadId = new URL(page.url()).searchParams.get("thread");
  expect(resolvedBranchedThreadId).toBeTruthy();

  await expect(
    page
      .getByTestId("chat-conversation-scroller")
      .getByText("Start this branch with one practical next step.", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
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

test("verification screen supports resend while signup is pending", async ({ page }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `pending.${uniqueId}@example.com`;

  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const pendingEmailInput = page.getByRole("textbox", { name: "Email", exact: true });
  await pendingEmailInput.fill(email);
  await expect(pendingEmailInput).toHaveValue(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expectUrl(page, /\/auth\/signup/);
  await acceptSignupLegal(page);
  await page.getByRole("button", { name: "Continue" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    await pendingEmailInput.fill(email);
    await expect(pendingEmailInput).toHaveValue(email);
    await acceptSignupLegal(page);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.goto(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  await expectUrl(page, /\/auth\/verify-email\?email=/);
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await expect(
    page.getByText(/Verification email sent|Please wait \d+s before requesting another code|already verified/i),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Restart signup" })).toBeVisible();
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
  await page.goto("/practices");
  await expectUrl(page, /\/practices/);
  await page.getByRole("link", { name: /Daily reset/i }).click();
  await expectUrl(page, /\/practices\?path=daily/);

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

test("library path templates and rewards milestones render for active users", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/library");
  await page.getByRole("link", { name: /Starter \(Beginner\)/i }).click();
  await expectUrl(page, /\/library\?path=starter/);
  await expect(page.getByText("Path: starter")).toBeVisible();

  await page.goto("/account/rewards");
  await expect(page.getByRole("heading", { name: "Rewards" })).toBeVisible();
  await expect(page.getByText(/badges earned/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "First Reflection" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson Starter" })).toBeVisible();
});

test("rewards milestones transition from locked to earned after real activity", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account/rewards");
  await expectRewardMilestoneState(page, "First Reflection", "In progress");
  await expectRewardMilestoneState(page, "Lesson Starter", "In progress");

  await createJournalReflection(page);

  await page.goto("/library");
  await page.getByRole("link", { name: /Open article/i }).first().click();
  await expectUrl(page, /\/library\/.+/);
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expectUrl(page, /\/library\/.+\?completed=1/);

  await page.goto("/account/rewards");
  await expectRewardMilestoneState(page, "First Reflection", "Earned");
  await expectRewardMilestoneState(page, "Lesson Starter", "Earned");
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

test("totp setup renders a scannable qr code and fallback secret fields", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account/security?focus=totp");
  await page.getByRole("button", { name: "Setup TOTP" }).click();

  await expect(page.getByRole("img", { name: "TOTP setup QR code" })).toBeVisible();
  await expect(page.getByText("Secret:", { exact: false })).toBeVisible();
  await expect(page.getByText("URI:", { exact: false })).toBeVisible();
});

test("passkey registration action is managed from the registered passkeys panel", async ({ page }) => {
  await signupAndGoDashboard(page);

  await page.goto("/account/security");

  const authMethodsCard = page.getByRole("heading", { name: "Authentication methods" }).locator("xpath=ancestor::section[1]");
  const registeredPasskeysCard = page.getByRole("heading", { name: "Registered passkeys" }).locator("xpath=ancestor::section[1]");

  await expect(authMethodsCard.getByRole("button", { name: /register .*passkey/i })).toHaveCount(0);
  await expect(authMethodsCard.getByText(/No passkeys registered yet/i)).toBeVisible();
  await expect(registeredPasskeysCard.getByRole("button", { name: "Register first passkey" })).toBeVisible();
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
  await page.getByLabel("Open context usage details").click();
  await expect(page.getByText("Context usage (estimated)")).toBeVisible();
  await expect(page.getByText(/State: (Healthy|Warning|Degraded)/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Summarize now" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByLabel("Open thread actions").click();
  await page.getByRole("button", { name: "Rename" }).first().click();
  await page.getByLabel("Rename thread title").fill("Plan Sprint Decisions");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("main").getByText("Plan Sprint Decisions")).toBeVisible();
  await expect(page.getByText("What is areti?", { exact: true })).toBeVisible();

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

test("companion auto-summarizes context under sustained conversation", async ({ page }) => {
  test.setTimeout(180000);
  await signupAndGoDashboard(page);
  await page.goto("/chat");
  await page.getByLabel("Chat prompt").fill("Kick off a long-context stress test thread.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page.getByText("Thinking...")).toHaveCount(0, { timeout: 45000 });
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });

  const threadId = new URL(page.url()).searchParams.get("thread");
  expect(threadId).toBeTruthy();

  await page.evaluate(async (resolvedThreadId) => {
    if (!resolvedThreadId) {
      throw new Error("Missing thread id");
    }

    for (let index = 0; index < 12; index += 1) {
      const prompt = [
        `Turn ${index + 1}: keep all prior commitments in memory.`,
        "Track goals, blockers, and emotional state from earlier turns.",
        "Preserve unresolved questions and action items without losing continuity.",
        "Give practical next-step guidance with explicit tradeoffs.",
      ].join(" ");

      const response = await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat send failed (${response.status}): ${text}`);
      }
    }
  }, threadId);

  await page.goto(`/chat?thread=${threadId}`);
  await page.getByLabel("Open context usage details").click();
  await expect(page.getByText("Context usage (estimated)")).toBeVisible();
  await expect(page.getByText(/State: (Healthy|Warning|Degraded)/)).toBeVisible();
  await expect(page.getByText(/Last summary:/)).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  if ((await page.getByText("State: Degraded").count()) > 0) {
    await expect(page.getByRole("button", { name: "Start new conversation" })).toBeVisible();
  }
});

test("companion allows manual context summarization", async ({ page }) => {
  await signupAndGoDashboard(page);
  await page.goto("/chat");
  await page.getByLabel("Chat prompt").fill("Manual summarize turn 0");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page.getByText("Thinking...")).toHaveCount(0, { timeout: 45000 });
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });

  const threadId = new URL(page.url()).searchParams.get("thread");
  expect(threadId).toBeTruthy();

  await page.evaluate(async (resolvedThreadId) => {
    if (!resolvedThreadId) {
      throw new Error("Missing thread id");
    }

    for (let index = 1; index <= 4; index += 1) {
      const response = await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Manual summarize turn ${index}` }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat send failed (${response.status}): ${text}`);
      }
    }
  }, threadId);

  await page.goto(`/chat?thread=${threadId}`);

  await page.getByLabel("Open context usage details").click();
  await page.getByRole("button", { name: "Summarize now" }).click();
  await expect(
    page.getByText(
      /Context summarized manually to preserve long-term memory efficiency\.|No compaction yet\./,
    ),
  ).toBeVisible();
});

test("companion keeps composer visible while conversation scrolls", async ({ page }) => {
  test.setTimeout(180000);
  await signupAndGoDashboard(page);
  await page.goto("/chat");
  await page.getByLabel("Chat prompt").fill("Start composer visibility test.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page.getByText("Thinking...")).toHaveCount(0, { timeout: 45000 });
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });

  const threadId = new URL(page.url()).searchParams.get("thread");
  expect(threadId).toBeTruthy();

  await page.evaluate(async (resolvedThreadId) => {
    if (!resolvedThreadId) {
      throw new Error("Missing thread id");
    }

    for (let index = 0; index < 14; index += 1) {
      const prompt = [
        `Composer visibility turn ${index + 1}.`,
        "Respond in detail with practical steps, examples, and reflections.",
        "Use multiple paragraphs to make this long enough to require scrolling.",
      ].join(" ");

      const response = await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat send failed (${response.status}): ${text}`);
      }
    }
  }, threadId);

  await page.goto(`/chat?thread=${threadId}`);
  const scroller = page.getByTestId("chat-conversation-scroller");
  await expect(scroller).toBeVisible();

  await scroller.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(page.getByLabel("Jump to latest message")).toBeVisible();

  const chatPrompt = page.getByLabel("Chat prompt");
  await expect(chatPrompt).toBeVisible();
  const box = await chatPrompt.boundingBox();
  const viewport = page.viewportSize();
  expect(box).toBeTruthy();
  expect(viewport).toBeTruthy();
  if (!box || !viewport) {
    throw new Error("Missing chat prompt bounding box or viewport");
  }
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

  await chatPrompt.fill("Composer is still visible and usable.");
  await expect(chatPrompt).toHaveValue("Composer is still visible and usable.");
});

test("companion thread switching opens each thread at latest message", async ({ page }) => {
  test.setTimeout(180000);
  await signupAndGoDashboard(page);
  await page.goto("/chat");

  await page.getByLabel("Chat prompt").fill("Create first thread.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page.getByText("Thinking...")).toHaveCount(0, { timeout: 45000 });
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  const threadA = new URL(page.url()).searchParams.get("thread");
  expect(threadA).toBeTruthy();

  await page.evaluate(async (resolvedThreadId) => {
    if (!resolvedThreadId) {
      throw new Error("Missing thread id");
    }
    for (let index = 0; index < 10; index += 1) {
      const response = await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Thread A long turn ${index + 1}. Keep it detailed.` }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat send failed (${response.status}): ${text}`);
      }
    }
  }, threadA);

  await page.getByLabel("Create a new conversation thread").first().click();
  await expect(page).toHaveURL(/\/chat$/, { timeout: 15000 });
  await page.getByLabel("Chat prompt").fill("Create second thread.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page.getByText("Thinking...")).toHaveCount(0, { timeout: 45000 });
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  const threadB = new URL(page.url()).searchParams.get("thread");
  expect(threadB).toBeTruthy();

  await page.evaluate(async (resolvedThreadId) => {
    if (!resolvedThreadId) {
      throw new Error("Missing thread id");
    }
    for (let index = 0; index < 8; index += 1) {
      const response = await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Thread B long turn ${index + 1}. Keep it detailed.` }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Chat send failed (${response.status}): ${text}`);
      }
    }
  }, threadB);

  await page.goto(`/chat?thread=${threadA}`);
  await expect(page.getByTestId("chat-conversation-scroller")).toBeVisible();
  expect(await remainingConversationScroll(page)).toBeLessThan(100);

  await page.goto(`/chat?thread=${threadB}`);
  await expect(page.getByTestId("chat-conversation-scroller")).toBeVisible();
  expect(await remainingConversationScroll(page)).toBeLessThan(100);
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
  await expect(page).toHaveURL(/\/account\/preferences\?saved=preferences/, { timeout: 15000 });

  await page.goto("/account/preferences");
  await page.getByLabel("Primary goal").selectOption("build_discipline");
  await page.getByRole("checkbox", { name: "Habits" }).check();
  await page.getByRole("checkbox", { name: "Stoicism" }).check();
  await page.getByLabel("Experience level").selectOption("somewhat_familiar");
  await page.getByRole("button", { name: "Save personalization" }).click();
  await expect(page).toHaveURL(/\/account\/preferences\?saved=personalization/, { timeout: 15000 });

  await page.goto("/account/preferences");
  await expect(page.locator('input[name=\"timezone\"]')).toHaveValue("America/New_York");
  await expect(page.locator('select[name=\"profileVisibility\"]')).toHaveValue("contacts");
  await expect(page.locator('select[name=\"primaryGoal\"]')).toHaveValue("build_discipline");
  await expect(page.locator('select[name=\"experienceLevel\"]')).toHaveValue("somewhat_familiar");

  await page.goto("/account/profile");
  await page.locator('input[name=\"name\"]').fill("Persisted Name");
  await page.locator('input[name=\"username\"]').fill("persisted_user");
  await page.locator('textarea[name=\"summary\"]').fill("Profile persistence check.");
  await page.locator('form:has(input[name=\"name\"]) button[type=\"submit\"]').click();
  await expect(page).toHaveURL(/\/account\/profile\?saved=profile/, { timeout: 15000 });

  await page.locator('input[name=\"avatarMode\"][value=\"preset\"]').check();
  await page.locator('select[name=\"avatarPreset\"]').selectOption("ocean_focus");
  await page.locator('form:has(input[name=\"avatarFile\"]) button[type=\"submit\"]').click();
  await expect(page).toHaveURL(/\/account\/profile\?saved=avatar/, { timeout: 15000 });

  const avatarInput = page.locator('input[name="avatarFile"]');
  await avatarInput.setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Yx3sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.locator('form:has(input[name=\"avatarFile\"]) button[type=\"submit\"]').click();
  await expect(page).toHaveURL(/\/account\/profile\?saved=avatar/, { timeout: 15000 });
  await expect(page.getByAltText("Profile avatar")).toBeVisible();

  await page.locator('input[name=\"avatarMode\"][value=\"initials\"]').check();
  await page.locator('form:has(input[name=\"avatarFile\"]) button[type=\"submit\"]').click();
  await expect(page).toHaveURL(/\/account\/profile\?saved=avatar/, { timeout: 15000 });
  await expect(page.getByAltText("Profile avatar")).toHaveCount(0);

  await page.goto("/account/profile");
  await expect(page.locator('input[name=\"name\"]')).toHaveValue("Persisted Name");
  await expect(page.locator('input[name=\"username\"]')).toHaveValue("persisted_user");
  await expect(page.locator('textarea[name=\"summary\"]')).toHaveValue("Profile persistence check.");
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
  await acceptSignupLegal(page);
  await page.getByRole("button", { name: "Continue" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/(verify-email|signup\/complete)/, { timeout: 5000 });
  } catch {
    await signupEmailInput.fill(email);
    await expect(signupEmailInput).toHaveValue(email);
    await acceptSignupLegal(page);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page).toHaveURL(/\/auth\/(verify-email|signup\/complete)/, { timeout: 15000 });
  if (/\/auth\/verify-email/.test(page.url())) {
    await expectUrl(page, /\/auth\/signup\/complete/);
  }
  await expectUrl(page, /\/auth\/signup\/complete/);
  await page.getByLabel("Name", { exact: true }).fill("Password User");
  await page.getByLabel("Username", { exact: true }).fill(`password_${Date.now().toString().slice(-6)}`);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expectUrl(page, /\/onboarding/);

  await completeOnboarding(page);

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
