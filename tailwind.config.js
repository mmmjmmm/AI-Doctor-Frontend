/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0FCEA3', // 主色
        'primary-pressed': '#0BB691',
        'primary-weak': '#E8FBF5',
        'bg-page': '#F5F5F7', // 页面背景
        'bg-card': '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        border: '#E5E7EB',
        danger: '#EF4444',
      },
      borderRadius: {
        card: '16px', // 卡片圆角
        bubble: '12px', // 气泡圆角
        sheet: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', // 卡片阴影
        float: '0 4px 16px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
