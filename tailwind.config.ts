import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        solaire: ['WT Solaire Display Light', 'Playfair Display', 'Georgia', 'serif'],
        roos: ['Roos Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        text: '#1a1a1a',
        'text-mid': '#4a4a4a',
        'text-dim': '#555555',
        border: 'rgba(0,0,0,0.1)',
        'border-s': 'rgba(0,0,0,0.15)',
        glass: 'rgba(255,255,255,0.45)',
        'glass-s': 'rgba(255,255,255,0.7)',
      },
      maxWidth: {
        'content': '860px',
        'prose': '520px',
      },
      backdropBlur: {
        'glass': '40px',
      },
    },
  },
  plugins: [],
}

export default config
