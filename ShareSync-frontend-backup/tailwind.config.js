/** @type {import('tailwindcss').Config} */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARESYNC DESIGN SYSTEM v4.2 - "The Gallery Walk" + Phase 1 Blueprint
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * UPDATED IN v4.2:
 * - Added light mode colors from palette.css
 * - Mapped CSS variables to Tailwind classes
 * - Preserved ALL existing momentum/gamification features
 * 
 * COLOR PHILOSOPHY:
 * • Deep Violet (#8B5CF6 → #7C3AED) = Brand, creativity, transformation
 * • Ocean Blue (#3B82F6) = Actions, Save buttons, toggles ON
 * • Aurora Teal (#2DD4BF) = Success, achievement, growth
 * • Soft Slate = Light mode neutral foundation
 * 
 * NO BACKEND CHANGES - Pure configuration
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
        display: ["Inter Tight", "Inter var", "Inter", "system-ui", "sans-serif"],
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * COLOR SYSTEM - Gallery Walk Palette
       * References CSS variables from palette.css
       * ─────────────────────────────────────────────────────────────────────────
       */
      colors: {
        /* ═══════════════════════════════════════════════════════════════════
           VIOLET - Primary Brand (Electric Violet)
           ═══════════════════════════════════════════════════════════════════ */
        violet: {
          50:  "var(--palette-violet-50, #F5F3FF)",
          100: "var(--palette-violet-100, #EDE9FE)",
          200: "var(--palette-violet-200, #DDD6FE)",
          300: "var(--palette-violet-300, #C4B5FD)",
          400: "var(--palette-violet-400, #A78BFA)",
          500: "var(--palette-violet-500, #8B5CF6)",
          600: "var(--palette-violet-600, #7C3AED)",
          700: "var(--palette-violet-700, #6D28D9)",
          800: "var(--palette-violet-800, #5B21B6)",
          900: "var(--palette-violet-900, #4C1D95)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           BLUE - Actions (Ocean Blue)
           ═══════════════════════════════════════════════════════════════════ */
        blue: {
          50:  "var(--palette-blue-50, #EFF6FF)",
          100: "var(--palette-blue-100, #DBEAFE)",
          200: "var(--palette-blue-200, #BFDBFE)",
          300: "var(--palette-blue-300, #93C5FD)",
          400: "var(--palette-blue-400, #60A5FA)",
          500: "var(--palette-blue-500, #3B82F6)",
          600: "var(--palette-blue-600, #2563EB)",
          700: "var(--palette-blue-700, #1D4ED8)",
          800: "var(--palette-blue-800, #1E40AF)",
          900: "var(--palette-blue-900, #1E3A8A)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           TEAL - Success (Aurora Teal)
           ═══════════════════════════════════════════════════════════════════ */
        teal: {
          50:  "var(--palette-teal-50, #F0FDFA)",
          100: "var(--palette-teal-100, #CCFBF1)",
          200: "var(--palette-teal-200, #99F6E4)",
          300: "var(--palette-teal-300, #5EEAD4)",
          400: "var(--palette-teal-400, #2DD4BF)",
          500: "var(--palette-teal-500, #14B8A6)",
          600: "var(--palette-teal-600, #0D9488)",
          700: "var(--palette-teal-700, #0F766E)",
          800: "var(--palette-teal-800, #115E59)",
          900: "var(--palette-teal-900, #134E4A)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           SLATE - Neutral Foundation (Soft Slate)
           ═══════════════════════════════════════════════════════════════════ */
        slate: {
          50:  "var(--palette-slate-50, #F8FAFC)",
          100: "var(--palette-slate-100, #F1F5F9)",
          200: "var(--palette-slate-200, #E2E8F0)",
          300: "var(--palette-slate-300, #CBD5E1)",
          400: "var(--palette-slate-400, #94A3B8)",
          500: "var(--palette-slate-500, #64748B)",
          600: "var(--palette-slate-600, #475569)",
          700: "var(--palette-slate-700, #334155)",
          800: "var(--palette-slate-800, #1E293B)",
          900: "var(--palette-slate-900, #0F172A)",
          950: "var(--palette-slate-950, #0B0F19)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           EMERALD - Alternate Success
           ═══════════════════════════════════════════════════════════════════ */
        emerald: {
          50:  "var(--palette-emerald-50, #ECFDF5)",
          100: "var(--palette-emerald-100, #D1FAE5)",
          200: "var(--palette-emerald-200, #A7F3D0)",
          300: "var(--palette-emerald-300, #6EE7B7)",
          400: "var(--palette-emerald-400, #34D399)",
          500: "var(--palette-emerald-500, #10B981)",
          600: "var(--palette-emerald-600, #059669)",
          700: "var(--palette-emerald-700, #047857)",
          800: "var(--palette-emerald-800, #065F46)",
          900: "var(--palette-emerald-900, #064E3B)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           AMBER - Warnings
           ═══════════════════════════════════════════════════════════════════ */
        amber: {
          50:  "var(--palette-amber-50, #FFFBEB)",
          100: "var(--palette-amber-100, #FEF3C7)",
          200: "var(--palette-amber-200, #FDE68A)",
          300: "var(--palette-amber-300, #FCD34D)",
          400: "var(--palette-amber-400, #FBBF24)",
          500: "var(--palette-amber-500, #F59E0B)",
          600: "var(--palette-amber-600, #D97706)",
          700: "var(--palette-amber-700, #B45309)",
          800: "var(--palette-amber-800, #92400E)",
          900: "var(--palette-amber-900, #78350F)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           ORANGE - Energy/Fire Mode
           ═══════════════════════════════════════════════════════════════════ */
        orange: {
          50:  "var(--palette-orange-50, #FFF7ED)",
          100: "var(--palette-orange-100, #FFEDD5)",
          200: "var(--palette-orange-200, #FED7AA)",
          300: "var(--palette-orange-300, #FDBA74)",
          400: "var(--palette-orange-400, #FB923C)",
          500: "var(--palette-orange-500, #F97316)",
          600: "var(--palette-orange-600, #EA580C)",
          700: "var(--palette-orange-700, #C2410C)",
          800: "var(--palette-orange-800, #9A3412)",
          900: "var(--palette-orange-900, #7C2D12)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           ROSE - Critical/Notifications
           ═══════════════════════════════════════════════════════════════════ */
        rose: {
          50:  "var(--palette-rose-50, #FFF1F2)",
          100: "var(--palette-rose-100, #FFE4E6)",
          200: "var(--palette-rose-200, #FECDD3)",
          300: "var(--palette-rose-300, #FDA4AF)",
          400: "var(--palette-rose-400, #FB7185)",
          500: "var(--palette-rose-500, #F43F5E)",
          600: "var(--palette-rose-600, #E11D48)",
          700: "var(--palette-rose-700, #BE123C)",
          800: "var(--palette-rose-800, #9F1239)",
          900: "var(--palette-rose-900, #881337)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           RED - Errors Only
           ═══════════════════════════════════════════════════════════════════ */
        red: {
          50:  "var(--palette-red-50, #FEF2F2)",
          100: "var(--palette-red-100, #FEE2E2)",
          200: "var(--palette-red-200, #FECACA)",
          300: "var(--palette-red-300, #FCA5A5)",
          400: "var(--palette-red-400, #F87171)",
          500: "var(--palette-red-500, #EF4444)",
          600: "var(--palette-red-600, #DC2626)",
          700: "var(--palette-red-700, #B91C1C)",
          800: "var(--palette-red-800, #991B1B)",
          900: "var(--palette-red-900, #7F1D1D)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           CYAN - Live/Real-time
           ═══════════════════════════════════════════════════════════════════ */
        cyan: {
          50:  "var(--palette-cyan-50, #ECFEFF)",
          100: "var(--palette-cyan-100, #CFFAFE)",
          200: "var(--palette-cyan-200, #A5F3FC)",
          300: "var(--palette-cyan-300, #67E8F9)",
          400: "var(--palette-cyan-400, #22D3EE)",
          500: "var(--palette-cyan-500, #06B6D4)",
          600: "var(--palette-cyan-600, #0891B2)",
          700: "var(--palette-cyan-700, #0E7490)",
          800: "var(--palette-cyan-800, #155E75)",
          900: "var(--palette-cyan-900, #164E63)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           INDIGO - Purple-Blue blend
           ═══════════════════════════════════════════════════════════════════ */
        indigo: {
          400: "var(--palette-indigo-400, #818CF8)",
          500: "var(--palette-indigo-500, #6366F1)",
          600: "var(--palette-indigo-600, #4F46E5)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           FUCHSIA - Pink-Purple blend
           ═══════════════════════════════════════════════════════════════════ */
        fuchsia: {
          400: "var(--palette-fuchsia-400, #E879F9)",
          500: "var(--palette-fuchsia-500, #D946EF)",
          600: "var(--palette-fuchsia-600, #C026D3)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           PINK
           ═══════════════════════════════════════════════════════════════════ */
        pink: {
          400: "var(--palette-pink-400, #F472B6)",
          500: "var(--palette-pink-500, #EC4899)",
          600: "var(--palette-pink-600, #DB2777)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           SEMANTIC ALIASES (Reference tokens.css)
           ═══════════════════════════════════════════════════════════════════ */
        
        /* Surface Hierarchy */
        surface: {
          0: "var(--surface-0, #F8FAFC)",
          1: "var(--surface-1, #FFFFFF)",
          2: "var(--surface-2, #F8FAFC)",
          3: "var(--surface-3, #F1F5F9)",
          4: "var(--surface-4, #E2E8F0)",
        },

        /* Brand (Violet) */
        brand: {
          DEFAULT: "var(--brand-500, #8B5CF6)",
          50:  "var(--brand-50, #F5F3FF)",
          100: "var(--brand-100, #EDE9FE)",
          200: "var(--brand-200, #DDD6FE)",
          300: "var(--brand-300, #C4B5FD)",
          400: "var(--brand-400, #A78BFA)",
          500: "var(--brand-500, #8B5CF6)",
          600: "var(--brand-600, #7C3AED)",
          700: "var(--brand-700, #6D28D9)",
          800: "var(--brand-800, #5B21B6)",
          900: "var(--brand-900, #4C1D95)",
        },

        /* Live (Cyan) */
        live: {
          DEFAULT: "var(--cyan-500, #06B6D4)",
          400: "var(--cyan-400, #22D3EE)",
          500: "var(--cyan-500, #06B6D4)",
          600: "var(--cyan-600, #0891B2)",
        },

        /* Success (Teal/Emerald) */
        success: {
          DEFAULT: "var(--success-500, #14B8A6)",
          50:  "var(--success-50, #F0FDFA)",
          100: "var(--success-100, #CCFBF1)",
          500: "var(--success-500, #14B8A6)",
          600: "var(--success-600, #0D9488)",
          light: "var(--teal-400, #2DD4BF)",
          dark: "var(--teal-700, #0F766E)",
        },

        /* Warning (Amber) */
        warning: {
          DEFAULT: "var(--warning-500, #F59E0B)",
          50:  "var(--warning-50, #FFFBEB)",
          100: "var(--warning-100, #FEF3C7)",
          400: "var(--warning-400, #FBBF24)",
          500: "var(--warning-500, #F59E0B)",
          600: "var(--warning-600, #D97706)",
          light: "var(--amber-400, #FBBF24)",
          dark: "var(--amber-700, #B45309)",
        },

        /* Error (Red) */
        error: {
          DEFAULT: "var(--error-500, #EF4444)",
          50:  "var(--error-50, #FEF2F2)",
          100: "var(--error-100, #FEE2E2)",
          500: "var(--error-500, #EF4444)",
          600: "var(--error-600, #DC2626)",
          light: "var(--red-400, #F87171)",
          dark: "var(--red-700, #B91C1C)",
        },

        /* Energy (Orange/Coral) */
        energy: {
          DEFAULT: "var(--energy-500, #F97316)",
          400: "var(--energy-400, #FB923C)",
          500: "var(--energy-500, #F97316)",
          600: "var(--energy-600, #EA580C)",
        },

        /* Info (Blue) */
        info: {
          DEFAULT: "var(--info-500, #3B82F6)",
          50:  "var(--blue-50, #EFF6FF)",
          100: "var(--blue-100, #DBEAFE)",
          500: "var(--info-500, #3B82F6)",
          600: "var(--blue-600, #2563EB)",
        },

        /* Danger alias */
        danger: {
          DEFAULT: "var(--error-500, #EF4444)",
          light: "var(--red-400, #F87171)",
          dark: "var(--red-700, #B91C1C)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           MOMENTUM STATE COLORS (Preserved from v4.1)
           ═══════════════════════════════════════════════════════════════════ */
        momentum: {
          fire: "var(--momentum-fire, #EF4444)",
          "fire-glow": "var(--momentum-fire-glow, rgba(239, 68, 68, 0.4))",
          "fire-subtle": "var(--momentum-fire-subtle, rgba(239, 68, 68, 0.15))",
          building: "var(--momentum-building, #F59E0B)",
          "building-glow": "var(--momentum-building-glow, rgba(245, 158, 11, 0.4))",
          "building-subtle": "var(--momentum-building-subtle, rgba(245, 158, 11, 0.15))",
          warming: "var(--momentum-warming, #8B5CF6)",
          "warming-glow": "var(--momentum-warming-glow, rgba(139, 92, 246, 0.4))",
          "warming-subtle": "var(--momentum-warming-subtle, rgba(139, 92, 246, 0.15))",
          starting: "var(--momentum-starting, #3B82F6)",
          "starting-glow": "var(--momentum-starting-glow, rgba(59, 130, 246, 0.4))",
          "starting-subtle": "var(--momentum-starting-subtle, rgba(59, 130, 246, 0.15))",
          attention: "var(--momentum-attention, #6B7280)",
          "attention-glow": "var(--momentum-attention-glow, rgba(107, 114, 128, 0.4))",
          "attention-subtle": "var(--momentum-attention-subtle, rgba(107, 114, 128, 0.15))",
        },

        /* ═══════════════════════════════════════════════════════════════════
           XP & GAMIFICATION (Preserved from v4.1)
           ═══════════════════════════════════════════════════════════════════ */
        xp: {
          gold: "var(--xp-gold, #FFD700)",
          "gold-glow": "var(--xp-gold-glow, rgba(255, 215, 0, 0.5))",
          "gold-subtle": "var(--xp-gold-subtle, rgba(255, 215, 0, 0.15))",
        },

        legendary: {
          start: "var(--legendary-start, #FFD700)",
          mid: "var(--legendary-mid, #EF4444)",
          end: "var(--legendary-end, #8B5CF6)",
        },

        /* Progress */
        progress: {
          track: "var(--progress-track, #E2E8F0)",
          fill: "var(--progress-fill, #8B5CF6)",
          low: "var(--violet-400, #A78BFA)",
          mid: "var(--violet-500, #8B5CF6)",
          high: "var(--violet-600, #7C3AED)",
          complete: "var(--success-500, #10B981)",
        },

        /* Text Hierarchy */
        text: {
          primary: "var(--text-primary, #1E293B)",
          secondary: "var(--text-secondary, #475569)",
          tertiary: "var(--text-tertiary, #64748B)",
          muted: "var(--text-muted, #94A3B8)",
          inverse: "var(--text-inverse, #FFFFFF)",
        },

        /* Border */
        border: {
          DEFAULT: "var(--border-default, #CBD5E1)",
          subtle: "var(--border-subtle, #E2E8F0)",
          strong: "var(--border-strong, #94A3B8)",
          brand: "var(--border-brand, #C4B5FD)",
          focus: "var(--border-focus, #8B5CF6)",
        },

        /* Accent (Fuchsia) */
        accent: {
          400: "var(--accent-400, #E879F9)",
          500: "var(--accent-500, #D946EF)",
          600: "var(--accent-600, #C026D3)",
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
        'xs':  'var(--radius-xs, 4px)',
        'sm':  'var(--radius-sm, 6px)',
        'md':  'var(--radius-md, 10px)',
        'lg':  'var(--radius-lg, 14px)',
        'xl':  'var(--radius-xl, 18px)',
        '2xl': 'var(--radius-2xl, 22px)',
        '3xl': '28px',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * SHADOWS & GLOWS
       * ─────────────────────────────────────────────────────────────────────────
       */
      boxShadow: {
        'sm':   'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
        'md':   'var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.04))',
        'lg':   'var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.04))',
        'xl':   'var(--shadow-xl, 0 20px 25px rgba(0, 0, 0, 0.05))',
        'card': 'var(--shadow-card, 0 4px 24px rgba(0, 0, 0, 0.06))',
        'focus': 'var(--ring-focus, 0 0 0 3px rgba(139, 92, 246, 0.15))',
        
        /* Signature Glows */
        'glow-brand':   'var(--glow-brand, 0 0 20px rgba(139, 92, 246, 0.2))',
        'glow-brand-strong': 'var(--glow-brand-strong, 0 0 30px rgba(139, 92, 246, 0.3))',
        'glow-blue':    '0 0 20px rgba(59, 130, 246, 0.2)',
        'glow-live':    'var(--glow-live, 0 0 20px rgba(6, 182, 212, 0.2))',
        'glow-success': 'var(--glow-success, 0 0 20px rgba(16, 185, 129, 0.2))',
        'glow-warning': 'var(--glow-warning, 0 0 20px rgba(245, 158, 11, 0.2))',
        'glow-error':   'var(--glow-error, 0 0 20px rgba(239, 68, 68, 0.2))',
        'glow-energy':  'var(--glow-energy, 0 0 20px rgba(244, 63, 94, 0.2))',
        
        /* Momentum Glow Levels */
        'momentum-1': 'var(--momentum-glow-1, 0 0 30px rgba(139, 92, 246, 0.05))',
        'momentum-2': 'var(--momentum-glow-2, 0 0 45px rgba(139, 92, 246, 0.08))',
        'momentum-3': 'var(--momentum-glow-3, 0 0 60px rgba(139, 92, 246, 0.12))',
        'momentum-4': 'var(--momentum-glow-4, 0 0 80px rgba(139, 92, 246, 0.18))',
        'momentum-5': 'var(--momentum-glow-5, 0 0 100px rgba(139, 92, 246, 0.25))',
        
        /* XP & Achievement Glows */
        'glow-xp': 'var(--glow-xp, 0 0 20px #FFD700, 0 0 40px rgba(255, 215, 0, 0.3))',
        'glow-legendary': 'var(--glow-legendary, 0 0 30px #FFD700, 0 0 60px #EF4444)',
        
        /* Light mode card shadows */
        'violet-sm': '0 2px 8px rgba(139, 92, 246, 0.08)',
        'violet-md': '0 4px 14px rgba(139, 92, 246, 0.12)',
        'violet-lg': '0 8px 24px rgba(139, 92, 246, 0.15)',
        'blue-sm': '0 2px 8px rgba(59, 130, 246, 0.08)',
        'blue-md': '0 4px 14px rgba(59, 130, 246, 0.12)',
        'blue-lg': '0 8px 24px rgba(59, 130, 246, 0.15)',
        
        'inner-brand': 'inset 0 0 0 1px var(--border-brand)',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * ANIMATIONS (All preserved from v4.1)
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
        'momentum-breathe': 'momentumBreathe 2s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
        'float':       'float 3s ease-in-out infinite',
        'shake':       'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'confetti':    'confetti 1s ease-out forwards',
        'xp-pop':      'xpPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'streak-fire': 'streakFire 1.5s ease-in-out infinite',
        'breathe':     'breathe 3s ease-in-out infinite',
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
        momentumBreathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.02)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%':      { filter: 'brightness(1.08)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px var(--brand-500, #8B5CF6)' },
          '100%': { boxShadow: '0 0 20px var(--brand-500, #8B5CF6), 0 0 40px var(--brand-400, #A78BFA)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
        xpPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        streakFire: {
          '0%, 100%': { filter: 'brightness(1) hue-rotate(0deg)' },
          '50%': { filter: 'brightness(1.2) hue-rotate(10deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.9' },
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
        '800': '800ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'standard': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * BACKGROUND IMAGE (Gradients)
       * ─────────────────────────────────────────────────────────────────────────
       */
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand, linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%))',
        'gradient-blue': 'var(--palette-gradient-blue, linear-gradient(135deg, #3B82F6 0%, #2563EB 100%))',
        'gradient-signature': 'var(--gradient-signature, linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%))',
        'gradient-energy': 'var(--gradient-energy, linear-gradient(135deg, #F97316 0%, #F43F5E 100%))',
        'gradient-success': 'var(--gradient-success, linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%))',
        'gradient-flow': 'var(--gradient-flow, linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%))',
        'gradient-ocean': 'var(--palette-gradient-ocean, linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #2DD4BF 100%))',
        'gradient-aurora': 'var(--palette-gradient-aurora, linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #3B82F6 50%, #06B6D4 75%, #2DD4BF 100%))',
        'gradient-sunset': 'var(--palette-gradient-sunset, linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%))',
        'gradient-legendary': 'var(--gradient-legendary, linear-gradient(135deg, #FFD700 0%, #EF4444 50%, #8B5CF6 100%))',
        'gradient-fire': 'var(--gradient-fire, linear-gradient(135deg, #FF6B6B 0%, #EF4444 50%, #DC2626 100%))',
        'gradient-page': 'var(--palette-gradient-page, linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%))',
        'aurora': 'var(--gradient-aurora, radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.08) 0%, transparent 50%))',
      },
    },
  },
  plugins: [],
};
