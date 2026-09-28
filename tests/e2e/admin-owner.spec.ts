import { config } from "dotenv";
import { expect, test } from "@playwright/test";

config({ path: ".env.local", quiet: true });
// The login request contains a secret. Never capture Playwright traces for this file.
test.use({ trace: "off", screenshot: "off", video: "off" });

test("owner can review each workspace view and revoke the session", async ({ page }) => {
  const token = process.env.ADMIN_TOKEN;
  test.skip(!token || token.length < 32, "Configure local owner access with npm run admin:token.");
  await page.goto("/admin");
  test.skip(!["localhost", "127.0.0.1", "[::1]"].includes(new URL(page.url()).hostname), "Never send a local owner token to a remote browser-test target.");
  const response = await page.request.post("/api/admin/session", {
    headers: { origin: new URL(page.url()).origin }, data: { token },
  });
  expect(response.status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("heading", { name: "A little clarity for your day." })).toBeVisible();
  expect((await page.content()).includes(token!)).toBe(false);
  expect(page.url().includes(token!)).toBe(false);
  const nav = page.getByRole("navigation", { name: "Owner dashboard" });
  for (const name of ["Orders", "Conversations", "Support requests", "Overview"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.goto("/admin?view=leads");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});
