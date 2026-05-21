import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Collection",
  description: "Diablo Santo — full collection of luxury streetwear silhouettes.",
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-bone/10 bg-void">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
              Collection
            </p>
            <h1 className="mt-4 font-display text-4xl text-bone md:text-5xl">
              The Maquette
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-bone-muted md:text-base">
              Each piece is numbered in spirit, not in noise. Select an object to
              study its construction and intent.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 md:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.slug} product={p} revealDelay={0.04 * i} />
          ))}
        </div>
      </div>
    </div>
  );
}
