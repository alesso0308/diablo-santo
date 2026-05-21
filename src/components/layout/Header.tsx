"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-context";

const links = [
  { href: "/products", label: "Collection" },
  { href: "/about", label: "House" },
  { href: "/cart", label: "Cart" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const reduce = useReducedMotion();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[40] border-b border-bone/10 bg-ink/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6 md:h-16 md:px-10">
          <Link
            href="/"
            className="font-display text-xl tracking-[0.12em] text-bone md:text-2xl"
          >
            Diablo Santo
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-[11px] uppercase tracking-editorial transition-colors hover:text-bone",
                  pathname === l.href ? "text-bone" : "text-bone-dim"
                )}
              >
                {l.label}
                {l.href === "/cart" && itemCount > 0 && (
                  <span className="ml-2 text-bone-muted">({itemCount})</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <Link
              href="/cart"
              className="text-[10px] uppercase tracking-wide text-bone-dim"
            >
              Cart{itemCount > 0 ? ` · ${itemCount}` : ""}
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-bone/20 text-bone"
              onClick={() => setOpen((o) => !o)}
            >
              <motion.span
                className="block h-px w-4 bg-current"
                animate={
                  reduce
                    ? {}
                    : open
                      ? { rotate: 45, y: 3 }
                      : { rotate: 0, y: 0 }
                }
              />
              <motion.span
                className="block h-px w-4 bg-current"
                animate={
                  reduce
                    ? {}
                    : open
                      ? { rotate: -45, y: -3 }
                      : { rotate: 0, y: 0 }
                }
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[35] bg-void md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <nav className="flex flex-col gap-8 px-8 pt-28">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="font-display text-3xl text-bone"
              >
                Home
              </Link>
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl text-bone-muted"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
