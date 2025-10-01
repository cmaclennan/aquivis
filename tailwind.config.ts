import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Aquivis Brand Colors
        primary: {
          DEFAULT: '#2090c3',
          50: '#e6f4fa',
          100: '#cce9f5',
          200: '#99d3eb',
          300: '#66bde1',
          400: '#33a7d7',
          500: '#2090c3', // Main brand color
          600: '#1a739c',
          700: '#135675',
          800: '#0d394e',
          900: '#061c27',
        },
        accent: {
          DEFAULT: '#bac2c3',
          50: '#f5f6f6',
          100: '#ebeded',
          200: '#d7dbdb',
          300: '#c3c9c9',
          400: '#afb7b7',
          500: '#bac2c3', // Subtle gray accent
          600: '#959b9c',
          700: '#707475',
          800: '#4a4d4e',
          900: '#252627',
        },
        // Functional colors
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        // Shadcn base colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}

export default config

