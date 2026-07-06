import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A1A3F",
          900: "#0F2247",
          800: "#122A54",
          700: "#1A3568",
          600: "#22417B",
          500: "#2B4F94",
        },
        gold: {
          900: "#8B6508",
          800: "#B8860B",
          700: "#C99A18",
          600: "#D4AF37",
          500: "#E1BE4A",
          400: "#EDCD65",
          300: "#F5D67E",
          200: "#F9E4A6",
        },
        ink: {
          100: "#FFFFFF",
          200: "#E7ECF7",
          300: "#C9D2E3",
          400: "#8B98B4",
          500: "#5A6684",
        },
        status: {
          ok: "#3FB77A",
          warn: "#E1BE4A",
          bad: "#E5484D",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #B8860B 0%, #D4AF37 45%, #F5D67E 100%)",
        "gold-gradient-soft":
          "linear-gradient(135deg, rgba(184,134,11,0.15) 0%, rgba(212,175,55,0.25) 50%, rgba(245,214,126,0.15) 100%)",
        "navy-panel":
          "linear-gradient(180deg, #122A54 0%, #0F2247 100%)",
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
        gold: "0 0 0 1px rgba(212,175,55,0.35), 0 10px 24px -12px rgba(212,175,55,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
