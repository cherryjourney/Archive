/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  corePlugins: {
    preflight: false, // 关闭 Tailwind 的全局 reset，避免覆盖 Ant Design 样式
  },
  theme: {
    extend: {
      colors: {
        // Indigo Study — 学术主题色系
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',  // 浅色强调
          500: '#6366F1',  // 主色
          600: '#4F46E5',  // Hover/Press
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        accent: {
          400: '#FBBF24',
          500: '#F59E0B',  // 暖琥珀强调
          600: '#D97706',
        },
        surface: {
          // Light mode
          light: {
            page:   '#F5F3FF',
            card:   '#FFFFFF',
            glass:  'rgba(255,255,255,0.65)',
            hover:  '#F8F7FF',
            muted:  '#F1F0FB',
          },
          // Dark mode
          dark: {
            page:   '#0B0E14',
            card:   '#151823',
            glass:  'rgba(21,24,35,0.72)',
            hover:  '#1C2030',
            muted:  '#141724',
          },
        },
      },
      borderRadius: {
        notion: '8px',
        card:   '14px',
        modal:  '20px',
        full:   '9999px',
      },
      boxShadow: {
        'card-sm':  '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card':     '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-lg':  '0 4px 24px rgba(0,0,0,0.07), 0 8px 32px rgba(0,0,0,0.04)',
        'glow-sm':  '0 0 16px rgba(99,102,241,0.12)',
        'glow':     '0 0 24px rgba(99,102,241,0.18)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.22)',
        // Dark mode shadows
        'dark-sm':  '0 1px 2px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.15)',
        'dark':     '0 1px 3px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.20)',
        'dark-lg':  '0 4px 24px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.25)',
      },
      fontFamily: {
        sans: [
          'Atkinson Hyperlegible',
          'Microsoft YaHei',
          'PingFang SC',
          'Noto Sans SC',
          'sans-serif',
        ],
        heading: [
          'Crimson Pro',
          'Noto Serif SC',
          'Microsoft YaHei',
          'serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        'xs':  ['12px', { lineHeight: '18px' }],
        'sm':  ['13px', { lineHeight: '20px' }],
        'md':  ['14px', { lineHeight: '22px' }],
        'lg':  ['16px', { lineHeight: '24px' }],
        'xl':  ['18px', { lineHeight: '28px' }],
        '2xl': ['22px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '38px' }],
        '4xl': ['34px', { lineHeight: '44px' }],
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'in':     'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },
  plugins: [],
};
