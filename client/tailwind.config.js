/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E40443',
          dark: '#B60336',
          hover: '#c0032f',
          light: '#FCE6EC'
        },
        accent: {
          DEFAULT: '#e90646',
          secondary: '#EC134C'
        },
        success: '#41B079',
        surface: {
          DEFAULT: '#F5F6F7',
          light: '#F9F9F9',
          card: '#EEF0F3'
        },
        text: {
          primary: '#1A1C1F',
          secondary: '#4B465C',
          muted: '#8D98A4',
          light: '#B3B3B3'
        },
        border: {
          light: '#EEF0F3',
          DEFAULT: '#E3E6E8',
          dark: '#D0D4D9'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -1px rgba(0, 0, 0, 0.03)',
        'top': '0 -4px 6px -1px rgba(0,0,0,0.05), 0 -2px 4px -1px rgba(0,0,0,0.03)'
      }
    },
  },
  plugins: [],
}
