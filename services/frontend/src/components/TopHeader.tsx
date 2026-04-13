import { useEffect, useState } from 'react'
import { Badge } from 'antd'
import { useLocation, Link } from 'react-router-dom'
import { Bell, Settings, Plus, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { notificationApi } from '../api'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'

export const TopHeader = () => {
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const location = useLocation()
  const t = translations[language]
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    notificationApi.unreadCount()
      .then(res => setUnreadCount(res.data?.data || 0))
      .catch(() => { })
  }, [])

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U'

  // Breadcrumb logic
  const pathnames = location.pathname.split('/').filter(x => x)
  const breadcrumbMap: Record<string, string> = {
    dashboard: t.nav_overview,
    sets: t.nav_library,
    quizzes: t.config_quizzes,
    analytics: t.nav_analytics,
    tests: t.test_breadcrumb
  }

  return (
    <header className="top-header">
      {/* Breadcrumbs */}
      <div className="breadcrumb-nav">
        <Link to="/dashboard" className="breadcrumb-item">
          QT
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1
          let to = `/${pathnames.slice(0, index + 1).join('/')}`
          const label = breadcrumbMap[value] || (value.length > 10 ? 'Detail' : value)
          
          if (to === '/quizzes') {
            to = '/sets?tab=quizzes'
          }

          return (
            <div key={to} style={{ display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={14} className="breadcrumb-separator" />
              {last ? (
                <span className="breadcrumb-item active">{label}</span>
              ) : (
                <Link to={to} className="breadcrumb-item">
                  {label}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="top-header-actions">
        <Link to="/sets?create=true" className="quick-add-btn" title={t.nav_createNewSet}>
          <Plus size={16} />
        </Link>

        <Badge count={unreadCount} size="small" color="#3d39cc">
          <button className="icon-btn">
            <Bell size={17} />
          </button>
        </Badge>
        <button className="icon-btn">
          <Settings size={17} />
        </button>
        <div className="user-avatar" title={`${user?.first_name} ${user?.last_name}`}>
          {initials}
        </div>
      </div>
    </header>
  )
}
