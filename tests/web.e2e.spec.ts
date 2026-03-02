import { expect, test } from "@playwright/test";

test("landing loads API content and signup reaches dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Platform Pillars")).toBeVisible();
  await expect(page.getByText("Stoic Core")).toBeVisible();

  await page.goto("/auth/signup");

  const email = `admin+${Date.now()}@example.com`;

  await page.getByLabel("Name").fill("Admin E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Confirm Password").fill("StrongPass123");

  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Welcome, Admin")).toBeVisible();
  await expect(page.getByRole("link", { name: "CMS" })).toBeVisible();
});
