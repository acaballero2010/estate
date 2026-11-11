import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Instrument Serif",
          "Source Serif 4",
          "Georgia",
          "Cambria",
          "serif",
        ],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Real Estate Pipeline & Financial Semantic Tokens
        pipeline: {
          new: "hsl(var(--pipeline-new))",
          contacted: "hsl(var(--pipeline-contacted))",
          tripping: "hsl(var(--pipeline-tripping))",
          proposal: "hsl(var(--pipeline-proposal))",
          reservation: "hsl(var(--pipeline-reservation))",
          won: "hsl(var(--pipeline-won))",
          lost: "hsl(var(--pipeline-lost))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        "ease-out-decel": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "350": "350ms",
        "470": "470ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        "draw-circle": {
          "0%": { strokeDashoffset: "150" },
          "100%": { strokeDashoffset: "0" },
        },
        "draw-tick": {
          "0%": { strokeDashoffset: "40" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "draw-circle": "draw-circle 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "draw-tick": "draw-tick 270ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

