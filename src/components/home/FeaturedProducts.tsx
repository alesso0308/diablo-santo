import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

export function FeaturedProducts() {
  const featured = PRODUCTS.slice(0, 3);

  return (
    <section className="bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
              Featured
            </p>
            <h2 className="mt-4 font-display text-3xl text-bone md:text-4xl">
              Objects in shadow.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/products"
              className="text-[10px] uppercase tracking-editorial text-bone-muted transition hover:text-bone"
            >
              View all →
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {featured.map((p, i) => (
            <ProductCard key={p.slug} product={p} revealDelay={0.06 * i} />
          ))}
        </div>
      </div>
    </section>
  );
}
