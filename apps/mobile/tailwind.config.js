/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#FFC800',
        'gold-dark': '#E6B400',
        'gold-soft': '#FFF7DB',
        navy: '#0A2E5C',
        'navy-700': '#123A6D',
        'navy-800': '#082444',
        'navy-900': '#051A33',
        canvas: '#F2F5FA',
        ink: '#0F1F38',
        muted: '#64748B',
        faint: '#94A3B8',
        line: '#E4EAF2',
      },
    },
  },
  plugins: [],
};
