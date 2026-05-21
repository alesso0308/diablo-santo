import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "House",
  description: "The story and philosophy behind Diablo Santo.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ink">
      <section className="relative min-h-[70svh] overflow-hidden bg-void">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64774bd600d8?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          className="object-cover opacity-25 grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-transparent" />
        <div className="relative mx-auto flex min-h-[70svh] max-w-[1600px] flex-col justify-end px-6 pb-20 pt-28 md:px-10 md:pb-28">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
              House
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] text-bone">
              Devils are detail. Saints are restraint.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <p className="text-sm leading-[1.85] text-bone-muted md:text-base">
            Diablo Santo was born from the tension between reverence and
            rebellion — the kind you feel in a cathedral at midnight, or on an
            empty avenue when the city forgets to breathe. We do not chase
            trends. We build garments as emotional architecture: weight, drape,
            silence.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-10">
          <p className="text-sm leading-[1.85] text-bone-muted md:text-base">
            Our palette is narrow on purpose. Black is not absence; it is depth.
            Bone is not nostalgia; it is light held carefully. Each release is a
            small ceremony — numbered in intent, whispered rather than shouted.
          </p>
        </Reveal>
        <Reveal delay={0.16} className="mt-10">
          <p className="font-display text-2xl text-bone md:text-3xl">
            “Fashion should haunt you politely.”
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-editorial text-bone-dim">
            — founding note, uncredited
          </p>
        </Reveal>
      </section>

      <section className="border-y border-bone/10 bg-smoke px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-14 md:grid-cols-2 md:gap-20">
          <Reveal>
            <h2 className="font-display text-3xl text-bone md:text-4xl">
              Atelier ethos
            </h2>
            <ul className="mt-8 space-y-4 text-sm text-bone-muted">
              <li className="border-l border-bone/20 pl-6">
                Small-batch dyeing for chromatic honesty in black tones.
              </li>
              <li className="border-l border-bone/20 pl-6">
                Hand-finished hardware and taped seams where stress lives.
              </li>
              <li className="border-l border-bone/20 pl-6">
                Editorial casting — every campaign is treated as cinema.
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden bg-ash">
              <Image
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80"
                alt="Atelier mood"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 40vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
        <Reveal className="text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
            Inquiry
          </p>
          <p className="mx-auto mt-6 max-w-lg text-sm text-bone-muted">
            We welcome private fittings and distant orders alike. Speak through
            WhatsApp — we reply with calm precision.
          </p>
          <Link
            href="/products"
            className="mt-10 inline-flex border border-bone/30 px-10 py-4 text-[10px] uppercase tracking-editorial text-bone transition hover:border-bone"
          >
            View collection
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
