import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-void">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-16 md:grid-cols-2 md:px-10 md:py-20">
        <div>
          <p className="font-display text-2xl tracking-wide text-bone md:text-3xl">
            Diablo Santo
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-dim">
            A house of shadows and structure. Objects for those who move in
            silence and leave a trace.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-6 text-[11px] uppercase tracking-editorial text-bone-muted">
          <div className="flex flex-col gap-3">
            <span className="text-bone-dim">Navigate</span>
            <Link href="/products" className="hover:text-bone">
              Collection
            </Link>
            <Link href="/about" className="hover:text-bone">
              House
            </Link>
            <Link href="/cart" className="hover:text-bone">
              Cart
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-bone-dim">Connect</span>
            <a href="#" className="hover:text-bone">
              Instagram
            </a>
            <a href="#" className="hover:text-bone">
              Editorial
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-bone/10 py-6 text-center text-[10px] uppercase tracking-[0.3em] text-bone-dim">
        © {new Date().getFullYear()} Diablo Santo
      </div>
    </footer>
  );
}
