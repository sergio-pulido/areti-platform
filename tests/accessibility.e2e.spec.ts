import { expect, test } from "@playwright/test";

async function signup(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/auth/signup");

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `a11y+${uniqueId}@example.com`;

  await page.getByLabel("Name").fill("A11y User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Confirm Password").fill("StrongPass123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function checkRouteA11y(page: import("@playwright/test").Page, route: string): Promise<void> {
  await page.goto(route);

  const main = page.locator("main");
  await expect(main).toHaveCount(1);

  const firstVisibleInteractive = page
    .locator("a[href], button, input, select, textarea")
    .filter({ hasNot: page.locator("[disabled]") })
    .first();
  await expect(firstVisibleInteractive).toBeVisible();

  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? "");
  expect(["a", "button", "input", "select", "textarea", "summary"]).toContain(focused);
}

test("a11y smoke checks core secured routes", async ({ page }) => {
  await signup(page);
  await checkRouteA11y(page, "/dashboard");
  await checkRouteA11y(page, "/community");
  await checkRouteA11y(page, "/account");
  await checkRouteA11y(page, "/dashboard/chat");
});
