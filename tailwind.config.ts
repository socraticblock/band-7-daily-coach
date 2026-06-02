import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, professional palette — no playful tones
        ink: {
          DEFAULT: "#1A1F2E",
          muted: "#4A5266",
          subtle: "#8A8F9C",
        },
        paper: {
          DEFAULT: "#FAFAF7",
          warm: "#F4F1EA",
          card: "#FFFFFF",
        },
        line: {
          DEFAULT: "#E5E5E0",
          strong: "#C9C9C2",
        },
        accent: {
          DEFAULT: "#0F766E", // deep teal
          hover: "#0D5F58",
          soft: "#E6F1EF",
        },
        success: "#3A7D5C",
        warn: "#A66A1F",
        error: "#9B2C2C",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        // Restraint: readable, not loud
        "display": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        "title": ["1.75rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "subtitle": ["1.25rem", { lineHeight: "1.4", fontWeight: "500" }],
        "body": ["1rem", { lineHeight: "1.65" }],
        "small": ["0.875rem", { lineHeight: "1.5" }],
        "tiny": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      maxWidth: {
        "reading": "38rem",
        "page": "64rem",
      },
      borderRadius: {
        "sm": "4px",
        "DEFAULT": "6px",
        "lg": "10px",
      },
    },
  },
  plugins: [],
};

export default config;
