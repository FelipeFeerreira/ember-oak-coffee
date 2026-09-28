import { expect, test } from "@playwright/test";

test("browse, choose a grind, retain server pricing and reach Stripe", async ({ page }) => {
  await page.goto("/shop?roast=MEDIUM");
  await page.getByRole("heading", { name: "Huila Hearth", exact: true }).getByRole("link").click();
  await page.getByLabel("Grind", { exact: true }).selectOption("FILTER");
  await page.getByRole("button", { name: "Add Huila Hearth to cart" }).first().click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  // A visitor can edit storage; the app must still obtain the real price from Postgres.
  await page.evaluate(() => {
    const key = "ember-oak-cart-v1";
    const items = JSON.parse(localStorage.getItem(key)!);
    items[0].priceCents = 1; items[0].unitPriceCents = 1;
    localStorage.setItem(key, JSON.stringify(items));
  });
  await page.goto("/cart");
  await expect(page.getByTestId("cart-total")).toHaveText("$25.00");
  await page.reload();
  await expect(page.getByTestId("cart-total")).toHaveText("$25.00");
  // Opening chat stays local; no provider call is needed for this checkout journey.
  await page.route("**/api/chat/session", route => route.fulfill({ json: { messages: [], remaining: 20, available: false } }));
  await page.getByRole("button", { name: "Open coffee chat" }).click();
  await expect(page.getByRole("dialog", { name: "Your coffee guide" })).toBeVisible();
  await page.getByRole("button", { name: "Close coffee chat" }).click();
  let checkoutBody: Record<string, unknown> | undefined;
  await page.route("**/api/checkout", async route => {
    checkoutBody = route.request().postDataJSON();
    await route.fulfill({ json: { url: "https://checkout.stripe.com/c/pay/test-journey" } });
  });
  await page.route("https://checkout.stripe.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Stripe test redirect boundary</h1>" }));
  await page.getByRole("button", { name: "Checkout securely" }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/test-journey");
  expect(checkoutBody?.expectedTotalCents).toBe(2500);
  const items = checkoutBody?.items as Record<string, unknown>[];
  expect(items[0]).toMatchObject({ quantity: 1, grind: "FILTER" });
  expect(items[0]).not.toHaveProperty("priceCents");
  expect(items[0]).not.toHaveProperty("unitPriceCents");
});
