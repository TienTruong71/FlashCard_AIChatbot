import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'
import { ConfigProvider, theme } from 'antd'
import { themeConfig } from './styles/theme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        ...themeConfig,
        algorithm: theme.darkAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
