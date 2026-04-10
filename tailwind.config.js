/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#1a1a1a',
        'dark-secondary': '#2d2d2d',
        'dark-tertiary': '#3f3f3f',
        'light-primary': '#ffffff',
        'light-secondary': '#f5f5f5',
        'light-tertiary': '#e8e8e8',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
