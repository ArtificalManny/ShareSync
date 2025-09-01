/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'], // supports both
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:     'rgb(var(--bg) / <alpha-value>)',
        card:   'rgb(var(--card) / <alpha-value>)',
        text:   'rgb(var(--text) / <alpha-value>)',
        muted:  'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',

        accent:            'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground':'rgb(var(--accent-foreground) / <alpha-value>)',

        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger:  'rgb(var(--danger) / <alpha-value>)',
        info:    'rgb(var(--info) / <alpha-value>)',

        chart1: 'rgb(var(--chart-1) / <alpha-value>)',
        chart2: 'rgb(var(--chart-2) / <alpha-value>)',
        chart3: 'rgb(var(--chart-3) / <alpha-value>)',
        chart4: 'rgb(var(--chart-4) / <alpha-value>)',
        chart5: 'rgb(var(--chart-5) / <alpha-value>)',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--ring) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};