// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        bg:      "rgb(248 250 252)",        // page
        surface: "rgb(255 255 255)",        // cards
        border:  "rgb(230 235 242)",
        text:    "rgb(18 24 38)",           // primary
        muted:   "rgb(99 110 131)",
        indigo:  { 500: "#635BFF" },        // brand accent
        accent:  "rgb(126 92 255)",         // gradient edge
        info:    "rgb(65 150 255)",
        success: "rgb(16 185 129)",
        warn:    "rgb(245 158 11)",
        danger:  "rgb(239 68 68)",
      },
      borderRadius: {
        lg: "14px",
        xl: "16px",
        '2xl': "20px", // use this for cards/buttons
      },
      boxShadow: {
        card: "0 1px 0 rgba(16, 24, 40, 0.04), 0 12px 24px -8px rgba(16,24,40,.08)",
        focus: "0 0 0 6px rgba(99,102,241,.14)", // indigo focus ring
        pop: "0 20px 48px -16px rgba(16,24,40,.18)",
      },
    },
  },
  plugins: [],
};
