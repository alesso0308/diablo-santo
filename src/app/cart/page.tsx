"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Product } from "@/lib/products";
import { formatPrice, getProductBySlug } from "@/lib/products";
import { useCart } from "@/providers/cart-context";
import { WhatsAppCheckout } from "@/components/cart/WhatsAppCheckout";
import { Reveal } from "@/components/motion/Reveal";

export default function CartPage() {
  const { lines, setQuantity, removeItem, clear } = useCart();

  const resolved = useMemo(() => {
    return lines
      .map((line) => {
        const product = getProductBySlug(line.slug);
        if (!product) return null;
        return { product, quantity: line.quantity };
      })
      .filter(Boolean) as { product: Product; quantity: number }[];
  }, [lines]);

  const subtotal = resolved.reduce(
    (n, i) => n + i.product.price * i.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto max-w-[960px] px-6 py-16 md:px-10 md:py-24">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
            Cart
          </p>
          <h1 className="mt-4 font-display text-4xl text-bone">Your selection</h1>
        </Reveal>

        {resolved.length === 0 ? (
          <Reveal delay={0.1} className="mt-16 text-bone-muted">
            <p className="max-w-md text-sm leading-relaxed">
              The cart waits in silence. When you find a piece that hums against
              your skin, place it here.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block border border-bone/30 px-8 py-3 text-[10px] uppercase tracking-editorial text-bone transition hover:border-bone"
            >
              Browse collection
            </Link>
          </Reveal>
        ) : (
          <>
            <ul className="mt-14 divide-y divide-bone/10 border-y border-bone/10">
              {resolved.map(({ product, quantity }) => (
                <motion.li
                  layout
                  key={product.slug}
                  className="flex gap-6 py-8"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative h-28 w-20 shrink-0 overflow-hidden bg-ash md:h-36 md:w-28"
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-bone-dim">
                        {product.category}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-1 block font-display text-xl text-bone hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-2 text-sm text-bone-muted">
                        {formatPrice(product.price, product.currency)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="sr-only" htmlFor={`qty-${product.slug}`}>
                        Quantity for {product.name}
                      </label>
                      <input
                        id={`qty-${product.slug}`}
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            product.slug,
                            Number.parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-16 border border-bone/20 bg-void px-2 py-2 text-center text-sm text-bone"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(product.slug)}
                        className="text-[10px] uppercase tracking-wide text-bone-dim underline-offset-4 hover:text-bone hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-editorial text-bone-dim">
                  Subtotal
                </p>
                <p className="mt-2 font-display text-3xl text-bone">
                  {formatPrice(subtotal, "USD")}
                </p>
                <p className="mt-4 max-w-xs text-xs text-bone-muted">
                  Shipping and duties calculated after we confirm your inquiry.
                  Whisper your city on WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => clear()}
                  className="mt-6 text-[10px] uppercase tracking-wide text-bone-dim hover:text-bone"
                >
                  Clear cart
                </button>
              </div>
              <div className="w-full max-w-sm space-y-4">
                <WhatsAppCheckout items={resolved} />
                <p className="text-center text-[10px] text-bone-dim">
                  Opens WhatsApp with your cart summary. Replace the default line
                  in{" "}
                  <code className="text-bone-muted">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
                  with your business number (digits only, country code included).
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
