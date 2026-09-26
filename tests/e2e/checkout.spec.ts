import { expect, test } from "@playwright/test";

async function addCoffee(page: import("@playwright/test").Page) {
  await page.goto("/shop/huila-hearth");
  await page.getByRole("button", { name: "Add Huila Hearth to cart" }).first().click();
  await page.goto("/cart");
  await expect(page.getByTestId("cart-total")).toHaveText("$25.00");
}

const order = {
  number: "EO-0123456789ABCDEF", status: "PAID", createdAt: "2026-09-26T12:00:00.000Z",
  subtotalCents: 1900, shippingCents: 600, totalCents: 2500, trackingNumber: null,
  items: [{ name: "Huila Hearth", grind: "WHOLE_BEAN", quantity: 1, unitPriceCents: 1900 }],
};

test("checkout submits identifiers and follows the Stripe redirect", async ({ page }) => {
  // Network boundary stub: no Stripe account, real payment, or external request is needed.
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/checkout", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { url: "https://checkout.stripe.com/c/pay/test-browser-boundary" } });
  });
  await page.route("https://checkout.stripe.com/**", (route) => route.fulfill({
    contentType: "text/html", body: "<h1>Stripe checkout boundary</h1>",
  }));
  await addCoffee(page);
  await page.getByRole("button", { name: "Checkout securely" }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/test-browser-boundary");
  expect(sent?.expectedTotalCents).toBe(2500);
  expect(sent?.checkoutKey).toMatch(/^[a-f0-9-]{36}$/);
  expect((sent?.items as Record<string, unknown>[])[0]).not.toHaveProperty("priceCents");
});

test("checkout errors preserve the cart and allow a retry", async ({ page }) => {
  await page.route("**/api/checkout", (route) => route.fulfill({ status: 503, json: {
    error: "Test checkout is not configured yet. Your cart is saved.",
  } }));
  await addCoffee(page);
  await page.getByRole("button", { name: "Checkout securely" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your cart is saved" })).toBeVisible();
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Checkout securely" })).toBeEnabled();
});

test("confirmation waits for the server's payment status", async ({ page }) => {
  let confirmed = false;
  await page.route("**/api/orders/confirmation", (route) => {
    return route.fulfill({ json: { order: { ...order, status: confirmed ? "PAID" : "PENDING" } } });
  });
  await page.goto("/checkout/success?session_id=cs_test_browser_fixture_0123456789");
  await expect(page.getByRole("heading", { name: "Awaiting payment confirmation" })).toBeVisible();
  confirmed = true;
  await expect(page.getByRole("heading", { name: "Payment confirmed", exact: true })).toBeVisible();
  await expect(page.getByText(order.number)).toBeVisible();
});

test("an arbitrary success URL never claims a paid order", async ({ page }) => {
  await page.goto("/checkout/success");
  await expect(page.getByText("No checkout session was provided.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment confirmed", exact: true })).toHaveCount(0);
});

test("tracking submits both credentials privately and shows the order", async ({ page }) => {
  await page.route("**/api/orders/track", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ orderNumber: order.number, email: "buyer@example.com" });
    await route.fulfill({ json: { order } });
  });
  await page.goto("/track-order");
  await page.getByLabel("Order number", { exact: true }).fill(order.number);
  await page.getByLabel("Email used at checkout").fill("buyer@example.com");
  await page.getByRole("button", { name: "Find my order" }).click();
  await expect(page.getByRole("heading", { name: "Payment confirmed", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/track-order$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("cancelling checkout keeps the cart", async ({ page }) => {
  await addCoffee(page);
  await page.goto("/checkout/cancel");
  await page.getByRole("link", { name: "Return to cart" }).click();
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
});
