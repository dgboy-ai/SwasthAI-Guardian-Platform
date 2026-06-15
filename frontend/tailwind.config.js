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
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
