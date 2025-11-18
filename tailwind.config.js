/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"],
      },
      keyframes: {
        'float-front': {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg) translateZ(40px)' },
          '50%':      { transform: 'translateY(-12px) rotate(-1deg) translateZ(48px)' },
        },
        'float-mid': {
          '0%, 100%': { transform: 'translateY(0) rotate(3deg) translateZ(20px)' },
          '50%':      { transform: 'translateY(10px) rotate(4deg) translateZ(24px)' },
        },
        'float-back': {
          '0%, 100%': { transform: 'translateY(0) rotate(6deg) translateZ(0)' },
          '50%':      { transform: 'translateY(-8px) rotate(5deg) translateZ(8px)' },
        },
        'rainbow-travel': {
          '0%':   { left: '0%', opacity: '0' },
          '5%':   { opacity: '1' },
          '45%':  { left: 'calc(100% - 8rem)', opacity: '1' },   // 8rem = w-32
          '50%':  { left: 'calc(100% - 8rem)', opacity: '0' },   // fade out at right end
          '55%':  { left: 'calc(100% - 8rem)', opacity: '1' },   // reappear at right
          '95%':  { left: '0%', opacity: '1' },                  // travel back to left
          '100%': { left: '0%', opacity: '0' },                  // fade out and loop
        },
        'rainbow-travel-rev': {
          '0%':   { left: 'calc(100% - 8rem)', opacity: '0' },
          '5%':   { opacity: '1' },
          '45%':  { left: '0%', opacity: '1' },
          '50%':  { left: '0%', opacity: '0' },
          '55%':  { left: '0%', opacity: '1' },
          '95%':  { left: 'calc(100% - 8rem)', opacity: '1' },
          '100%': { left: 'calc(100% - 8rem)', opacity: '0' },
        },
        'rainbow-travel-y': {
          '0%':   { transform: 'translateY(0)', opacity: '0' },
          '5%':   { opacity: '1' },
          '45%':  { transform: 'translateY(var(--vy))', opacity: '1' },
          '50%':  { transform: 'translateY(var(--vy))', opacity: '0' },
          '55%':  { transform: 'translateY(var(--vy))', opacity: '1' },
          '95%':  { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '0' },
        },
        'rainbow-travel-y-rev': {
          '0%':   { transform: 'translateY(var(--vy))', opacity: '0' },
          '5%':   { opacity: '1' },
          '45%':  { transform: 'translateY(0)', opacity: '1' },
          '50%':  { transform: 'translateY(0)', opacity: '0' },
          '55%':  { transform: 'translateY(0)', opacity: '1' },
          '95%':  { transform: 'translateY(var(--vy))', opacity: '1' },
          '100%': { transform: 'translateY(var(--vy))', opacity: '0' },
        },
      },
      animation: {
        'float-front': 'float-front 6s ease-in-out infinite',
        'float-mid': 'float-mid 7s ease-in-out infinite',
        'float-back': 'float-back 8s ease-in-out infinite',
        'rainbow-travel': 'rainbow-travel 18s linear infinite',
        'rainbow-travel-rev': 'rainbow-travel-rev 18s linear infinite',
        'rainbow-travel-y': 'rainbow-travel-y 18s linear infinite',
        'rainbow-travel-y-rev': 'rainbow-travel-y-rev 18s linear infinite',
      },
    },
  },
  plugins: [],
};


