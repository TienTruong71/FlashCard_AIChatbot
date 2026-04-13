import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { Sparkles, ArrowRight, Mail, Lock, EyeOff, Eye } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { useThemeStore } from '../store/themeStore'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { language } = useLanguageStore()
  const { theme } = useThemeStore()
  const t = translations[language]
  const navigate = useNavigate()

  const isDark = theme === 'dark'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      message.success(t.auth_loginSuccess)
      navigate('/dashboard')
    } catch (error: any) {
      message.error(error.response?.data?.detail || t.common_error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? '#0b0914' : '#f8f8fc',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font)'
    }}>
      {/* Decorative premium orb layout syncing with light mode landing page */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)' : 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
        top: -100, left: -100, zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, transparent 70%)' : 'radial-gradient(circle at center, rgba(56,189,248,0.1) 0%, transparent 70%)',
        bottom: -200, right: -200, zIndex: 0
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
        background: isDark ? 'rgba(19, 17, 28, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
        borderRadius: 24, padding: 40,
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(168,85,247,0.3)'
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: isDark ? '#ffffff' : '#121221', letterSpacing: -0.5, marginBottom: 8 }}>
            {t.auth_welcomeBack}
          </h1>
          <p style={{ color: isDark ? '#a1a1aa' : '#71717a', fontSize: 15 }}>
            {language === 'en' ? 'Log in to continue your learning journey' : 'Đăng nhập để tiếp tục hành trình học tập'}
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#a1a1aa" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 42, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder={t.auth_email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#a1a1aa" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <Eye size={18} color="#a1a1aa" /> : <EyeOff size={18} color="#a1a1aa" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              height: 48, marginTop: 8, fontSize: 16,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none', boxShadow: '0 4px 15px rgba(168,85,247,0.3)'
            }}
          >
            {loading ? '...' : t.auth_signIn} <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: isDark ? '#a1a1aa' : '#71717a' }}>
          {t.auth_noAccount}{' '}
          <Link to="/register" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>
            {t.auth_register}
          </Link>
        </p>
      </div>
    </div>
  )
}
