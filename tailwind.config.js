/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // use .dark on <html> (your Navbar toggles this)
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.25rem',
          lg: '2rem',
          xl: '2.5rem',
        },
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),       // nicer inputs/selects
    require('@tailwindcss/typography'),  // prose styling (optional)
    require('@tailwindcss/line-clamp'),  // truncate long text (optional)
  ],
}
