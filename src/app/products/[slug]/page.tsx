import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, formatPrice, getProductBySlug } from "@/lib/products";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductGallery } from "@/components/product/ProductGallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.category === product.category
  ).slice(0, 3);
  const relatedFallback =
    related.length > 0
      ? related
      : PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-10 md:py-14">
        <Link
          href="/products"
          className="text-[10px] uppercase tracking-editorial text-bone-dim transition hover:text-bone"
        >
          ← Collection
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bone-dim">
              {product.category}
            </p>
            <h1 className="mt-4 font-display text-4xl text-bone md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-bone-muted">{product.tagline}</p>
            <p className="mt-8 text-lg text-bone">
              {formatPrice(product.price, product.currency)}
            </p>

            <p className="mt-10 text-sm leading-relaxed text-bone-dim md:text-base">
              {product.longDescription}
            </p>

            <dl className="mt-10 space-y-4 border-y border-bone/10 py-8 text-[11px] uppercase tracking-wide text-bone-muted">
              <div className="flex justify-between gap-4">
                <dt>Detail</dt>
                <dd className="text-bone">{product.accent}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Availability</dt>
                <dd className="text-bone">By inquiry</dd>
              </div>
            </dl>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <AddToCartButton slug={product.slug} />
            </div>
          </div>
        </div>

        <section className="mt-24 border-t border-bone/10 pt-16">
          <h2 className="font-display text-2xl text-bone">In the same key</h2>
          <p className="mt-2 max-w-lg text-sm text-bone-muted">
            Pieces that share the same emotional temperature.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {relatedFallback.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-ash">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    className="object-cover transition duration-[1s] group-hover:scale-[1.03]"
                    sizes="33vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-display text-lg text-bone">
                    {p.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
