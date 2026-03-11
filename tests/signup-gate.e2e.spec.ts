import { expect, test } from "@playwright/test";

const signupDisabled = (process.env.SIGNUP_ENABLED ?? "").trim().toLowerCase() === "false";

test.describe("signup gate in private beta mode", () => {
  test.skip(!signupDisabled, "Run this suite with SIGNUP_ENABLED=false.");

  test("hides signup CTAs on auth screens when disabled", async ({ page }) => {
    await page.goto("/auth/signin");

    const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
    if (await cookieAccept.count()) {
      await cookieAccept.first().click();
    }

    await expect(page.getByRole("link", { name: "Create account" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Create your account" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Get started" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("replaces /auth/signup with private-beta messaging and blocks API signup", async ({ page }) => {
    await page.goto("/auth/signup");

    const cookieAccept = page.getByRole("button", { name: "Accept cookies" });
    if (await cookieAccept.count()) {
      await cookieAccept.first().click();
    }

    await expect(page.getByRole("heading", { name: "Private beta" })).toBeVisible();
    await expect(
      page.getByText("Areti is currently available by invitation only.").first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create free account" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveCount(0);

    const blocked = await page.request.post("http://localhost:43101/api/v1/auth/signup", {
      data: {
        email: `private-beta-${Date.now()}@example.com`,
        password: "StrongPass123",
        acceptLegal: true,
      },
    });

    expect(blocked.status()).toBe(403);

    const payload = (await blocked.json()) as {
      error: string;
      code: string;
    };

    expect(payload.code).toBe("SIGNUP_DISABLED");
    expect(payload.error).toBe("Signup is currently disabled. This beta is invite-only.");
  });
});
