/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monad Brand Colors
        'monad-off-white': '#fbfaf9',
        'monad-purple': '#836ef9',
        'monad-blue': '#200052',
        'monad-berry': '#a0055d',
        'monad-black': '#0e100f',
        'monad-white': '#ffffff',
        
        // DeFi specific colors
        'success-green': '#10b981',
        'warning-yellow': '#f59e0b',
        'error-red': '#ef4444',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-monad': 'linear-gradient(135deg, #836EF9 0%, #A0055D 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-main': 'linear-gradient(135deg, #200052 0%, #0E100F 50%, #1a0040 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow-purple': 'glow-purple 2s ease-in-out infinite',
        'glow-berry': 'glow-berry 2s ease-in-out infinite',
        'glow-success': 'glow-success 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-success': 'pulse-success 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow-purple': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(131, 110, 249, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(131, 110, 249, 0.6), 0 0 30px rgba(131, 110, 249, 0.4)' },
        },
        'glow-berry': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(160, 5, 93, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(160, 5, 93, 0.6), 0 0 30px rgba(160, 5, 93, 0.4)' },
        },
        'glow-success': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        'pulse-success': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}