/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B5FFF',
        success: '#16A34A',
        danger: '#DC2626',
      },
      fontFamily: {
        'display': ['"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}