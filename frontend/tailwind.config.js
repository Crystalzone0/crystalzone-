/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C6A15B', // champagne gold: fills, lines, icons, and text on dark surfaces
          light: '#D8BC7A', // soft highlight
          dark: '#85672B', // gold TEXT on ivory and white (about 4.8:1)
        },
        charcoal: '#222222', // rich charcoal text
        ink: '#111111', // near-black
        cream: {
          DEFAULT: '#F8F5EF', // warm ivory
          dark: '#EEEAE2', // secondary background
        },
        muted: '#77736B', // muted text (large text only: 4.3:1 on ivory)
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17, 17, 17, 0.04), 0 8px 24px -12px rgba(17, 17, 17, 0.10)',
        lift: '0 2px 4px rgba(17, 17, 17, 0.04), 0 18px 40px -16px rgba(17, 17, 17, 0.22)',
      },
      letterSpacing: {
        luxe: '0.18em',
      },
      keyframes: {
        // Every entrance ends in "transform: none" so nothing is left behind that could trap fixed-position children.
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pop: { '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        sheetUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        slideInLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'none' } },
        slideInRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        heart: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.28)' }, '100%': { transform: 'scale(1)' } },
        bump: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        dropdown: { '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' }, '100%': { opacity: '1', transform: 'none' } },
        page: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        tick: { '0%': { opacity: '0', transform: 'scale(0.5)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      // "backwards" (not "both"): the animation leaves no lasting styles on the element once it finishes.
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out backwards',
        'fade-in': 'fadeIn 0.2s ease-out backwards',
        pop: 'pop 0.22s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'sheet-up': 'sheetUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'slide-in-left': 'slideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'slide-in-right': 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        heart: 'heart 0.36s ease-out',
        bump: 'bump 0.3s ease-out',
        dropdown: 'dropdown 0.16s ease-out backwards',
        page: 'page 0.28s ease-out backwards',
        tick: 'tick 0.2s ease-out backwards',
      },
    },
  },
  plugins: [],
};