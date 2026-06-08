export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tdp: {
          yellow: '#FFD700',
          gold: '#F5A623',
          red: '#CC0000',
          navy: '#1a1a2e',
          green: '#228B22'
        }
      },
      fontFamily: {
        telugu: ['Noto Sans Telugu', 'Mandali', 'sans-serif'],
        display: ['Tiro Devanagari Hindi', 'Playfair Display', 'serif'],
        body: ['Hind', 'Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
