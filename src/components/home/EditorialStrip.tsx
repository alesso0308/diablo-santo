"use client";

import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";

const frames = [
  {
    src: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=900&q=80",
    alt: "Editorial frame one",
  },
  {
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
    alt: "Editorial frame two",
  },
  {
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    alt: "Editorial frame three",
  },
];

export function EditorialStrip() {
  return (
    <section className="border-y border-bone/10 bg-smoke py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
            Editorial
          </p>
          <h2 className="mt-4 font-display text-3xl text-bone md:text-4xl">
            Stillness, sharpened.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:gap-6">
          {frames.map((f, i) => (
            <Reveal key={f.src} delay={0.08 * i} className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={f.src}
                alt={f.alt}
                fill
                className="object-cover transition duration-luxe hover:scale-[1.03]"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
