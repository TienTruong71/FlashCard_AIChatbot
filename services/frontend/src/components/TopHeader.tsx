import { useEffect, useRef, useState } from 'react'
import { Badge } from 'antd'
import { useLocation, Link } from 'react-router-dom'
import { Bell, Plus, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { notificationApi } from '../api'
import { useLanguageStore } from '../store/languageStore'
import { useBreadcrumbStore } from '../store/breadcrumbStore'
import { translations } from '../i18n'
import { NotificationPanel } from './NotificationPanel'
import { ProfileDropdown } from './ProfileDropdown'

export const TopHeader = () => {
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const location = useLocation()
  const t = translations[language]
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const bellRef = useRef<HTMLButtonElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Initial load + polling every 30s
  useEffect(() => {
    const fetchCount = () => {
      notificationApi.unreadCount()
        .then(res => setUnreadCount(res.data?.data || 0))
        .catch(() => { })
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
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
    tests: t.test_breadcrumb,
    profile: t.profile_title,
  }

  const { titles } = useBreadcrumbStore()

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

          let label = breadcrumbMap[value] || titles[value] || (value.length > 10 ? 'Detail' : value)

          if (to === '/quizzes') {
            to = '/sets?tab=quizzes'
          }

          // Skip 'tests' breadcrumb segment - /tests has no page
          if (value === 'tests') return null

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

        {/* Bell — Notification */}
        <div style={{ position: 'relative' }}>
          <Badge count={unreadCount} size="small" color="#3d39cc">
            <button
              ref={bellRef}
              className={`icon-btn${notifOpen ? ' active' : ''}`}
              onClick={() => {
                setNotifOpen(prev => !prev)
                setProfileOpen(false)
              }}
              title={t.notif_title}
            >
              <Bell size={17} />
            </button>
          </Badge>
          <NotificationPanel
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            onUnreadCountChange={setUnreadCount}
            anchorRef={bellRef as React.RefObject<HTMLElement>}
          />
        </div>

        {/* Avatar — Profile */}
        <div style={{ position: 'relative' }}>
          <div
            ref={avatarRef}
            className={`user-avatar${profileOpen ? ' active' : ''}`}
            title={`${user?.first_name} ${user?.last_name}`}
            onClick={() => {
              setProfileOpen(prev => !prev)
              setNotifOpen(false)
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : initials}
          </div>
          <ProfileDropdown
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            anchorRef={avatarRef as React.RefObject<HTMLElement>}
          />
        </div>
      </div>
    </header>
  )
}
