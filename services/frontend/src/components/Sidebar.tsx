import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  HelpCircle,
  Plus,
  Languages,
  Sun,
  Moon,
  Bot,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { useThemeStore } from '../store/themeStore'
import { translations } from '../i18n'

const navItems = [
  { key: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_overview' as const },
  { key: '/sets', icon: BookOpen, labelKey: 'nav_library' as const },
  { key: '/analytics', icon: BarChart2, labelKey: 'nav_analytics' as const },
]

export const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const { language, toggle: toggleLang } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const t = translations[language]

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
        {/* Language toggle */}
        <button className="sidebar-lang-toggle" onClick={toggleLang}>
          <Languages size={13} />
          <span className="lang-badge">{language.toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {language === 'en' ? 'Switch to VI' : 'Chuyển EN'}
          </span>
        </button>

        {/* Theme toggle */}
        <button className="sidebar-lang-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 600 }}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>

        <div className="sidebar-divider" style={{ margin: '8px 0' }} />

        <button className="sidebar-nav-item" style={{ cursor: 'pointer' }}>
          <HelpCircle size={16} />
          {t.nav_helpCenter}
        </button>
      </div>
    </aside>
  )
}
