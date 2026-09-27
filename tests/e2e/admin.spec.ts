import { expect, test } from "@playwright/test";

test("owner routes require sign-in and keep the shopping widget out", async ({ page }) => {
  await page.goto("/admin?view=orders");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Owner dashboard" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open coffee chat" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const response = await page.request.patch("/api/admin/leads/unknown", {
    headers: { origin: new URL(page.url()).origin }, data: { status: "CLOSED", expectedStatus: "OPEN" },
  });
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await page.getByRole("link", { name: /Visit store/ }).click();
  await expect(page.getByRole("button", { name: "Open coffee chat" })).toBeVisible();
});

test("owner login refuses cross-origin submissions", async ({ page }) => {
  await page.goto("/admin");
  const response = await page.request.post("/api/admin/session", {
    headers: { origin: "https://unrelated.example" }, data: { token: "not-a-real-token" },
  });
  expect(response.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});
