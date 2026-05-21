import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.45em] text-bone-dim">
        404
      </p>
      <h1 className="mt-6 font-display text-4xl text-bone">Lost in the void</h1>
      <p className="mt-4 max-w-sm text-sm text-bone-muted">
        This path does not exist in our house. Return to the collection.
      </p>
      <Link
        href="/"
        className="mt-10 border border-bone/30 px-8 py-3 text-[10px] uppercase tracking-editorial text-bone transition hover:border-bone"
      >
        Home
      </Link>
    </div>
  );
}
