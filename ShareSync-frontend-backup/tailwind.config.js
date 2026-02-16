/** @type {import('tailwindcss').Config} */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARESYNC DESIGN SYSTEM v4.1 - Phase 1: Emotional Color System + Blueprint
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * COLOR PHILOSOPHY:
 * • Deep Violet (#7C3AED → #6D28D9) = Brand, creativity, transformation
 * • Electric Cyan (#06B6D4) = Live states, technology, progress
 * • Mint (#10B981) = Success, achievement, growth
 * • Amber (#F59E0B) = Warning, attention
 * • Coral (#F43F5E) = Energy, high momentum
 * • Red = Errors ONLY
 * 
 * SIGNATURE FEATURE: Momentum Glow - interface brightens with productivity
 * 
 * v4.1 CHANGELOG (Blueprint Additions):
 * - Added: Momentum STATE colors (fire/building/warming/starting/attention)
 * - Added: XP & Gamification colors (gold, legendary)
 * - Added: New box shadows (glow-xp, glow-legendary)
 * - Added: New animations (glow, float, shake, confetti, xpPop, streakFire, breathe)
 * - Added: New gradients (legendary, fire, aurora)
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
       * COLOR SYSTEM - Deep Violet Signature Palette
       * ─────────────────────────────────────────────────────────────────────────
       */
      colors: {
        /* Surface Hierarchy (Dark Theme) */
        surface: {
          0: "var(--surface-0, #09090B)",
          1: "var(--surface-1, #111113)",
          2: "var(--surface-2, #1A1A1D)",
          3: "var(--surface-3, #252529)",
          4: "var(--surface-4, #313136)",
        },

        /* Brand: Deep Violet - THE Signature Color */
        brand: {
          DEFAULT: "var(--brand-600, #7C3AED)",
          50:  "var(--brand-50, #F5F3FF)",
          100: "var(--brand-100, #EDE9FE)",
          200: "var(--brand-200, #DDD6FE)",
          300: "var(--brand-300, #C4B5FD)",
          400: "var(--brand-400, #A78BFA)",
          500: "var(--brand-500, #8B5CF6)",
          600: "var(--brand-600, #7C3AED)",  /* ← PRIMARY SIGNATURE */
          700: "var(--brand-700, #6D28D9)",  /* ← PRIMARY DARK */
          800: "var(--brand-800, #5B21B6)",
          900: "var(--brand-900, #4C1D95)",
          950: "var(--brand-950, #2E1065)",
        },

        /* Accent: Fuchsia (for gradients) */
        accent: {
          400: "var(--accent-400, #E879F9)",
          500: "var(--accent-500, #D946EF)",
          600: "var(--accent-600, #C026D3)",
        },

        /* Live: Electric Cyan (real-time states) */
        live: {
          DEFAULT: "var(--cyan-500, #06B6D4)",
          50:  "var(--cyan-50, #ECFEFF)",
          100: "var(--cyan-100, #CFFAFE)",
          200: "var(--cyan-200, #A5F3FC)",
          300: "var(--cyan-300, #67E8F9)",
          400: "var(--cyan-400, #22D3EE)",
          500: "var(--cyan-500, #06B6D4)",
          600: "var(--cyan-600, #0891B2)",
          700: "var(--cyan-700, #0E7490)",
          800: "var(--cyan-800, #155E75)",
          900: "var(--cyan-900, #164E63)",
        },

        /* Success: Mint (achievements) */
        success: {
          DEFAULT: "var(--success-500, #10B981)",
          50:  "var(--success-50, #ECFDF5)",
          100: "var(--success-100, #D1FAE5)",
          200: "var(--success-200, #A7F3D0)",
          300: "var(--success-300, #6EE7B7)",
          400: "var(--success-400, #34D399)",
          500: "var(--success-500, #10B981)",
          600: "var(--success-600, #059669)",
          700: "var(--success-700, #047857)",
          800: "var(--success-800, #065F46)",
          900: "var(--success-900, #064E3B)",
          light: "var(--success-400, #34D399)",
          dark: "var(--success-900, #064E3B)",
        },

        /* Warning: Amber */
        warning: {
          DEFAULT: "var(--warning-500, #F59E0B)",
          50:  "var(--warning-50, #FFFBEB)",
          100: "var(--warning-100, #FEF3C7)",
          200: "var(--warning-200, #FDE68A)",
          300: "var(--warning-300, #FCD34D)",
          400: "var(--warning-400, #FBBF24)",
          500: "var(--warning-500, #F59E0B)",
          600: "var(--warning-600, #D97706)",
          700: "var(--warning-700, #B45309)",
          800: "var(--warning-800, #92400E)",
          900: "var(--warning-900, #78350F)",
          light: "var(--warning-400, #FBBF24)",
          dark: "var(--warning-900, #78350F)",
        },

        /* Energy: Coral (high momentum) */
        energy: {
          DEFAULT: "var(--energy-500, #F43F5E)",
          50:  "var(--energy-50, #FFF1F2)",
          100: "var(--energy-100, #FFE4E6)",
          200: "var(--energy-200, #FECDD3)",
          300: "var(--energy-300, #FDA4AF)",
          400: "var(--energy-400, #FB7185)",
          500: "var(--energy-500, #F43F5E)",
          600: "var(--energy-600, #E11D48)",
          700: "var(--energy-700, #BE123C)",
          800: "var(--energy-800, #9F1239)",
          900: "var(--energy-900, #881337)",
        },

        /* Error: True Red (errors ONLY) */
        error: {
          DEFAULT: "var(--error-500, #EF4444)",
          50:  "var(--error-50, #FEF2F2)",
          100: "var(--error-100, #FEE2E2)",
          200: "var(--error-200, #FECACA)",
          300: "var(--error-300, #FCA5A5)",
          400: "var(--error-400, #F87171)",
          500: "var(--error-500, #EF4444)",
          600: "var(--error-600, #DC2626)",
          700: "var(--error-700, #B91C1C)",
          800: "var(--error-800, #991B1B)",
          900: "var(--error-900, #7F1D1D)",
          light: "var(--error-400, #F87171)",
          dark: "var(--error-900, #7F1D1D)",
        },
        
        /* Danger alias */
        danger: {
          DEFAULT: "var(--error-500, #EF4444)",
          light: "var(--error-400, #F87171)",
          dark: "var(--error-900, #7F1D1D)",
        },

        /* Info: Blue */
        info: {
          DEFAULT: "var(--info-500, #3B82F6)",
          50:  "var(--info-50, #EFF6FF)",
          100: "var(--info-100, #DBEAFE)",
          200: "var(--info-200, #BFDBFE)",
          300: "var(--info-300, #93C5FD)",
          400: "var(--info-400, #60A5FA)",
          500: "var(--info-500, #3B82F6)",
          600: "var(--info-600, #2563EB)",
          700: "var(--info-700, #1D4ED8)",
          800: "var(--info-800, #1E40AF)",
          900: "var(--info-900, #1E3A8A)",
        },

        /* ═══════════════════════════════════════════════════════════════════
           MOMENTUM STATE COLORS — NEW in v4.1
           For dynamic UI based on user productivity levels
           ═══════════════════════════════════════════════════════════════════ */
        momentum: {
          /* 🔥 FIRE MODE (80-100%) */
          fire: "var(--momentum-fire, #EF4444)",
          "fire-glow": "var(--momentum-fire-glow, rgba(239, 68, 68, 0.4))",
          "fire-subtle": "var(--momentum-fire-subtle, rgba(239, 68, 68, 0.15))",
          
          /* ⚡ BUILDING (60-79%) */
          building: "var(--momentum-building, #F59E0B)",
          "building-glow": "var(--momentum-building-glow, rgba(245, 158, 11, 0.4))",
          "building-subtle": "var(--momentum-building-subtle, rgba(245, 158, 11, 0.15))",
          
          /* 💜 WARMING UP (40-59%) */
          warming: "var(--momentum-warming, #8B5CF6)",
          "warming-glow": "var(--momentum-warming-glow, rgba(139, 92, 246, 0.4))",
          "warming-subtle": "var(--momentum-warming-subtle, rgba(139, 92, 246, 0.15))",
          
          /* 💙 GETTING STARTED (20-39%) */
          starting: "var(--momentum-starting, #3B82F6)",
          "starting-glow": "var(--momentum-starting-glow, rgba(59, 130, 246, 0.4))",
          "starting-subtle": "var(--momentum-starting-subtle, rgba(59, 130, 246, 0.15))",
          
          /* 🩶 NEEDS ATTENTION (0-19%) */
          attention: "var(--momentum-attention, #6B7280)",
          "attention-glow": "var(--momentum-attention-glow, rgba(107, 114, 128, 0.4))",
          "attention-subtle": "var(--momentum-attention-subtle, rgba(107, 114, 128, 0.15))",
        },

        /* ═══════════════════════════════════════════════════════════════════
           XP & GAMIFICATION — NEW in v4.1
           For XP rewards, achievements, legendary moments
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

        /* Progress (Purple-based) */
        progress: {
          track: "var(--progress-track, rgba(124, 58, 237, 0.15))",
          fill: "var(--progress-fill, #7C3AED)",
          low: "var(--brand-400, #A78BFA)",
          mid: "var(--brand-500, #8B5CF6)",
          high: "var(--brand-600, #7C3AED)",
          complete: "var(--success-500, #10B981)",
        },

        /* Text Hierarchy */
        text: {
          primary: "var(--text-primary, #FAFAFA)",
          secondary: "var(--text-secondary, #A1A1AA)",
          tertiary: "var(--text-tertiary, #71717A)",
          muted: "var(--text-muted, #52525B)",
          inverse: "var(--text-inverse, #09090B)",
        },

        /* Border */
        border: {
          DEFAULT: "var(--border-default, rgba(255, 255, 255, 0.10))",
          subtle: "var(--border-subtle, rgba(255, 255, 255, 0.06))",
          strong: "var(--border-strong, rgba(255, 255, 255, 0.16))",
          brand: "var(--border-brand, rgba(124, 58, 237, 0.40))",
          focus: "var(--border-focus, rgba(124, 58, 237, 0.60))",
        },

        /* Legacy slate (for gradual migration) */
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
        'sm':   'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.3))',
        'md':   'var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.25))',
        'lg':   'var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.3))',
        'xl':   'var(--shadow-xl, 0 20px 25px rgba(0, 0, 0, 0.35))',
        'card': 'var(--shadow-card, 0 4px 24px rgba(0, 0, 0, 0.25))',
        'focus': 'var(--ring-focus, 0 0 0 3px rgba(124, 58, 237, 0.4))',
        
        /* Signature Glows - USE ON HOVER/FOCUS ONLY */
        'glow-brand':   'var(--glow-brand, 0 0 20px rgba(124, 58, 237, 0.35))',
        'glow-brand-strong': 'var(--glow-brand-strong, 0 0 30px rgba(124, 58, 237, 0.5))',
        'glow-live':    'var(--glow-live, 0 0 20px rgba(6, 182, 212, 0.35))',
        'glow-success': 'var(--glow-success, 0 0 20px rgba(16, 185, 129, 0.35))',
        'glow-warning': 'var(--glow-warning, 0 0 20px rgba(245, 158, 11, 0.35))',
        'glow-error':   'var(--glow-error, 0 0 20px rgba(239, 68, 68, 0.35))',
        'glow-energy':  'var(--glow-energy, 0 0 20px rgba(244, 63, 94, 0.35))',
        
        /* Momentum Glow Levels (existing) */
        'momentum-1': 'var(--momentum-glow-1, 0 0 30px rgba(124, 58, 237, 0.08))',
        'momentum-2': 'var(--momentum-glow-2, 0 0 45px rgba(124, 58, 237, 0.14))',
        'momentum-3': 'var(--momentum-glow-3, 0 0 60px rgba(124, 58, 237, 0.22))',
        'momentum-4': 'var(--momentum-glow-4, 0 0 80px rgba(124, 58, 237, 0.32))',
        'momentum-5': 'var(--momentum-glow-5, 0 0 100px rgba(139, 92, 246, 0.45))',
        
        /* XP & Achievement Glows — NEW in v4.1 */
        'glow-xp': 'var(--glow-xp, 0 0 20px #FFD700, 0 0 40px rgba(255, 215, 0, 0.3))',
        'glow-legendary': 'var(--glow-legendary, 0 0 30px #FFD700, 0 0 60px #EF4444)',
        
        'inner-brand': 'inset 0 0 0 1px var(--border-brand)',
      },

      /**
       * ─────────────────────────────────────────────────────────────────────────
       * ANIMATIONS
       * ─────────────────────────────────────────────────────────────────────────
       */
      animation: {
        /* Existing animations */
        'fade-in':     'fadeIn 0.2s ease-out',
        'fade-up':     'fadeUp 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'progress':    'progressPulse 2s ease-in-out infinite',
        'momentum-breathe': 'momentumBreathe 2s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        
        /* NEW animations in v4.1 */
        'glow':        'glow 2s ease-in-out infinite alternate',
        'float':       'float 3s ease-in-out infinite',
        'shake':       'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'confetti':    'confetti 1s ease-out forwards',
        'xp-pop':      'xpPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'streak-fire': 'streakFire 1.5s ease-in-out infinite',
        'breathe':     'breathe 3s ease-in-out infinite',
      },
      keyframes: {
        /* Existing keyframes */
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
        
        /* NEW keyframes in v4.1 */
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
        /* Existing gradients */
        'gradient-brand': 'var(--gradient-brand, linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%))',
        'gradient-signature': 'var(--gradient-signature, linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%))',
        'gradient-energy': 'var(--gradient-energy, linear-gradient(135deg, #F43F5E 0%, #F59E0B 100%))',
        'gradient-success': 'var(--gradient-success, linear-gradient(135deg, #10B981 0%, #06B6D4 100%))',
        'gradient-flow': 'var(--gradient-flow, linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%))',
        
        /* NEW gradients in v4.1 */
        'gradient-legendary': 'var(--gradient-legendary, linear-gradient(135deg, #FFD700 0%, #EF4444 50%, #8B5CF6 100%))',
        'gradient-fire': 'var(--gradient-fire, linear-gradient(135deg, #FF6B6B 0%, #EF4444 50%, #DC2626 100%))',
        'aurora': 'var(--gradient-aurora, radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.15) 0%, transparent 50%))',
      },
    },
  },
  plugins: [],
};
