// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "ember-oak-cart-v1";
const item = { productId: "p1", slug: "huila-hearth", name: "Huila Hearth", imageUrl: "/x.webp", grind: "FILTER" as const };

// The store keeps module-level state, so load a fresh copy for every test.
async function loadStore() {
  vi.resetModules();
  return import("@/lib/cart/store");
}

describe("cart store", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds items, merges repeats and persists to localStorage", async () => {
    const { cart } = await loadStore();
    cart.add(item, 1);
    cart.add(item, 2);
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(saved).toHaveLength(1);
    expect(saved[0].quantity).toBe(3);
  });

  it("caps quantity at the per-line maximum", async () => {
    const { cart } = await loadStore();
    cart.add(item, 50);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)[0].quantity).toBe(10);
  });

  it("removes a line when its quantity drops to zero", async () => {
    const { cart } = await loadStore();
    cart.add(item, 1);
    cart.setQuantity("p1:FILTER", 0);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it("clears a confirmed purchase only when the current cart still matches", async () => {
    const { cart } = await loadStore();
    cart.add(item, 2);
    cart.clearIfMatches([{ productId: item.productId, grind: item.grind, quantity: 1 }]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)[0].quantity).toBe(2);
    cart.clearIfMatches([{ productId: item.productId, grind: item.grind, quantity: 2 }]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it("ignores corrupted storage instead of crashing", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const { useCartCount } = await loadStore();
    function Count() {
      return <span>{useCartCount()}</span>;
    }
    render(<Count />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("updates subscribed components when the cart changes", async () => {
    const { cart, useCartCount } = await loadStore();
    function Count() {
      return <span data-testid="count">{useCartCount()}</span>;
    }
    render(<Count />);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    act(() => cart.add(item, 2));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });
});
