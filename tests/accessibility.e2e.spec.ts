import { expect, test } from "@playwright/test";

async function signup(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/auth/signup");
  const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
  if (await cookieAccept.count()) {
    await cookieAccept.first().click();
  }

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `a11y+${uniqueId}@example.com`;

  await page.getByLabel("Name").fill("A11y User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Confirm Password").fill("StrongPass123");
  await page
    .getByRole("checkbox", { name: /I accept the Terms and Conditions/i })
    .check();
  await page
    .getByRole("checkbox", { name: /I accept the Privacy Policy/i })
    .check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email/, { timeout: 15000 });
  await page.getByRole("button", { name: "Verify Email" }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

  await page.getByLabel("Primary objective").selectOption("Calm anxiety");
  await page.getByLabel("Current biggest difficulty").selectOption("Overthinking");
  await page.getByLabel("Main need right now").selectOption("Clarity");
  await page.getByLabel("Daily time available").selectOption("10 min");
  await page.getByLabel("Preferred coaching style").selectOption("Direct");
  await page.getByLabel("Experience with contemplative practice").selectOption("New");
  await page.getByLabel("Preferred practice format").selectOption("Mixed");
  await page.getByLabel("30-day success definition").selectOption("Greater inner calm");
  await page.getByRole("button", { name: "Continue to dashboard" }).click();
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
  expect(["a", "button", "input", "select", "textarea", "summary", "nextjs-portal", "div"]).toContain(
    focused,
  );
}

test("a11y smoke checks core secured routes", async ({ page }) => {
  await signup(page);
  await checkRouteA11y(page, "/dashboard");
  await checkRouteA11y(page, "/community");
  await checkRouteA11y(page, "/account");
  await checkRouteA11y(page, "/chat");

  await page.goto("/chat");
  await expect(page.getByLabel("Create a new conversation thread").first()).toBeVisible();
  await expect(page.getByLabel("Chat prompt")).toBeVisible();
  await expect(page.getByLabel("Show active threads")).toBeVisible();
  await expect(page.getByLabel("Show archived threads")).toBeVisible();
  await page.getByLabel("Chat prompt").fill("Create one test thread.");
  await page.getByRole("button", { name: "Send chat message" }).click();
  await expect(page).toHaveURL(/\/chat\?thread=/, { timeout: 15000 });
  await page.getByRole("button", { name: /^Archive$/ }).first().click();
  await expect(page.getByRole("button", { name: "Restore" })).toBeVisible();
  await page.getByLabel("Show archived threads").click();
  await page.getByRole("button", { name: "Restore" }).click();
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? "");
  expect(["button", "input", "textarea", "a", "summary", "nextjs-portal", "div"]).toContain(
    focusedTag,
  );
});
