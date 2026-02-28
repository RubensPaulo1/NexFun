import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // NexFan Design System Colors
      colors: {
        // Primary
        'nex-blue': '#3366FF',
        'deep-navy': '#0A0D1A',
        
        // Neutrals
        'soft-gray': '#F5F7FA',
        'mid-gray': '#D0D4DC',
        'graphite': '#2B2F36',
        
        // Accents
        'aqua-neon': '#00E0D6',
        'purple-glow': '#7A5CFF',
        
        // Semantic
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#3366FF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#2B2F36',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F7FA',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#00E0D6',
          foreground: '#0A0D1A',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#0A0D1A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0A0D1A',
        },
      },
      // NexFan Typography
      fontFamily: {
        headline: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.1', fontWeight: '600' }],
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', fontWeight: '500' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      // Shadows
      boxShadow: {
        'nex-sm': '0 1px 2px 0 rgba(10, 13, 26, 0.05)',
        'nex-md': '0 4px 6px -1px rgba(10, 13, 26, 0.07), 0 2px 4px -2px rgba(10, 13, 26, 0.05)',
        'nex-lg': '0 10px 15px -3px rgba(10, 13, 26, 0.08), 0 4px 6px -4px rgba(10, 13, 26, 0.05)',
        'nex-xl': '0 20px 25px -5px rgba(10, 13, 26, 0.1), 0 8px 10px -6px rgba(10, 13, 26, 0.05)',
        'nex-glow': '0 0 20px rgba(51, 102, 255, 0.3)',
        'nex-glow-lg': '0 0 40px rgba(51, 102, 255, 0.4)',
      },
      // Border Radius
      borderRadius: {
        'nex': '0.75rem',
        'nex-lg': '1rem',
        'nex-xl': '1.5rem',
      },
      // Animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(51, 102, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(51, 102, 255, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      // Gradients via backgroundImage
      backgroundImage: {
        'nex-gradient': 'linear-gradient(135deg, #3366FF 0%, #7A5CFF 100%)',
        'nex-gradient-dark': 'linear-gradient(135deg, #0A0D1A 0%, #2B2F36 100%)',
        'nex-gradient-glow': 'linear-gradient(135deg, rgba(51, 102, 255, 0.1) 0%, rgba(122, 92, 255, 0.1) 100%)',
        'nex-mesh': 'radial-gradient(at 40% 20%, rgba(51, 102, 255, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(122, 92, 255, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 224, 214, 0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}

export default config

