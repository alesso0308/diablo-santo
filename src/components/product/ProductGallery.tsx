"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const [idx, setIdx] = useState(0);
  const current = images[idx] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-ash">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current}
              alt={`${name} — view ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-20 w-16 overflow-hidden border transition md:h-24 md:w-20 ${
                i === idx
                  ? "border-bone"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
