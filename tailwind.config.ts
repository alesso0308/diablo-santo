import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: {
          DEFAULT: "#e8e4dc",
          muted: "#c9c3b8",
          dim: "#9a948a",
        },
        void: "#050505",
        ink: "#0a0a0a",
        smoke: "#141414",
        ash: "#1c1c1c",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.35em",
        wide: "0.2em",
      },
      transitionDuration: {
        luxe: "800ms",
      },
      animation: {
        "grain": "grain 8s steps(10) infinite",
        "fade-up": "fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "30%": { transform: "translate(3%, -15%)" },
          "50%": { transform: "translate(12%, 9%)" },
          "70%": { transform: "translate(9%, 4%)" },
          "90%": { transform: "translate(-1%, 7%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
