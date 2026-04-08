import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mo: {
          bg: '#F7F3EF',
          card: '#FDFCFB',
          border: '#E2D9D0',
          text: '#3A3530',
          muted: '#8A7F78',
          accent: '#A89880',
          'accent-light': '#EDE7DF',
        },
        brand: {
          DEFAULT: '#8B9DB5',
          light: '#D0D9E5',
          dark: '#6B7D95',
          subtle: '#EEF1F6',
        },
        income: {
          DEFAULT: '#7A9E8E',
          light: '#D4E8E2',
          dark: '#5A7E6E',
          subtle: '#EBF5F1',
        },
        expense: {
          DEFAULT: '#B87A72',
          light: '#EDD8D5',
          dark: '#8A5A54',
          subtle: '#F8EDEB',
        },
        net: {
          DEFAULT: '#9B91B5',
          light: '#DDD9EE',
          dark: '#7A7096',
          subtle: '#F0EEF8',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(58,53,48,0.06)',
        card: '0 1px 4px rgba(58,53,48,0.05), 0 4px 16px rgba(58,53,48,0.04)',
        fab: '0 4px 20px rgba(58,53,48,0.16)',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
export default config
