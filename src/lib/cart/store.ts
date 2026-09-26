"use client";

import { useSyncExternalStore } from "react";
import {
  lineKey,
  MAX_CART_LINES,
  MAX_QUANTITY_PER_LINE,
  storedCartSchema,
  type StoredCartItem,
} from "@/lib/cart/schema";

/**
 * A tiny cart store persisted in localStorage.
 *
 * Why not React context or a state library? The cart must survive reloads
 * and stay in sync across tabs; `useSyncExternalStore` gives us both with no
 * dependency and no hydration mismatch (the server always renders an empty
 * cart, and the client swaps in the saved one right after hydration).
 */

const STORAGE_KEY = "ember-oak-cart-v1";
const EMPTY: StoredCartItem[] = [];

let items: StoredCartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): StoredCartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    // Never trust storage blindly: it may be stale, from an old version, or edited by hand.
    const parsed = storedCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  items = readStorage();
}

function commit(next: StoredCartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    items = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return items;
}

export const cart = {
  add(item: Omit<StoredCartItem, "quantity">, quantity = 1) {
    ensureLoaded();
    const key = lineKey(item);
    const existing = items.find((line) => lineKey(line) === key);
    if (existing) {
      const nextQuantity = Math.min(existing.quantity + quantity, MAX_QUANTITY_PER_LINE);
      commit(items.map((line) => (lineKey(line) === key ? { ...line, quantity: nextQuantity } : line)));
    } else if (items.length < MAX_CART_LINES) {
      commit([...items, { ...item, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }]);
    }
  },
  setQuantity(key: string, quantity: number) {
    ensureLoaded();
    if (quantity <= 0) return cart.remove(key);
    const clamped = Math.min(quantity, MAX_QUANTITY_PER_LINE);
    commit(items.map((line) => (lineKey(line) === key ? { ...line, quantity: clamped } : line)));
  },
  remove(key: string) {
    ensureLoaded();
    commit(items.filter((line) => lineKey(line) !== key));
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCartItems(): StoredCartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useCartCount(): number {
  return useCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

/** False during server render and hydration; true once the saved cart is available. */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
