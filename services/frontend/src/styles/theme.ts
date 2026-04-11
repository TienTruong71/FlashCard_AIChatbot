import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#722ed1',
    colorInfo: '#722ed1',
    borderRadius: 8,
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorTextBase: '#ffffff',
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Button: {
      borderRadius: 24,
      controlHeight: 40,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: 'rgba(20, 20, 20, 0.7)',
    },
  },
};
