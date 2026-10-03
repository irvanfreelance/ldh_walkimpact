import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#6DC230',
          'green-dark': '#3A7D0A',
          'green-leaf': '#8ED63F',
          'off-white': '#F5F7F2',
          'light-gray': '#E8EDE3',
          'text-dark': '#1A2714',
          'text-muted': '#5A6B4E',
          dot: '#C8E6A0',
          amber: '#F5A623',
          success: '#2ECC71',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
        body: ['Inter', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(61, 125, 10, 0.08)',
        'card-hover': '0 6px 24px rgba(61, 125, 10, 0.14)',
        cta: '0 4px 16px rgba(109, 194, 48, 0.4)',
      },
    },
  },
} satisfies Config
