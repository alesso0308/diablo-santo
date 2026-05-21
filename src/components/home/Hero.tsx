"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-void">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          priority
          className="object-cover object-[center_20%] opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-ink/80 to-ink" />
        <div className="vignette-radial absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-6 pb-20 pt-32 md:flex-row md:items-end md:justify-between md:px-10 md:pb-28">
        <div className="max-w-xl">
          <motion.p
            className="mb-6 text-[10px] uppercase tracking-[0.45em] text-bone-muted"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Season IV — Maquette
          </motion.p>
          <motion.h1
            className="font-display text-[clamp(2.75rem,8vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-bone text-balance"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            Dress like a ceremony.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-sm leading-relaxed text-bone-dim md:text-base"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            Architecture for the body. Limited silhouettes in bone, ink, and
            obsidian — made to be felt before they are seen.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap gap-4"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/products"
              className="inline-flex border border-bone/40 bg-bone/5 px-8 py-3 text-[10px] uppercase tracking-editorial text-bone backdrop-blur-sm transition hover:border-bone hover:bg-bone/10"
            >
              Enter collection
            </Link>
            <Link
              href="/about"
              className="inline-flex px-4 py-3 text-[10px] uppercase tracking-editorial text-bone-muted transition hover:text-bone"
            >
              The house →
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 hidden md:mt-0 md:block md:self-end"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.2 }}
        >
          <p className="max-w-[12rem] text-right text-[10px] uppercase leading-loose tracking-[0.35em] text-bone-dim">
            Noir tailoring · Sculptural outerwear · Objects of devotion
          </p>
        </motion.div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        {!reduce && (
          <motion.div
            className="h-12 w-px bg-gradient-to-b from-transparent via-bone/40 to-transparent"
            animate={{ scaleY: [0.6, 1, 0.6] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    </section>
  );
}
