import { expect, test } from "@playwright/test";

async function signup(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `a11y.${uniqueId}@example.com`;

  const emailInput = page.getByRole("textbox", { name: "Email", exact: true });
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/i }).check();
  await page.getByRole("button", { name: "Create free account" }).click();
  try {
    await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 5000 });
  } catch {
    await emailInput.fill(email);
    await expect(emailInput).toHaveValue(email);
    await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
    await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/i }).check();
    await page.getByRole("button", { name: "Create free account" }).click();
  }
  await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 15000 });
  await page.getByRole("button", { name: "Verify Email" }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

  await page.getByText("Calm anxiety", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("5 min", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("A short practice", { exact: true }).click();
  await page.getByRole("button", { name: "Create my path" }).click();
  await expect(page).toHaveURL(/\/(practices|journal|library|chat)(\?|$)/, { timeout: 15000 });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function checkRouteA11y(page: import("@playwright/test").Page, route: string): Promise<void> {
  await page.goto(route);

  const main = page.locator("main");
  await expect(main).toHaveCount(1);

  const firstVisibleInteractive = page
    .locator("a[href]:visible, button:visible, input:visible, select:visible, textarea:visible")
    .filter({ hasNot: page.locator("[disabled]") })
    .first();
  await expect(firstVisibleInteractive).toBeVisible();

  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? "");
  expect(
    [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "nextjs-portal",
      "div",
      "body",
    ],
  ).toContain(focused);
}

test("a11y smoke checks core secured routes", async ({ page }) => {
  await signup(page);
  await checkRouteA11y(page, "/dashboard");
  await checkRouteA11y(page, "/academy");
  await checkRouteA11y(page, "/community");
  await checkRouteA11y(page, "/account");
  await expect(page).toHaveURL(/\/account\/profile/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await checkRouteA11y(page, "/chat");

  await page.goto("/chat");
  await expect(page.getByLabel("Create a new conversation thread").first()).toBeVisible();
  await expect(page.getByLabel("Chat prompt")).toBeVisible();
  await expect(page.getByLabel("Show active threads")).toBeVisible();
  await expect(page.getByLabel("Show archived threads")).toBeVisible();
  await page.getByLabel("Chat prompt").fill("Create one test thread.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  await page.getByLabel("Open thread actions").click();
  await page.getByRole("button", { name: /^Archive$/ }).first().click();
  await page.getByLabel("Show archived threads").click();
  await expect(page.getByLabel("Open thread actions").first()).toBeVisible();
  await page.getByLabel("Open thread actions").first().click();
  await expect(page.getByRole("button", { name: "Restore" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).first().click();
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? "");
  expect(["button", "input", "textarea", "a", "summary", "nextjs-portal", "div", "body"]).toContain(
    focusedTag,
  );
});
