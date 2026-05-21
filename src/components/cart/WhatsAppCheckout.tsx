"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { buildWhatsAppUrl } from "@/providers/cart-context";
import type { Product } from "@/lib/products";

type Props = {
  items: { product: Product; quantity: number }[];
};

const DEFAULT_PHONE = "15551234567";

export function WhatsAppCheckout({ items }: Props) {
  const href = useMemo(() => {
    const phone =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
      DEFAULT_PHONE;
    return buildWhatsAppUrl(phone, items);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group inline-flex w-full items-center justify-center gap-3 border border-bone/35 bg-bone/[0.04] px-8 py-4 text-[11px] uppercase tracking-editorial text-bone transition hover:border-bone hover:bg-bone/[0.08]"
    >
      <span
        className="h-2 w-2 rounded-full bg-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.35)]"
        aria-hidden
      />
      Complete on WhatsApp
    </motion.a>
  );
}
