/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { 900: '#2C3340', 800: '#1e232e', 50: '#f0f9ff' },
        accent: { 400: '#E6BC76', 500: '#CE9B52', 600: '#b0823e' },
        crm: { 500: '#6366f1', 600: '#4f46e5' }
      },
      fontFamily: { sans: ['Cairo', 'sans-serif'] }
    },
  },
  plugins: [],
}