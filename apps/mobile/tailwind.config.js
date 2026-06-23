/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#FFD600',
        navy: '#003366',
        canvas: '#F5F7FB',
      },
    },
  },
  plugins: [],
};
