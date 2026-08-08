/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#1A1D23',
          white: '#FFFFFF',
          emerald: '#10B981',
          red: '#DC2626',
          amber: '#F59E0B',
          slate: '#64748B',
          light: '#E5E7EB',
          gray: '#9CA3AF',
          blue: '#0EA5E9',
          purple: '#8B5CF6',
          charcoal: '#1A1D23',
        }
      }
    },
  },
  plugins: [],
}
