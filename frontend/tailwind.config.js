// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#0F172A',
        accent: '#2563EB',
        danger: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
        slate: {
          150: '#eef1f5',
          250: '#d5dbe4',
          350: '#b4bcc9',
          355: '#cbd3e0',
          450: '#8b95a6',
          455: '#838d9e',
          505: '#64748b',
          550: '#5c6a7d',
          650: '#475569',
          655: '#4b5563',
          750: '#334155',
          755: '#374151',
          850: '#1e293b',
          855: '#1f2937',
        },
        emerald: {
          150: '#d4f5e4',
          250: '#a7f0d0',
          750: '#047857',
          850: '#065f46',
        },
        rose: {
          250: '#fecdd3',
          550: '#f43f5e',
          850: '#9f1239',
        },
        red: {
          650: '#dc2626',
          750: '#b91c1c',
        },
        amber: {
          150: '#fef3c7',
          250: '#fde68a',
          655: '#d97706',
          750: '#b45309',
        },
        indigo: {
          150: '#e0e7ff',
          550: '#6366f1',
          655: '#4f46e5',
          750: '#4338ca',
        },
        orange: {
          255: '#fdba74',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      transitionDuration: {
        '350': '350ms',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
