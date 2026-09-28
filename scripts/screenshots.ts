import { chromium, devices, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import type { ChatOrder, ChatProduct, ChatViewMessage } from "../src/lib/chat/schema";
import type { CartQuote } from "../src/lib/pricing";
import type { StoredCartItem } from "../src/lib/cart/schema";

async function main() {
  const base = new URL(process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3100");
  const local = ["localhost", "127.0.0.1"].includes(base.hostname);
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/" || (!local && base.protocol !== "https:")) {
    throw new Error("Use a clean HTTPS site origin, or localhost. Never put credentials in the URL.");
  }
  if (process.env.SCREENSHOT_FICTIONAL_DATA !== "true") throw new Error("Confirm SCREENSHOT_FICTIONAL_DATA=true only for a demo containing fictional customers.");
  const token = process.env.SCREENSHOT_ADMIN_TOKEN;
  if (!token || token.length < 32) throw new Error("Set SCREENSHOT_ADMIN_TOKEN privately for this target site.");
  const staged = process.env.SCREENSHOT_STAGED_CHAT === "true";
  if (!staged && process.env.SCREENSHOT_ALLOW_AI_CALLS !== "true") {
    throw new Error("Live chat captures can cost money. Explicitly approve them with SCREENSHOT_ALLOW_AI_CALLS=true, or use staged chat.");
  }
  const output = "portfolio-assets/upwork";
  const optimized = "docs/screenshots";
  const manifest: { name: string; bytes: number }[] = [];
  const browser = await chromium.launch();
  await mkdir(output, { recursive: true }); await mkdir(optimized, { recursive: true });

  async function optimize(name: string, input: Buffer) {
    let result = Buffer.alloc(0);
    for (const width of [1920, 1600, 1280, 1000]) {
      for (const quality of [85, 75, 65, 55]) {
        result = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
        if (result.length < 500_000) break;
      }
      if (result.length < 500_000) break;
    }
    if (result.length >= 500_000) throw new Error(`Image exceeds the size budget: ${name}`);
    await writeFile(`${optimized}/${name}.webp`, result);
    manifest.push({ name, bytes: result.length });
  }
  async function capture(page: Page, name: string, fullPage = true) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      // Load below-the-fold product photographs before a full-page capture.
      document.querySelectorAll("img").forEach(img => { img.loading = "eager"; });
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    if (token && ((await page.locator("body").innerText()).includes(token) || page.url().includes(token))) {
      throw new Error("Refusing to capture an exposed access token.");
    }
    const png = await page.screenshot({ fullPage, animations: "disabled", caret: "hide" });
    await writeFile(`${output}/${name}.png`, png); await optimize(name, png);
    console.log(`Captured ${name}`);
  }
  async function chat(page: Page, product: ChatProduct, lookup = false) {
    if (staged) {
      let order: ChatOrder | undefined;
      if (lookup) {
        const response = await page.request.post("/api/orders/track", { headers: { origin: base.origin }, data: {
          orderNumber: process.env.SCREENSHOT_ORDER_NUMBER ?? "EO-0000000000000001",
          email: process.env.SCREENSHOT_ORDER_EMAIL ?? "demo@example.com",
        } });
        if (!response.ok()) throw new Error("Provide a matching fictional order number and email for the screenshot.");
        const { order: found } = await response.json() as { order: ChatOrder };
        order = { number: found.number, status: found.status, totalCents: found.totalCents, trackingNumber: found.trackingNumber };
      }
      await page.route("**/api/chat/session", route => route.fulfill({ json: { messages: [], remaining: 20, available: true } }));
      const message: ChatViewMessage = { id: "illustrative-portfolio-reply", role: "ASSISTANT",
        text: lookup ? "Here is the status recorded for your order." : "For a rich, chocolatey cup, start with Huila Hearth. Try it as espresso or in your French press.",
        ...(lookup ? { order } : { products: [product] }),
      };
      await page.route("**/api/chat", route => route.fulfill({ contentType: "application/x-ndjson", body: [
        { type: "text", text: message.text }, { type: "result", message, remaining: 19 },
      ].map(event => JSON.stringify(event)).join("\n") + "\n" }));
    }
    await page.goto("/");
    await page.getByRole("button", { name: "Open coffee chat" }).click();
    const dialog = page.getByRole("dialog", { name: "Your coffee guide" });
    const prompt = lookup
      ? `Please track ${process.env.SCREENSHOT_ORDER_NUMBER ?? "EO-0000000000000001"} for ${process.env.SCREENSHOT_ORDER_EMAIL ?? "demo@example.com"}`
      : "I like rich, chocolatey coffee. What do you recommend?";
    await dialog.getByLabel("Your message").fill(prompt);
    await dialog.getByRole("button", { name: "Send message" }).click();
    if (lookup) await expect(dialog.getByText("Payment confirmed", { exact: true })).toBeVisible({ timeout: 60_000 });
    else await expect(dialog.getByTestId("chat-product-card").first()).toBeVisible({ timeout: 60_000 });
    await expect(dialog.getByLabel("Your message")).toBeEnabled();
  }
  try {
    const context = await browser.newContext({ baseURL: base.origin, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, locale: "en-US", colorScheme: "light", reducedMotion: "reduce", serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/"); await capture(page, "01-home");
    await page.goto("/shop"); await capture(page, "02-catalog");
    await page.goto("/shop/huila-hearth"); await capture(page, "03-product");
    const notes = await page.getByText("Tastes like", { exact: true }).locator("..").textContent();
    await page.getByRole("button", { name: "Add Huila Hearth to cart" }).first().click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    const items = await page.evaluate<StoredCartItem[]>(() => JSON.parse(localStorage.getItem("ember-oak-cart-v1") ?? "[]"));
    const quoteResponse = await context.request.post("/api/cart/quote", { data: { items } });
    if (!quoteResponse.ok()) throw new Error("Could not load current database prices.");
    const quote = await quoteResponse.json() as CartQuote;
    const line = quote.lines[0];
    if (!line || line.issue) throw new Error("Huila Hearth must be in stock for the capture.");
    const product: ChatProduct = { id: line.productId, slug: line.slug, name: line.name, type: "COFFEE",
      priceCents: line.unitPriceCents, stock: line.maxQuantity, imageUrl: line.imageUrl,
      imageAlt: "Huila Hearth coffee", tastingNotes: (notes ?? "").replace(/^Tastes like /, "").split(", ").filter(Boolean), tagline: "Sweet and balanced" };
    await page.goto("/cart"); await expect(page.getByTestId("cart-total")).toContainText("$"); await capture(page, "04-cart");
    await chat(page, product); await capture(page, "05-chat-recommendations", false);
    const orderPage = await context.newPage();
    await chat(orderPage, product, true); await capture(orderPage, "06-chat-order", false);
    // Authenticate via POST only. No login page, tracing, HAR, video or storageState is recorded.
    const login = await context.request.post("/api/admin/session", { data: { token }, headers: { origin: base.origin }, maxRedirects: 0 });
    if (!login.ok()) throw new Error(`Owner sign-in failed (${login.status()}); no login screenshot was saved.`);
    try {
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "A little clarity for your day." })).toBeVisible();
      await capture(page, "07-admin");
    } finally { await context.request.delete("/api/admin/session", { headers: { origin: base.origin }, maxRedirects: 0 }); }
    const mobile = await browser.newContext({ ...devices["iPhone 13"], baseURL: base.origin, deviceScaleFactor: 2, locale: "en-US", colorScheme: "light", reducedMotion: "reduce", serviceWorkers: "block" });
    const phone = await mobile.newPage();
    await phone.goto("/"); await capture(phone, "08-mobile-home");
    await chat(phone, product); await capture(phone, "09-mobile-chat", false);

    const backdrop = Buffer.from(`<svg width="1600" height="1200" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="1200" fill="#f5f0e7"/><text x="70" y="105" font-family="Georgia" font-size="60" fill="#30221d">Ember &amp; Oak</text><text x="73" y="157" font-family="Arial" font-size="24" fill="#745648">Specialty coffee. Thoughtful commerce.</text><rect x="60" y="205" width="1080" height="850" rx="22" fill="#30221d"/><rect x="1162" y="305" width="377" height="626" rx="30" fill="#30221d"/><text x="73" y="1120" font-family="Arial" font-size="25" fill="#30221d">Storefront + AI coffee guide + owner dashboard</text><text x="73" y="1160" font-family="Arial" font-size="18" fill="#745648">Portfolio concept · Fictional brand and illustrative conversations</text></svg>`);
    const desktop = await sharp(`${output}/01-home.png`).resize({ width: 1056 }).extract({ left: 0, top: 0, width: 1056, height: 826 }).toBuffer();
    const mobileChat = await sharp(`${output}/09-mobile-chat.png`).resize({ width: 353 }).toBuffer();
    const cover = await sharp(backdrop).composite([{ input: desktop, left: 72, top: 217 }, { input: mobileChat, left: 1174, top: 317 }]).png().toBuffer();
    await writeFile(`${output}/cover.png`, cover); await optimize("cover", cover);
    await writeFile(`${optimized}/manifest.json`, JSON.stringify({ capturedAt: new Date().toISOString(), source: local ? "isolated local preview" : base.origin,
      deviceScaleFactor: 2, chat: staged ? "Illustrative intercepted replies; product price fetched from the real quote API. No AI calls." : "Live provider replies.",
      data: "Fictional demonstration data; not business performance or payment evidence.", images: manifest }, null, 2) + "\n");
  } finally { await browser.close(); }
}
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Screenshot capture failed.";
  console.error(message.replaceAll(process.env.SCREENSHOT_ADMIN_TOKEN ?? "unused-placeholder", "[redacted]"));
  process.exitCode = 1;
});
