import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, RefreshCw, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'

interface ProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

export const ProfileDropdown = ({ isOpen, onClose, anchorRef }: ProfileDropdownProps) => {
  const navigate = useNavigate()
  const { user, logout, clearAuth } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose, anchorRef])

  const handleProfile = () => {
    onClose()
    navigate('/profile')
  }

  const handleSwitchAccount = () => {
    onClose()
    clearAuth()
    navigate('/login')
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/')
  }

  if (!isOpen) return null

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <div className="profile-dropdown" ref={dropRef}>
      <div className="profile-dropdown-header">
        <div className="profile-dropdown-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : initials}
        </div>
        <div className="profile-dropdown-info">
          <div className="profile-dropdown-name">{fullName}</div>
          <div className="profile-dropdown-email">{user?.email}</div>
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-menu">
        <button className="profile-menu-item" onClick={handleProfile}>
          <div className="profile-menu-item-icon" style={{ background: 'rgba(61, 57, 204, 0.1)', color: '#3d39cc' }}>
            <User size={13} />
          </div>
          {t.profile_viewProfile}
        </button>

        <button className="profile-menu-item" onClick={handleSwitchAccount}>
          <div className="profile-menu-item-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
            <RefreshCw size={13} />
          </div>
          {t.profile_switchAccount}
        </button>
      </div>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-menu">
        <button className="profile-menu-item danger" onClick={handleLogout}>
          <div className="profile-menu-item-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <LogOut size={13} />
          </div>
          {t.profile_logout}
        </button>
      </div>
    </div>
  )
}
