module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic System
        void: 'var(--bg-app)',
        'void-darker': 'var(--bg-surface)',
        
        // Text
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        
        glass: {
          border: 'var(--border-base)',
          bg: 'var(--bg-card)',
          hover: 'var(--bg-card-hover)',
        },
        
        neon: {
          cyan: 'var(--accent-primary)',
          green: 'var(--status-success)',
          amber: 'var(--accent-secondary)',
          red: 'var(--status-error)', 
          teal: 'var(--status-info)',
        },

        // Trading Mode Colors
        paper: {
          bg: 'rgba(var(--trading-paper), 0.1)', // Requires RGB vars if using opacity, falling back to simple for now or assuming defined vars don't need opacity here if not used
          accent: 'var(--trading-paper)',
          border: 'rgba(255, 183, 77, 0.2)', // Keeping static for now or need RGB decomposition
          glow: 'var(--accent-glow)',
        },
        live: {
          bg: 'rgba(var(--trading-live), 0.1)',
          accent: 'var(--trading-live)',
          border: 'rgba(230, 81, 0, 0.3)',
          warning: 'var(--status-error)',
          glow: 'var(--accent-glow)',
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'rainbow-border': 'rainbow-border 3s linear infinite',
        'particle-burst': 'particle-burst 0.6s ease-out forwards',
        'ripple-wave': 'ripple-wave 0.6s ease-out forwards',
        'widget-flip': 'widget-flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'widget-flip-delayed': 'widget-flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards',
        'widget-pop': 'widget-scale-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'radial-expand': 'radial-expand 0.5s ease-out forwards',
        'scan-line': 'scan-line 0.4s ease-out forwards',
        'float-particle': 'float-particle 8s ease-in-out infinite',
        'icon-bounce': 'icon-bounce 0.4s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,183,77,0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255,183,77,0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        logo: ['ExcaliburNouveau', '0210', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
