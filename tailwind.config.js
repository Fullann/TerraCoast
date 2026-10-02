/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '22': '5.5rem',
        '26': '6.5rem',
        '84': '21rem',
        '88': '22rem',
        '92': '23rem',
        '104': '26rem',
        '112': '28rem',
      },
    },
  },
  plugins: [],
};
