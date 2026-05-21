import { Hero } from "@/components/home/Hero";
import { EditorialStrip } from "@/components/home/EditorialStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Reveal } from "@/components/motion/Reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <section className="bg-void px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal>
            <p className="font-display text-2xl leading-snug text-bone md:text-3xl text-balance">
              We trade in contradiction — devotional craft, disobedient
              silhouette.
            </p>
            <p className="mt-8 text-[10px] uppercase tracking-[0.4em] text-bone-dim">
              Milano · digitally atelier-crafted
            </p>
          </Reveal>
        </div>
      </section>
      <EditorialStrip />
    </>
  );
}
