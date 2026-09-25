import { expect, test } from "@playwright/test";

test.describe("storefront", () => {
  test("home page shows the demo banner and featured coffees", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("note")).toContainText("4242 4242 4242 4242");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Roasted twice a week");
    await expect(page.getByRole("heading", { name: "Fresh off the roaster" })).toBeVisible();
  });

  test("catalog filters narrow the results and live in the URL", async ({ page, isMobile }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "12 products" })).toBeVisible();

    // Desktop shows a sidebar; mobile opens the same panel in a dialog.
    if (isMobile) await page.getByRole("button", { name: /^Filters/ }).click();
    const panel = isMobile ? page.getByRole("dialog") : page.getByRole("complementary", { name: "Product filters" });
    await panel.getByLabel("Dark", { exact: true }).check();

    await expect(page).toHaveURL(/roast=DARK/);
    await expect(page.getByRole("heading", { name: "1 product" })).toBeVisible();
    if (isMobile) await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Old Growth Sumatra" })).toBeVisible();
  });

  test("add a coffee with a grind to the cart and see a server-priced total", async ({ page }) => {
    await page.goto("/shop/huila-hearth");
    await page.getByLabel("Grind").selectOption("FRENCH_PRESS");
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add Huila Hearth to cart" }).first().click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.goto("/cart");
    const line = page.getByTestId("cart-line");
    await expect(line).toHaveCount(1);
    await expect(line).toContainText("Coarse (French press)");
    // 2 × $19.00 = $38.00, plus $6.00 flat shipping below the $50 threshold.
    await expect(page.getByTestId("cart-total")).toHaveText("$44.00");

    // The cart survives a reload.
    await page.reload();
    await expect(page.getByTestId("cart-total")).toHaveText("$44.00");
  });

  test("unknown products show a friendly 404", async ({ page }) => {
    const response = await page.goto("/shop/not-a-real-coffee");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /couldn.t find that coffee/i })).toBeVisible();
  });
});
