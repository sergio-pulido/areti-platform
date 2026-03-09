import { expect, test } from "@playwright/test";

test("pwa assets and offline route are available", async ({ page }) => {
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = (await manifestResponse.json()) as {
    name: string;
    display: string;
    icons: Array<{ src: string }>;
    screenshots: Array<{ src: string }>;
  };

  expect(manifest.name).toBe("Areti Platform");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some((icon) => icon.src.includes("icon"))).toBeTruthy();
  expect(
    manifest.screenshots.some((shot) => shot.src.includes("pwa-screenshot-wide.png")),
  ).toBeTruthy();

  const swResponse = await page.request.get("/sw.js");
  expect(swResponse.ok()).toBeTruthy();
  expect(swResponse.headers()["cache-control"]).toContain("no-cache");
  const swText = await swResponse.text();
  expect(swText).toContain("const SW_VERSION");

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "You’re offline right now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();
});
