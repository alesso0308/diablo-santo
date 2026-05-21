"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/products";

const STORAGE_KEY = "diablo-santo-cart";

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (slug: string, quantity?: number) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLine =>
        typeof x === "object" &&
        x !== null &&
        "slug" in x &&
        "quantity" in x &&
        typeof (x as CartLine).slug === "string" &&
        typeof (x as CartLine).quantity === "number"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(loadFromStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const addItem = useCallback((slug: string, quantity = 1) => {
    setLines((prev) => {
      const next = [...prev];
      const i = next.findIndex((l) => l.slug === slug);
      const q = Math.max(1, quantity);
      if (i >= 0) next[i] = { slug, quantity: next[i].quantity + q };
      else next.push({ slug, quantity: q });
      return next;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.slug !== slug);
      return prev.map((l) =>
        l.slug === slug ? { ...l, quantity } : l
      );
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((n, l) => n + l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      addItem,
      removeItem,
      setQuantity,
      clear,
      itemCount,
    }),
    [lines, addItem, removeItem, setQuantity, clear, itemCount]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function buildWhatsAppUrl(
  phoneDigits: string,
  items: { product: Product; quantity: number }[]
): string {
  const lines = items.map((i) => {
    const each = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: i.product.currency,
      minimumFractionDigits: 0,
    }).format(i.product.price);
    return `• ${i.product.name} × ${i.quantity} — ${each}`;
  });
  const body = encodeURIComponent(
    ["Diablo Santo — order inquiry", "", ...lines, "", "Ship to:"].join("\n")
  );
  const num = phoneDigits.replace(/\D/g, "");
  return `https://wa.me/${num}?text=${body}`;
}
