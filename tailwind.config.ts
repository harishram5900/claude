import type { Config } from "tailwindcss";

/** Semantic color tokens → CSS variables in app/globals.css (themeable). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        fg: token("fg"),
        muted: token("muted"),
        accent: token("accent"),
        "accent-2": token("accent-2"),
        "on-accent": token("on-accent"),
        line: token("line"),
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 6vw, 6.25rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(2rem, 4.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      maxWidth: { page: "84rem" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(5%, -4%) scale(1.08)" },
        },
        blink: { "0%, 49%": { opacity: "1" }, "50%, 100%": { opacity: "0" } },
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        drift: "drift 20s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        "spin-slow": "spin 18s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
