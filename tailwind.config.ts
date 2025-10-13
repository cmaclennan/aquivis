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
          DEFAULT: '#1e91c4',
          50: '#e6f4fa',
          100: '#cfeaf4',
          200: '#a6d9ea',
          300: '#7ec8e0',
          400: '#55b6d6',
          500: '#1e91c4',
          600: '#1874a1',
          700: '#125a7f',
          800: '#0d405c',
          900: '#072739',
        },
        accent: {
          DEFAULT: '#a8b2c1',
          50: '#f6f8fb',
          100: '#edf1f7',
          200: '#d9dee9',
          300: '#c4cbdc',
          400: '#b0b9cf',
          500: '#a8b2c1',
          600: '#8a94a3',
          700: '#6b7583',
          800: '#4c5663',
          900: '#2e3742',
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
        'primary-foreground': 'hsl(var(--primary-foreground))',
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
      boxShadow: {
        sm: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(16,24,40,0.1), 0 1px 2px -1px rgba(16,24,40,0.1)',
        md: '0 2px 4px -2px rgba(16,24,40,0.1), 0 4px 8px -2px rgba(16,24,40,0.1)',
        lg: '0 8px 16px -4px rgba(16,24,40,0.1)',
        xl: '0 12px 24px -6px rgba(16,24,40,0.12)',
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

