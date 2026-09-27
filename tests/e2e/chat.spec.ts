import { expect, test, type Page } from "@playwright/test";

async function mockSession(page: Page, options: { remaining?: number; available?: boolean } = {}) {
  await page.route("**/api/chat/session", (route) => route.fulfill({ json: { messages: [], remaining: options.remaining ?? 20, available: options.available ?? true } }));
}
function streamedReply(text: string, extra: Record<string, unknown> = {}) {
  return [
    { type: "status", text: "Preparing your reply…" },
    { type: "text", text: text.slice(0, 10) }, { type: "text", text: text.slice(10) },
    { type: "result", message: { id: "assistant-test", role: "ASSISTANT", text, ...extra }, remaining: 19 },
  ].map((event) => JSON.stringify(event)).join("\n") + "\n";
}

test("chat opens on a product page, sends a bounded message and closes by keyboard", async ({ page }) => {
  await mockSession(page);
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    expect(Object.keys(body).sort()).toEqual(["message", "requestId"]);
    await route.fulfill({ contentType: "application/x-ndjson", body: streamedReply("We roast twice a week in Portland.") });
  });
  await page.goto("/shop/huila-hearth");
  await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog", { name: "Your coffee guide" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Your message").fill("How often do you roast?");
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(dialog.getByText("We roast twice a week in Portland.")).toBeVisible();
  await expect(dialog.getByLabel("Your message")).toBeEnabled();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open coffee chat" })).toBeFocused();
});

test("a recommendation displays its database-priced card and adds whole beans to cart", async ({ page }) => {
  await mockSession(page);
  const product = { id: "test-coffee", slug: "huila-hearth", name: "Huila Hearth", type: "COFFEE", priceCents: 1900, stock: 4,
    imageUrl: "/images/products/huila-hearth.webp", imageAlt: "Coffee", tastingNotes: ["Cocoa", "Orange"], tagline: "Sweet and balanced" };
  await page.route("**/api/chat", (route) => route.fulfill({ contentType: "application/x-ndjson", body: streamedReply("Here is a coffee from our catalog.", { products: [product] }) }));
  let conversion: unknown;
  await page.route("**/api/chat/conversion", async (route) => { conversion = route.request().postDataJSON(); await route.fulfill({ json: { recorded: true } }); });
  await page.goto("/"); await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Recommend coffee for espresso" }).click();
  await expect(dialog.getByTestId("chat-product-price")).toHaveText("$19.00");
  await dialog.getByRole("button", { name: "Add Huila Hearth to cart" }).click();
  await expect.poll(() => conversion).toEqual({ messageId: "assistant-test", productId: "test-coffee" });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ember-oak-cart-v1")!)[0].grind)).toBe("WHOLE_BEAN");
});

test("order status is rendered from the tool result without exposing addresses", async ({ page }) => {
  await mockSession(page);
  await page.route("**/api/chat", (route) => route.fulfill({ contentType: "application/x-ndjson", body: streamedReply("Here is the status recorded for your order.", {
    order: { number: "EO-0123456789ABCDEF", status: "PAID", totalCents: 2500, trackingNumber: null },
  }) }));
  await page.goto("/"); await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your message").fill("EO-0123456789ABCDEF buyer@example.com");
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(dialog.getByText("Payment confirmed", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Total: $25.00")).toBeVisible();
});

test("offline demo still allows saving a human-support lead", async ({ page }) => {
  await mockSession(page, { available: false });
  await page.route("**/api/chat/lead", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ name: "Demo Buyer", email: "demo@example.com", question: "Can you help me choose a coffee?", consent: true });
    await route.fulfill({ json: { saved: true } });
  });
  await page.goto("/"); await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/AI replies are not enabled/)).toBeVisible();
  await dialog.getByRole("button", { name: "Talk to a human" }).click();
  await dialog.getByLabel("Your name").fill("Demo Buyer");
  await dialog.getByLabel("Email address").fill("demo@example.com");
  await dialog.getByLabel("How can we help?").fill("Can you help me choose a coffee?");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Save request" }).click();
  await expect(dialog.getByRole("heading", { name: "Your request is saved" })).toBeVisible();
  await expect(dialog.getByText(/no real support response will be sent/)).toBeVisible();
});

test("message cap leaves the FAQ and human contact available", async ({ page }) => {
  await mockSession(page, { remaining: 0 });
  await page.goto("/"); await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Your message")).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Talk to a human" })).toBeEnabled();
  await expect(dialog.getByRole("link", { name: "FAQ", exact: true })).toBeVisible();
});

test("network errors are readable and do not trap the composer", async ({ page }) => {
  await mockSession(page);
  await page.route("**/api/chat", (route) => route.fulfill({ status: 503, json: { error: "Our coffee guide is unavailable. Please try again." } }));
  await page.goto("/"); await page.getByRole("button", { name: "Open coffee chat" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Recommend coffee for espresso" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Please try again");
  await expect(dialog.getByLabel("Your message")).toBeEnabled();
});
