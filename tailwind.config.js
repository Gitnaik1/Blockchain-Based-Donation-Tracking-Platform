/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1E3A8A',
          primary: '#2563EB',
          navy: '#0F172A',
          lightBlue: '#DBEAFE',
          mint: '#10B981',
          mintLight: '#D1FAE5',
          border: '#E2E8F0',
          bgLight: '#F8FAFC',
          textMuted: '#64748B',
          textSub: '#94A3B8',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
