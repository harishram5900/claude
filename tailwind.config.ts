import type { Config } from "tailwindcss";

/**
 * Brand design tokens — mirrored from the pitch deck so the deck, resume
 * and this site read as one identity. Colors resolve to the RGB-channel CSS
 * variables in app/globals.css so opacity modifiers (bg-black/60) work.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "cream": "rgb(var(--cream-rgb) / <alpha-value>)",
        "cream-2": "rgb(var(--cream-2-rgb) / <alpha-value>)",
        "black": "rgb(var(--black-rgb) / <alpha-value>)",
        "charcoal": "rgb(var(--charcoal-rgb) / <alpha-value>)",
        "gold": "rgb(var(--gold-rgb) / <alpha-value>)",
        "gold-light": "rgb(var(--gold-light-rgb) / <alpha-value>)",
        "gray": "rgb(var(--gray-rgb) / <alpha-value>)",
        "gray-light": "rgb(var(--gray-light-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid display sizes: phone → 4K
        "display-xl": ["clamp(3rem, 9vw, 8.75rem)", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(2.5rem, 6.5vw, 6rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2rem, 4.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      maxWidth: {
        page: "88rem",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(6%, -4%) scale(1.08)" },
          "66%": { transform: "translate(-5%, 5%) scale(0.95)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        drift: "drift 22s ease-in-out infinite",
        "drift-slow": "drift 34s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};

export default config;
