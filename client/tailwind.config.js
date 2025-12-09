/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Burası boş kalsın, Tailwind'in orijinal renklerini kullanalım
      keyframes: {
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3) rotate(-10deg)' },
          '50%': { transform: 'scale(1.4) rotate(10deg)' },
          '75%': { transform: 'scale(1.2) rotate(-5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        'burst-wave': {
          '0%': { transform: 'scale(0.5)', opacity: '0.8' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        'particle-burst': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' },
        },
        'sparkle-1': {
          '0%, 100%': { transform: 'scale(0) translateY(0)', opacity: '0' },
          '50%': { transform: 'scale(1) translateY(-8px)', opacity: '1' },
        },
        'sparkle-2': {
          '0%, 100%': { transform: 'scale(0) translateX(0)', opacity: '0' },
          '50%': { transform: 'scale(1) translateX(8px)', opacity: '1' },
        },
        'sparkle-3': {
          '0%, 100%': { transform: 'scale(0) translateY(0)', opacity: '0' },
          '50%': { transform: 'scale(1) translateY(8px)', opacity: '1' },
        },
        'sparkle-4': {
          '0%, 100%': { transform: 'scale(0) translateX(0)', opacity: '0' },
          '50%': { transform: 'scale(1) translateX(-8px)', opacity: '1' },
        },
        'count-pop': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },
      animation: {
        'heart-pop': 'heart-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'burst-wave': 'burst-wave 0.6s ease-out forwards',
        'particle-burst': 'particle-burst 0.6s ease-out forwards',
        'sparkle-1': 'sparkle-1 0.6s ease-out forwards',
        'sparkle-2': 'sparkle-2 0.6s ease-out forwards 0.1s',
        'sparkle-3': 'sparkle-3 0.6s ease-out forwards 0.2s',
        'sparkle-4': 'sparkle-4 0.6s ease-out forwards 0.15s',
        'count-pop': 'count-pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
}