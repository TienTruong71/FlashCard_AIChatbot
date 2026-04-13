import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import './App.css'

import { Sidebar } from './components/Sidebar'
import { TopHeader } from './components/TopHeader'
import { ProtectedRoute } from './components/ProtectedRoute'

import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SetsPage } from './pages/SetsPage'
import { SetDetailPage } from './pages/SetDetailPage'
import { QuizDetailPage } from './pages/QuizDetailPage'
import { TestPage } from './pages/TestPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

import { useLayoutStore } from './store/layoutStore'

const MainLayout = () => {
  const { fullScreen } = useLayoutStore()

  return (
    <div className={`app-shell${fullScreen ? ' full-screen' : ''}`}>
      <Sidebar />
      <div className="main-area">
        <TopHeader />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3d39cc',
          colorBgContainer: '#ffffff',
          borderRadius: 8,
          fontFamily: "'Inter', system-ui, sans-serif",
          colorText: '#1e1e2d',
          colorTextSecondary: '#6c6c89',
          colorBorder: '#e5e5ec',
          colorBgLayout: '#f8f8fc',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sets" element={<SetsPage />} />
              <Route path="/sets/:id" element={<SetDetailPage />} />
              <Route path="/quizzes/:id" element={<QuizDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/tests/:id" element={<TestPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
