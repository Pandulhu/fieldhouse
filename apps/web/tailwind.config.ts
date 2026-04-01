import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A5F",
        accent: "#2E75B6",
        light: "#D6E4F0",
        surface: "#FFFFFF",
        muted: "#888888",
        success: "#2E7D32",
        danger: "#C62828",
        warning: "#F57C00",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
