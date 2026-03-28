import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Noto Serif JP", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "noto-sans-jp": ["Noto Sans JP", "sans-serif"],
      },
      colors: {
        // CSS var tokens — keep existing Shadowing UI working
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        surface: "var(--surface)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "app-bg": "var(--bg)",
        "app-border": "var(--border)",
        "app-success": "var(--success)",
        "app-error": "var(--error)",
      },
    },
  },
  plugins: [],
};

export default config;
