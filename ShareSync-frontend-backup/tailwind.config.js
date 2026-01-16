/** @type {import('tailwindcss').Config} */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPENSHARE DESIGN SYSTEM v2.0 - "Quiet Confidence"
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PHILOSOPHY:
 * - ONE brand color (purple) - used sparingly, always meaningful
 * - Surface hierarchy creates depth without competing gradients
 * - Color is EARNED through interaction or status, not decorative
 * - Asana-level clarity with OpenShare personality
 * 
 * RULES:
 * 1. Never use more than ONE accent color per component
 * 2. Glows are for hover/focus states ONLY, not resting state
 * 3. Text hierarchy: primary → secondary → tertiary (3 levels max)
 * 4. Surface hierarchy: base → raised → overlay (3 levels max)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      /**
       * ─────────────────────────────────────────────────────────────────────────
       * TYPOGRAPHY
       * ─────────────────────────────────────────────────────────────────────────
       * Inter for UI, JetBrains for code. Clean and professional.
       */
      fontFamily: {
        sans: ["Inter var", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Inter var", "Inter", "system-ui", "sans-serif"],
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * COLOR SYSTEM
       * ─────────────────────────────────────────────────────────────────────────
       * 
       * SURFACE HIERARCHY (dark theme done right):
       *   surface-0: Page background (deepest)
       *   surface-1: Cards, panels
       *   surface-2: Elevated elements, hovers
       *   surface-3: Interactive elements, borders
       * 
       * BRAND: Purple is sacred. Use it to mean "important" or "interactive"
       * 
       * SEMANTIC: Only for actual status (success/warning/danger)
       */
      colors: {
        /* ══════════════════════════════════════════════════════════════════════
         * SURFACE HIERARCHY - The foundation of our dark theme
         * ══════════════════════════════════════════════════════════════════════ */
        surface: {
          0: "#09090B",    /* Page background - deepest black */
          1: "#18181B",    /* Cards, sidebars - zinc-900 */
          2: "#27272A",    /* Elevated cards, hover states - zinc-800 */
          3: "#3F3F46",    /* Interactive elements, borders - zinc-700 */
        },

        /* ══════════════════════════════════════════════════════════════════════
         * BRAND - ONE color, used meaningfully
         * ══════════════════════════════════════════════════════════════════════ */
        brand: {
          DEFAULT: "#8B5CF6",  /* Primary brand - violet-500 */
          50:  "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#8B5CF6",      /* ← THE brand color */
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },

        /* ══════════════════════════════════════════════════════════════════════
         * SEMANTIC - Only for actual status, never decorative
         * ══════════════════════════════════════════════════════════════════════ */
        success: {
          DEFAULT: "#10B981",  /* emerald-500 */
          light: "#34D399",    /* For text on dark backgrounds */
          dark: "#064E3B",     /* For backgrounds */
        },
        warning: {
          DEFAULT: "#F59E0B",  /* amber-500 */
          light: "#FBBF24",
          dark: "#78350F",
        },
        danger: {
          DEFAULT: "#EF4444",  /* red-500 */
          light: "#F87171",
          dark: "#7F1D1D",
        },

        /* ══════════════════════════════════════════════════════════════════════
         * TEXT HIERARCHY - 3 levels only
         * ══════════════════════════════════════════════════════════════════════ */
        text: {
          primary: "#FAFAFA",    /* zinc-50 - headings, important text */
          secondary: "#A1A1AA",  /* zinc-400 - body text, descriptions */
          tertiary: "#71717A",   /* zinc-500 - hints, timestamps, meta */
          inverse: "#09090B",    /* For light backgrounds */
        },

        /* ══════════════════════════════════════════════════════════════════════
         * BORDER - Subtle, never harsh
         * ══════════════════════════════════════════════════════════════════════ */
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",  /* Subtle dividers */
          strong: "rgba(255, 255, 255, 0.12)",   /* More visible borders */
          brand: "rgba(139, 92, 246, 0.5)",      /* Brand-colored borders */
        },

        /* ══════════════════════════════════════════════════════════════════════
         * LEGACY SUPPORT - Keeping slate for existing components
         * TODO: Gradually migrate to surface-* system
         * ══════════════════════════════════════════════════════════════════════ */
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * TYPOGRAPHY SCALE
       * ─────────────────────────────────────────────────────────────────────────
       * Tight letter-spacing on larger sizes for that premium feel.
       */
      fontSize: {
        'xs':   ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sm':   ['14px', { lineHeight: '20px', letterSpacing: '0em' }],
        'base': ['15px', { lineHeight: '24px', letterSpacing: '0em' }],
        'lg':   ['17px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        'xl':   ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl':  ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        '3xl':  ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '4xl':  ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        '5xl':  ['48px', { lineHeight: '1',    letterSpacing: '-0.03em' }],
        '6xl':  ['60px', { lineHeight: '1',    letterSpacing: '-0.03em' }],
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * SPACING & RADIUS
       * ─────────────────────────────────────────────────────────────────────────
       */
      borderRadius: {
        'sm':  '6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * SHADOWS & GLOWS
       * ─────────────────────────────────────────────────────────────────────────
       * RULE: Glows are for INTERACTION states only, never resting.
       */
      boxShadow: {
        /* Elevation shadows (for light themes or overlays) */
        'sm':   '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md':   '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg':   '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl':   '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        
        /* Card shadow for dark theme */
        'card': '0 1px 0 rgba(0, 0, 0, 0.2), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
        
        /* Focus ring */
        'focus': '0 0 0 3px rgba(139, 92, 246, 0.25)',
        
        /* Glows - USE SPARINGLY, only on hover/focus */
        'glow-brand':   '0 0 20px rgba(139, 92, 246, 0.25)',
        'glow-success': '0 0 16px rgba(16, 185, 129, 0.25)',
        'glow-warning': '0 0 16px rgba(245, 158, 11, 0.25)',
        'glow-danger':  '0 0 16px rgba(239, 68, 68, 0.25)',
        
        /* Inner glow for selected states */
        'inner-brand': 'inset 0 0 0 1px rgba(139, 92, 246, 0.5)',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * ANIMATIONS
       * ─────────────────────────────────────────────────────────────────────────
       */
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'fade-up':     'fadeUp 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * TRANSITIONS
       * ─────────────────────────────────────────────────────────────────────────
       */
      transitionDuration: {
        '0':   '0ms',
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};
