"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/providers/cart-context";

type Props = {
  slug: string;
};

export function AddToCartButton({ slug }: Props) {
  const { addItem } = useCart();
  const [flash, setFlash] = useState(false);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => {
          addItem(slug, 1);
          setFlash(true);
          window.setTimeout(() => setFlash(false), 1600);
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full border border-bone bg-bone/5 px-8 py-4 text-[11px] uppercase tracking-editorial text-bone transition hover:border-bone hover:bg-bone/10 md:w-auto"
      >
        Add to cart
      </motion.button>
      <AnimatePresence>
        {flash && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-8 left-0 text-[10px] uppercase tracking-wide text-bone-muted"
          >
            Placed with intent.
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
