import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#0E2419",
          900: "#122B20",
          800: "#1B4332",
          700: "#245C42",
          600: "#2D6A4F",
          500: "#3D8B66",
        },
        cream: {
          50: "#FBF8F3",
          100: "#F4EFE6",
          200: "#E7DCCB",
          300: "#D4C4AB",
        },
        gold: {
          300: "#F6D98A",
          400: "#E8B84A",
          500: "#C9962A",
          700: "#8A6A12",
        },
        ink: "#1C1915",
        muted: "#5E584F",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(27, 67, 50, 0.08)",
      },
      maxWidth: {
        page: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
