/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberDark: '#0B0E14',
        cyberPanel: '#151922',
        cyberNeon: '#00FFA3',
        cyberCyan: '#00E5FF',
      }
    },
  },
  plugins: [],
}