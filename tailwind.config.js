/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':       '#080b10',
        'bg-surface':    '#0d1117',
        'bg-elevated':   '#161b24',
        'bg-card':       '#1a2030',
        'bg-input':      '#111620',
        'border-subtle': '#1e2a3a',
        'border-default':'#243040',
        'border-accent': '#2e4060',
        'txt-primary':   '#e8edf5',
        'txt-secondary': '#7a8fa8',
        'txt-muted':     '#3d5068',
        'accent-cyan':   '#00d4ff',
        'accent-green':  '#00ff9d',
        'accent-amber':  '#ffb800',
        'accent-red':    '#ff4560',
        'accent-purple': '#a855f7',
        'accent-blue':   '#3b82f6',
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '22px',
      },
      animation: {
        'fade-up':       'fadeUp 0.5s ease both',
        'pop-in':        'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'spin-slow':     'spin 2s linear infinite',
        'pulse-glow':    'pulseGlow 2s ease infinite',
        'blink':         'blink 1s step-end infinite',
        'scan-line':     'scanLine 3s linear infinite',
        'gradient-shift':'gradientShift 4s ease infinite',
        'border-pulse':  'borderPulse 3s ease infinite',
      },
    },
  },
  plugins: [],
};