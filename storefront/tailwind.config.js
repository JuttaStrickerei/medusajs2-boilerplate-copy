const path = require("path")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ============================================
      // STRICKEREI JUTTA - DESIGN SYSTEM
      // Luxury Austrian Knitwear Brand (seit 1965)
      // ============================================
      
      colors: {
        // Primary Brand Colors - Stone Palette
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Warm accent colors for luxury feel
        warm: {
          50: '#fefdfb',
          100: '#fef7f0',
          200: '#feeee0',
          300: '#fde0c7',
          400: '#fbc8a1',
          500: '#f7a872',
        },
        // Semantic colors
        success: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark: '#14532d',
        },
        error: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#7f1d1d',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#ca8a04',
          dark: '#713f12',
        },
        // Legacy grey support
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      
      // Typography
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'monospace',
        ],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      
      // Spacing & Layout
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'section-x': 'clamp(1rem, 5vw, 4rem)',
        'section-y': 'clamp(3rem, 8vw, 6rem)',
      },
      
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        'content': '1440px',
      },
      
      // Border Radius
      borderRadius: {
        none: '0px',
        soft: '2px',
        base: '4px',
        rounded: '8px',
        large: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        circle: '9999px',
      },
      
      // Shadows - Luxury subtle shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        'hover-lift': '0 10px 40px -10px rgb(0 0 0 / 0.15)',
        'card': '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 30px -8px rgb(0 0 0 / 0.12), 0 4px 16px -4px rgb(0 0 0 / 0.06)',
        'inner-soft': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
      },
      
      // Screen breakpoints
      screens: {
        '2xsmall': '320px',
        'xsmall': '512px',
        'small': '1024px',
        'medium': '1280px',
        'large': '1440px',
        'xlarge': '1680px',
        '2xlarge': '1920px',
      },
      
      // Transitions
      transitionProperty: {
        'width': 'width, margin',
        'height': 'height',
        'bg': 'background-color',
        'display': 'display, opacity',
        'visibility': 'visibility',
        'padding': 'padding-top, padding-right, padding-bottom, padding-left',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      
      // Keyframes & Animations
      keyframes: {
        // Existing animations
        ring: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-top': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out-top': {
          '0%': { height: '100%' },
          '99%': { height: '0' },
          '100%': { visibility: 'hidden' },
        },
        'accordion-slide-up': {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        'accordion-slide-down': {
          '0%': { 'min-height': '0', 'max-height': '0', opacity: '0' },
          '100%': { 'min-height': 'var(--radix-accordion-content-height)', 'max-height': 'none', opacity: '1' },
        },
        enter: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        leave: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.9)', opacity: 0 },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // New luxury animations
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'underline-grow': {
          '0%': { width: '0%', left: '50%' },
          '100%': { width: '100%', left: '0%' },
        },
      },
      
      animation: {
        // Existing
        'ring': 'ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        'fade-in-right': 'fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'fade-in-top': 'fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'fade-out-top': 'fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'accordion-open': 'accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards',
        'accordion-close': 'accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards',
        'enter': 'enter 200ms ease-out',
        'slide-in': 'slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)',
        'leave': 'leave 150ms ease-in forwards',
        // New luxury animations
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-fast': 'fade-in 0.2s ease-out forwards',
        'fade-in-slow': 'fade-in 0.8s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-up-fast': 'fade-in-up 0.3s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      
      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },
      
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // Aspect ratios
      aspectRatio: {
        'product': '3 / 4',
        'product-wide': '4 / 3',
        'hero': '16 / 9',
        'square': '1 / 1',
      },
    },
  },
  plugins: [
    require("tailwindcss-radix")(),
    // Custom plugin for luxury utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities
      addUtilities({
        // Text utilities
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        // Scrollbar utilities
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme('colors.stone.100'),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.stone.300'),
            borderRadius: '3px',
            '&:hover': {
              background: theme('colors.stone.400'),
            },
          },
        },
        // Hover lift effect
        '.hover-lift': {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.hover-lift'),
          },
        },
        // Image zoom on hover
        '.img-zoom': {
          overflow: 'hidden',
          '& img': {
            transition: 'transform 0.5s ease',
          },
          '&:hover img': {
            transform: 'scale(1.05)',
          },
        },
        // Underline animation
        '.underline-animation': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-2px',
            left: '0',
            width: '0',
            height: '1px',
            backgroundColor: 'currentColor',
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: '100%',
          },
        },
        // Glass effect
        '.glass': {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
      })
      
      // Custom components
      addComponents({
        // Content container
        '.content-container': {
          maxWidth: theme('maxWidth.content'),
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.6'),
          paddingRight: theme('spacing.6'),
          '@screen medium': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
        // Section padding
        '.section-padding': {
          paddingTop: 'clamp(3rem, 8vw, 6rem)',
          paddingBottom: 'clamp(3rem, 8vw, 6rem)',
        },
        // Button base styles
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease',
          borderRadius: theme('borderRadius.lg'),
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${theme('colors.stone.200')}`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.stone.800'),
          color: theme('colors.white'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.stone.700'),
          },
          '&:active:not(:disabled)': {
            backgroundColor: theme('colors.stone.900'),
          },
        },
        '.btn-secondary': {
          backgroundColor: 'transparent',
          color: theme('colors.stone.800'),
          border: `1px solid ${theme('colors.stone.300')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.stone.50'),
            borderColor: theme('colors.stone.400'),
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.stone.600'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.stone.100'),
            color: theme('colors.stone.800'),
          },
        },
        // Card styles
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.2xl'),
          boxShadow: theme('boxShadow.card'),
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover'),
          },
        },
        // Input styles
        '.input': {
          width: '100%',
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.stone.300')}`,
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.base')[0],
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.stone.800'),
            boxShadow: `0 0 0 3px ${theme('colors.stone.100')}`,
          },
          '&:disabled': {
            backgroundColor: theme('colors.stone.100'),
            cursor: 'not-allowed',
          },
          '&::placeholder': {
            color: theme('colors.stone.400'),
          },
        },
        // Badge styles
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: theme('borderRadius.full'),
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
          fontSize: theme('fontSize.xs')[0],
          fontWeight: theme('fontWeight.medium'),
        },
        '.badge-primary': {
          backgroundColor: theme('colors.stone.800'),
          color: theme('colors.white'),
        },
        '.badge-secondary': {
          backgroundColor: theme('colors.stone.100'),
          color: theme('colors.stone.700'),
        },
        '.badge-success': {
          backgroundColor: theme('colors.success.light'),
          color: theme('colors.success.dark'),
        },
        '.badge-error': {
          backgroundColor: theme('colors.error.light'),
          color: theme('colors.error.dark'),
        },
      })
    },
  ],
}
