import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sb: {
          navy:   '#002745',
          inky:   '#4F7489',
          sky:    '#B7E0DE',
          onyx:   '#000000',
          cream:  '#F2F1E6',
          red:    '#C0392B',
          orange: '#E67E22',
          green:  '#2ECC71',
        },
      },
      fontFamily: {
        brand: ['ChakraPetch', 'sans-serif'],
        mono:  ['DMMono', 'monospace'],
      },
      width: {
        sidebar: '260px',
      },
    },
  },
  plugins: [],
} satisfies Config
