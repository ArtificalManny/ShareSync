/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Inter var", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // --- NEW SEMANTIC SYSTEM ---
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7', 
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        success: { DEFAULT: "rgb(16 185 129)", 500: "#10B981", 900: "#064E3B" },
        warning: { DEFAULT: "rgb(245 158 11)", 500: "#F59E0B", 900: "#78350F" },
        danger:  { DEFAULT: "rgb(239 68 68)", 500: "#EF4444", 900: "#7F1D1D" },
        info:    { DEFAULT: "rgb(65 150 255)", 500: "#3B82F6", 900: "#1E3A8A" },

        // --- PRESERVED EXISTING PALETTE ---
        bg:      "rgb(248 250 252)",
        surface: "rgb(255 255 255)",
        border:  "rgb(230 235 242)",
        text:    "rgb(18 24 38)",
        muted:   "rgb(99 110 131)",
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
          500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        indigo:  { 500: "#635BFF" },
        accent:  "rgb(126 92 255)",
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
          500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '0em' }],
        'base': ['15px', { lineHeight: '24px', letterSpacing: '0em' }],
        'lg': ['17px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        '5xl': ['48px', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 0 rgba(16, 24, 40, 0.04), 0 12px 24px -8px rgba(16,24,40,.08)',
        'focus': '0 0 0 4px rgba(99,102,241,.12)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow-brand': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
    },
  },
  plugins: [],
};
