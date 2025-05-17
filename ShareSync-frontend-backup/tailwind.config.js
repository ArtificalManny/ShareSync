/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#1a1a2e',
        'vibrant-pink': '#ff2e63',
        'neon-blue': '#08f7fe',
      },
      fontFamily: {
        'display': ['"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}