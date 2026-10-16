/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          paper: '#F8F5F1',
          charcoal: '#3C3C32',
          matcha: '#889D35',
          moss: '#6E8027',
          sand: '#D2C0A7',
          stone: '#EBE6DF',
          cream: '#F4EFEB',
          bark: '#544A3C',
          muted: '#8C8578',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'zen': '0 4px 20px -2px rgba(60, 60, 50, 0.05)',
        'zen-md': '0 8px 30px -4px rgba(60, 60, 50, 0.08)',
        'zen-hover': '0 12px 35px -4px rgba(136, 157, 53, 0.15)',
      }
    },
  },
  plugins: [],
}
