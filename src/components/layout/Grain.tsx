"use client";

import { motion, useReducedMotion } from "framer-motion";

export function Grain() {
  const reduce = useReducedMotion();
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25] opacity-[0.045] mix-blend-overlay"
      aria-hidden
    >
      {!reduce ? (
        <motion.div
          className="absolute inset-[-200%] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] bg-repeat"
          animate={{
            x: [0, -40, 20, -10, 0],
            y: [0, 30, -20, 10, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ) : (
        <div className="h-full w-full bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
      )}
    </div>
  );
}
