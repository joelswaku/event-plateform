/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  '#07070f',
          card:     '#0e0e16',
          elevated: '#14141f',
          input:    '#0a0a14',
        },
        accent: {
          gold:    '#C9A96E',
          indigo:  '#6366f1',
          emerald: '#10b981',
          amber:   '#f59e0b',
          red:     '#ef4444',
          violet:  '#a78bfa',
          cyan:    '#06b6d4',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          subtle:  'rgba(255,255,255,0.06)',
          strong:  'rgba(255,255,255,0.18)',
        },
      },
    },
  },
  plugins: [],
};
