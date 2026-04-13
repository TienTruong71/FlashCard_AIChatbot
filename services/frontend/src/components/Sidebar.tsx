import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart2,
  HelpCircle,
  LogOut,
  Plus,
  Languages,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'

const navItems = [
  { key: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' as const },
  { key: '/sets', icon: BookOpen, labelKey: 'nav_library' as const },
  { key: '/quizzes', icon: Sparkles, labelKey: 'nav_aiGenerator' as const },
  { key: '/analytics', icon: BarChart2, labelKey: 'nav_analytics' as const },
]

export const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const { language, toggle } = useLanguageStore()
  const t = translations[language]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (key: string) => {
    if (key === '/sets') return location.pathname.startsWith('/sets')
    if (key === '/quizzes') return location.pathname.startsWith('/quizzes') && !location.pathname.startsWith('/sets')
    return location.pathname === key || location.pathname.startsWith(key + '/')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">QT</div>
        <span className="sidebar-logo-text">QuizTT</span>
      </div>
      <div className="sidebar-mode">
        {user?.first_name || t.nav_learningHub}
        <br />
        <span style={{ opacity: 0.7 }}>{t.nav_deepWorkMode}</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ key, icon: Icon, labelKey }) => (
          <Link
            key={key}
            to={key}
            className={`sidebar-nav-item${isActive(key) ? ' active' : ''}`}
          >
            <Icon size={16} strokeWidth={2} />
            {t[labelKey]}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {/* Create New Set */}
        <Link to="/sets" className="sidebar-create-btn">
          <Plus size={14} />
          {t.nav_createNewSet}
        </Link>

        {/* Language toggle */}
        <button className="sidebar-lang-toggle" onClick={toggle}>
          <Languages size={13} />
          <span className="lang-badge">{language.toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {language === 'en' ? 'Switch to VI' : 'Chuyển EN'}
          </span>
        </button>

        <div className="sidebar-divider" style={{ margin: '8px 0' }} />

        <button className="sidebar-nav-item" style={{ cursor: 'pointer' }}>
          <HelpCircle size={16} />
          {t.nav_helpCenter}
        </button>

        <button
          className="sidebar-nav-item"
          style={{ color: 'var(--danger)' }}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          {t.nav_signOut}
        </button>
      </div>
    </aside>
  )
}
