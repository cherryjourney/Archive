import { ConfigProvider, theme as antTheme, message } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { router } from '@/router';
import antdTheme from '@/assets/styles/theme';
import { useTheme } from '@/hooks/useTheme';

// Global toast configuration
message.config({
  top: 24,
  duration: 3,
  maxCount: 3,
});

export default function App() {
  const { resolved } = useTheme();

  return (
    <ConfigProvider
      theme={{
        ...antdTheme,
        algorithm: resolved === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
      locale={zhCN}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
