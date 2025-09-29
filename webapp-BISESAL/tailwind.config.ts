import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#0067c6',
          dark: '#124b97',
          light: '#e5f1ff'
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f192d'
        },
        border: {
          DEFAULT: '#d6e4f5',
          dark: '#23324a'
        },
        text: {
          primary: '#12203a',
          secondary: '#4a5b75',
          muted: '#9db2d4',
          inverted: '#e4edfb'
        },
        overlay: {
          light: 'rgba(255, 255, 255, 0.85)',
          dark: 'rgba(15, 23, 42, 0.85)'
        }
      },
      boxShadow: {
        card: '0 12px 32px rgba(11, 55, 117, 0.12)',
        panel: '0 10px 24px rgba(11, 55, 117, 0.08)',
        shell: '0 8px 24px rgba(11, 55, 117, 0.08)'
      },
      borderRadius: {
        card: '18px'
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      backgroundImage: {
        'body-light': 'linear-gradient(180deg, #f7fbff 0%, #f0f6ff 40%, #ffffff 100%)',
        'body-dark': 'linear-gradient(180deg, #0b1627 0%, #0d1b32 45%, #10213c 100%)'
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
