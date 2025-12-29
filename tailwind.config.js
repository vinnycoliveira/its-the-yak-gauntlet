/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Caprasimo', 'Georgia', 'serif'],
        'digital': ['"Digital Numbers"', 'monospace'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Original colors
        'card-cream': '#f5f0e1',
        'card-border': '#8b7355',
        'yak-gold': '#d4af37',
        'yak-gold-light': '#e5c358',
        'yak-navy': '#1a1a2e',
        'yak-navy-light': '#252542',
        // Figma card colors
        'card-burgundy': '#842022',
        'card-dark-red': '#611213',
        // Medal colors
        'gold-light': '#bfa46a',
        'gold-dark': '#594c31',
        'gold-highlight': '#e6d4a8',
        'silver-light': '#c8c8c8',
        'silver-dark': '#777777',
        'silver-highlight': '#ffffff',
        'bronze-light': '#cd7f32',
        'bronze-dark': '#8b4513',
        'bronze-highlight': '#daa06d',
        // Barstool brand
        'barstool-red': '#c62232',
        'barstool-navy': '#141e30',
        // Category backgrounds
        'cat-nfl': '#1c3667',
        'cat-mlb': '#041e42',
        'cat-nba': '#1d428a',
        'cat-comedian': '#ff6b6b',
        'cat-wrestling': '#8b0000',
        'cat-racing': '#228b22',
        'cat-entertainer': '#9b59b6',
        'cat-family': '#e91e63',
      },
    },
  },
  plugins: [],
}
