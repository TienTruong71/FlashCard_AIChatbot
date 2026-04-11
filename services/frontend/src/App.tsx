import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'

// Components
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SetsPage } from './pages/SetsPage'
import { SetDetailPage } from './pages/SetDetailPage'
import { QuizDetailPage } from './pages/QuizDetailPage'
import { TestPage } from './pages/TestPage'

const { Content } = Layout

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <Content style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sets" element={<SetsPage />} />
              <Route path="/sets/:id" element={<SetDetailPage />} />
              <Route path="/quizzes/:id" element={<QuizDetailPage />} />
              <Route path="/tests/:id" element={<TestPage />} />
            </Route>
          </Routes>
        </Content>
      </Layout>
    </Router>
  )
}

export default App
