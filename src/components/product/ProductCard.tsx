"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { Reveal } from "@/components/motion/Reveal";

type Props = {
  product: Product;
  revealDelay?: number;
};

export function ProductCard({ product, revealDelay = 0 }: Props) {
  const reduce = useReducedMotion();
  const src = product.images[0];

  return (
    <Reveal delay={revealDelay}>
      <Link href={`/products/${product.slug}`} className="group block">
        <motion.div
          whileHover={
            reduce
              ? undefined
              : { y: -4, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
          }
          className="relative aspect-[4/5] overflow-hidden bg-ash"
        >
          <Image
            src={src}
            alt={product.name}
            fill
            className="object-cover transition duration-[1.1s] group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-70" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bone-muted">
              {product.category}
            </p>
            <p className="mt-1 font-display text-xl text-bone">{product.name}</p>
          </div>
        </motion.div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <p className="text-xs text-bone-dim">{product.tagline}</p>
          <p className="text-sm text-bone">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
