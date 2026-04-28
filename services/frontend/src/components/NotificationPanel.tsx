import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck, BookOpen, FileQuestion, Share2 } from 'lucide-react'
import { notificationApi } from '../api'
import type { Notification } from '../types'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange: (count: number) => void
  anchorRef: React.RefObject<HTMLElement>
}

const getRelativeTime = (dateStr: string, language: 'en' | 'vi') => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (language === 'vi') {
    if (seconds < 60) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }
  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const getNotifIcon = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('set')) return <BookOpen size={14} />
  if (t.includes('quiz')) return <FileQuestion size={14} />
  return <Share2 size={14} />
}

const getNotifColor = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('set')) return '#7c3aed'
  if (t.includes('quiz')) return '#3d39cc'
  return '#16a34a'
}

export const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange, anchorRef }: NotificationPanelProps) => {
  const { language } = useLanguageStore()
  const t = translations[language]
  const panelRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = async (p = 1) => {
    setLoading(true)
    try {
      const res = await notificationApi.list({ page: p, page_size: 10 })
      const data = res.data
      if (p === 1) {
        setNotifications(data.data || [])
      } else {
        setNotifications(prev => [...prev, ...(data.data || [])])
      }
      setHasMore(!!data.pagination?.next_page)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      setPage(1)
      fetchNotifications(1)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose, anchorRef])

  const handleMarkAsRead = async (notif: Notification) => {
    if (notif.is_read) return
    try {
      await notificationApi.markAsRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      onUnreadCountChange(Math.max(0, notifications.filter(n => !n.is_read).length - 1))
    } catch (_) {}
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onUnreadCountChange(0)
    } catch (_) {}
    setMarkingAll(false)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchNotifications(next)
  }

  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="notif-panel" ref={panelRef}>
      {/* Header */}
      <div className="notif-panel-header">
        <div className="notif-panel-title">
          <Bell size={15} />
          {t.notif_title}
          {unreadCount > 0 && (
            <span className="notif-count-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="notif-mark-all-btn"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={13} />
            {t.notif_markAllRead}
          </button>
        )}
      </div>

      {/* List */}
      <div className="notif-list">
        {loading && notifications.length === 0 ? (
          <div className="notif-loading">
            <div className="notif-spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={28} strokeWidth={1.5} />
            </div>
            <div className="notif-empty-text">{t.notif_empty}</div>
            <div className="notif-empty-desc">{t.notif_emptyDesc}</div>
          </div>
        ) : (
          <>
            {notifications.map(notif => {
              const iconColor = getNotifColor(notif.title)
              return (
                <div
                  key={notif.id}
                  className={`notif-item${notif.is_read ? '' : ' unread'}`}
                  onClick={() => handleMarkAsRead(notif)}
                >
                  <div className="notif-item-icon" style={{ background: `${iconColor}18`, color: iconColor }}>
                    {getNotifIcon(notif.title)}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{notif.title}</div>
                    <div className="notif-item-msg">{notif.message}</div>
                    <div className="notif-item-time">{getRelativeTime(notif.created_at, language)}</div>
                  </div>
                  <div className="notif-item-right">
                    {!notif.is_read && <span className="notif-dot" />}
                    {notif.is_read && <Check size={12} className="notif-read-check" />}
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <button className="notif-load-more" onClick={loadMore} disabled={loading}>
                {loading ? '...' : t.notif_loadMore}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
