/** @type {import('tailwindcss').Config} */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARESYNC DESIGN SYSTEM v3.0 - Phase 7: Visual Cohesion
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PHILOSOPHY:
 * - Purple is IDENTITY (brand, primary actions, progress)
 * - Teal is SUCCESS (completions, achievements, shipped)
 * - Amber is ATTENTION (warnings, deadlines, needs action)
 * - Red is ERROR ONLY (failures, destructive actions)
 * 
 * RULES:
 * 1. Progress bars use PURPLE, not red/green
 * 2. Glows are for hover/focus states ONLY
 * 3. Surface hierarchy: 0 → 1 → 2 → 3 (4 levels max)
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
       */
      fontFamily: {
        sans: ["Inter var", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Inter var", "Inter", "system-ui", "sans-serif"],
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * COLOR SYSTEM - References CSS Variables from design-tokens.css
       * ─────────────────────────────────────────────────────────────────────────
       */
      colors: {
        /* Surface Hierarchy */
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },

        /* Brand (Purple) */
        brand: {
          DEFAULT: "var(--brand-500)",
          50:  "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
          950: "var(--brand-950)",
        },

        /* Accent (Fuchsia - for gradients) */
        accent: {
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
        },

        /* Success (Teal) - NOT green */
        success: {
          DEFAULT: "var(--success-500)",
          50:  "var(--success-50)",
          100: "var(--success-100)",
          200: "var(--success-200)",
          300: "var(--success-300)",
          400: "var(--success-400)",
          500: "var(--success-500)",
          600: "var(--success-600)",
          700: "var(--success-700)",
          800: "var(--success-800)",
          900: "var(--success-900)",
          light: "var(--success-400)",
          dark: "var(--success-900)",
        },

        /* Warning (Amber) */
        warning: {
          DEFAULT: "var(--warning-500)",
          50:  "var(--warning-50)",
          100: "var(--warning-100)",
          200: "var(--warning-200)",
          300: "var(--warning-300)",
          400: "var(--warning-400)",
          500: "var(--warning-500)",
          600: "var(--warning-600)",
          700: "var(--warning-700)",
          800: "var(--warning-800)",
          900: "var(--warning-900)",
          light: "var(--warning-400)",
          dark: "var(--warning-900)",
        },

        /* Error (Red) - ONLY for actual errors */
        error: {
          DEFAULT: "var(--error-500)",
          50:  "var(--error-50)",
          100: "var(--error-100)",
          200: "var(--error-200)",
          300: "var(--error-300)",
          400: "var(--error-400)",
          500: "var(--error-500)",
          600: "var(--error-600)",
          700: "var(--error-700)",
          800: "var(--error-800)",
          900: "var(--error-900)",
          light: "var(--error-400)",
          dark: "var(--error-900)",
        },
        
        /* Danger alias (for existing components) */
        danger: {
          DEFAULT: "var(--error-500)",
          light: "var(--error-400)",
          dark: "var(--error-900)",
        },

        /* Info (Blue) */
        info: {
          DEFAULT: "var(--info-500)",
          50:  "var(--info-50)",
          100: "var(--info-100)",
          200: "var(--info-200)",
          300: "var(--info-300)",
          400: "var(--info-400)",
          500: "var(--info-500)",
          600: "var(--info-600)",
          700: "var(--info-700)",
          800: "var(--info-800)",
          900: "var(--info-900)",
        },

        /* Progress (Purple-based) */
        progress: {
          track: "var(--progress-track)",
          fill: "var(--progress-fill)",
          low: "var(--progress-fill-low)",
          mid: "var(--progress-fill-mid)",
          high: "var(--progress-fill-high)",
          complete: "var(--progress-fill-complete)",
        },

        /* Text Hierarchy */
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },

        /* Border */
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          brand: "var(--border-brand)",
          focus: "var(--border-focus)",
        },

        /* Legacy slate (for existing components - gradually migrate away) */
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
       * BORDER RADIUS
       * ─────────────────────────────────────────────────────────────────────────
       */
      borderRadius: {
        'sm':  'var(--radius-sm)',
        'md':  'var(--radius-md)',
        'lg':  'var(--radius-lg)',
        'xl':  'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': '24px',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * SHADOWS & GLOWS
       * ─────────────────────────────────────────────────────────────────────────
       */
      boxShadow: {
        'sm':   'var(--shadow-sm)',
        'md':   'var(--shadow-md)',
        'lg':   'var(--shadow-lg)',
        'xl':   'var(--shadow-xl)',
        'card': 'var(--shadow-card)',
        'focus': 'var(--ring-focus)',
        
        /* Glows - USE ONLY ON HOVER/FOCUS */
        'glow-brand':   'var(--glow-brand)',
        'glow-success': 'var(--glow-success)',
        'glow-warning': 'var(--glow-warning)',
        'glow-error':   'var(--glow-error)',
        'glow-danger':  'var(--glow-error)',
        
        'inner-brand': 'inset 0 0 0 1px var(--border-brand)',
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
        'progress':    'progressPulse 2s ease-in-out infinite',
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
        progressPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.85' },
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
