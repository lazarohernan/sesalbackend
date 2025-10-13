import type { Config } from 'tailwindcss'
import lineClamp from '@tailwindcss/line-clamp'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#f96000',    // Naranja principal para elementos gráficos y números
          dark: '#d14f00',    // Naranja más oscuro
          light: '#fff2e8'    // Naranja muy claro para fondos
        },
        accent: {
          base: '#4cc7d7',    // Azul para filtros y elementos interactivos
          dark: '#2a9aad',    // Azul más oscuro
          light: '#e6f7fa'    // Azul muy claro para fondos
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f192d'
        },
        border: {
          DEFAULT: '#e0e0e0',    // Gris claro para bordes
          dark: '#374151'       // Gris medio para bordes en modo oscuro
        },
        text: {
          primary: '#1a1a1a',    // Gris oscuro para textos principales (mejor contraste)
          secondary: '#666666',  // Gris medio para textos secundarios
          muted: '#999999',     // Gris claro para textos muted
          inverted: '#ffffff'   // Blanco para textos invertidos
        },
        overlay: {
          light: 'rgba(255, 255, 255, 0.85)',
          dark: 'rgba(15, 23, 42, 0.85)'
        }
      },
      boxShadow: {
        card: '0 12px 32px rgba(249, 96, 0, 0.12)',    // Sombra con tinte naranja
        panel: '0 10px 24px rgba(249, 96, 0, 0.08)',   // Sombra con tinte naranja
        shell: '0 8px 24px rgba(249, 96, 0, 0.08)'     // Sombra con tinte naranja
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
  plugins: [lineClamp]
}

export default config
