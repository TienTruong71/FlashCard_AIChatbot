import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal, Input, Select, Space, message } from 'antd'
import { setApi, testApi, quizApi } from '../api'
import type { Set, Quiz, Test } from '../types'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import {
  BookOpen, Code2, Globe, Share2, Plus,
  CheckCircle2, Play, Clock, TrendingUp,
  Upload, Zap,
} from 'lucide-react'

const SET_ICONS = [BookOpen, Code2, Globe]
const SET_ICON_COLORS = ['#3d39cc', '#0ea5e9', '#a855f7']

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]

  const [sets, setSets] = useState<Set[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  // Share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareItem, setShareItem] = useState<Set | Quiz | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [setsRes, testsRes, quizzesRes] = await Promise.all([
          setApi.list({ page_size: 6 }),
          testApi.list({ page_size: 5 }),
          quizApi.list({ page_size: 3 }),
        ])
        setSets(setsRes.data?.data || [])
        setTests(testsRes.data?.data || [])
        setQuizzes(quizzesRes.data?.data || [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const completedTests = tests.filter(t => t.score !== null && t.score !== undefined)
  const weeklyScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((a, b) => a + (b.score || 0), 0) / completedTests.length)
    : 0

  const formatTestStatus = (test: Test) => {
    if (test.score !== null && test.score !== undefined) return { label: t.dash_completed, color: '#16a34a', icon: CheckCircle2 }
    return { label: t.dash_inProgress, color: '#d97706', icon: Play }
  }

  const hourOfDay = new Date().getHours()
  const greeting = hourOfDay < 12 ? 'Good morning' : hourOfDay < 18 ? 'Good afternoon' : 'Good evening'

  const handleShare = async () => {
    if (!shareItem || !shareEmail) return
    setSharing(true)
    try {

      const payload = { shares: [{ email: shareEmail, permission: sharePermission }] }
      if ('description' in shareItem || !('is_published' in shareItem)) {
        await setApi.share(shareItem.id, payload)
      } else {
        await quizApi.share(shareItem.id, payload)
      }
      message.success(t.common_success)
      setIsShareModalOpen(false)
      setShareEmail('')
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div>
      {/* Welcome */}
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
        {t.dash_welcomeBack}, {user?.first_name?.toUpperCase() || 'USER'}
      </p>
      <h1 className="page-title" style={{ marginBottom: 28 }}>
        {greeting}! {t.dash_readyForDeepWork.replace('Ready for deep work?', '').replace('Sẵn sàng học sâu chưa?', '') || t.dash_readyForDeepWork}
      </h1>

      {/* Top row: Hero + Weekly Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 28 }}>
        {/* Hero card */}
        <div className="hero-card">
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '55%' }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                padding: '3px 10px', borderRadius: 20, display: 'inline-flex',
                alignItems: 'center', gap: 5, marginBottom: 14,
              }}
            >
              <Zap size={10} /> {t.dash_newAiCapabilities}
            </span>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 12, letterSpacing: -0.3 }}>
              {t.dash_heroTitle}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              {t.dash_heroDesc}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/sets" className="btn btn-primary btn-sm" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', gap: 6 }}>
                <Upload size={13} /> {t.dash_aiUpload}
              </Link>
              <Link to="/sets" className="btn btn-outline btn-sm" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.4)', color: 'white' }}>
                {t.dash_learnMore}
              </Link>
            </div>
          </div>
          {/* Abstract 3D visual placeholder */}
          <div style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            width: 160, height: 160, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(124,58,237,0.6), rgba(61,57,204,0.3) 60%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, rgba(192,132,252,0.4), rgba(99,102,241,0.2))',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)',
              transform: 'rotate(15deg)',
            }} />
          </div>
        </div>

        {/* Weekly Progress card */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'var(--success-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--success)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: 20 }}>
              +{weeklyScore}đ
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {t.dash_weeklyProgress}
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1, lineHeight: 1 }}>
            {completedTests.length * 10 + sets.length * 5}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
            {t.dash_questionsMastered}
          </p>
          <div className="progress-bar">
            <div className="progress-fill green" style={{ width: `${Math.min(weeklyScore, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* My Sets */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">{t.dash_mySets}</span>
          <Link to="/sets" className="section-link">{t.dash_viewAll}</Link>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.common_loading}</div>
        ) : sets.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BookOpen size={32} style={{ marginBottom: 12, color: 'var(--text-muted)' }} />
            <p>{t.dash_noSets}</p>
            <Link to="/sets" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', marginTop: 12, gap: 6 }}>
              <Plus size={13} /> {t.dash_createSet}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {sets.slice(0, 3).map((set, i) => {
              const Icon = SET_ICONS[i % SET_ICONS.length]
              const iconColor = SET_ICON_COLORS[i % SET_ICON_COLORS.length]
              return (
                <Link key={set.id} to={`/sets/${set.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="set-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div className="set-card-icon" style={{ background: `${iconColor}15` }}>
                        <Icon size={18} color={iconColor} />
                      </div>
                      <span className={`badge ${set.is_public ? 'badge-public' : 'badge-private'}`}>
                        {set.is_public ? t.lib_public : t.lib_private}
                      </span>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>
                      {set.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5, minHeight: 32 }}>
                      {set.description ? set.description.slice(0, 60) + (set.description.length > 60 ? '...' : '') : t.lib_noDescription}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={12} /> {set.question_count || 0} {t.dash_questionsCount}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShareItem(set)
                          setIsShareModalOpen(true)
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom row: Recent Quizzes + Learning Tip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Recent Quizzes */}
        <div className="card" style={{ padding: 22 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>{t.dash_recentQuizzes}</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.common_loading}</p>
          ) : quizzes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.dash_noQuizzes}</p>
          ) : (
            quizzes.map((quiz) => {
              const relatedTest = tests.find(t => t.quiz === quiz.id)
              const score = relatedTest?.score
              const status = relatedTest ? formatTestStatus(relatedTest) : null
              const StatusIcon = status?.icon || Clock
              return (
                <Link key={quiz.id} to={`/quizzes/${quiz.id}`} style={{ textDecoration: 'none' }}>
                  <div className="quiz-row">
                    <div className="quiz-icon" style={{ background: score !== null && score !== undefined ? 'var(--success-bg)' : 'var(--primary-light)' }}>
                      <StatusIcon size={16} color={status?.color || 'var(--primary)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 2 }}>{quiz.title}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {status?.label || t.dash_lastPlayed} · {quiz.question_count} {t.dash_questionsCount}
                      </p>
                    </div>
                    {score !== null && score !== undefined && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: score >= 70 ? 'var(--success)' : 'var(--warning)' }}>{score}đ</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{t.dash_mastery}</p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Learning Tip */}
        <div className="tip-card">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            {t.dash_learningTip}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: 'white', fontSize: 15, marginBottom: 6 }}>{t.dash_activeRecall}</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              {t.dash_activeRecallDesc}
            </p>
          </div>
          <Link to="/sets" className="btn btn-outline btn-sm" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', width: '100%', justifyContent: 'center' }}>
            {t.dash_tryChallengeMode}
          </Link>
        </div>
      </div>
      {/* Share Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{shareItem && ('description' in shareItem) ? 'Chia sẻ bộ học phần' : 'Chia sẻ Quiz'}</span>}
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={handleShare}
        confirmLoading={sharing}
        okText={t.ai_share || 'Chia sẻ'}
        cancelText={t.ai_cancel || 'Hủy'}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 10 }} size="middle">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email người dùng</p>
            <Input
              placeholder="Nhập email người muốn chia sẻ"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.ai_permission || 'Quyền hạn'}</p>
            <Select
              style={{ width: '100%' }}
              value={sharePermission}
              onChange={val => setSharePermission(val)}
              options={[
                { value: 'view', label: t.ai_viewPermission || 'Chế độ xem' },
                { value: 'edit', label: t.ai_editPermission || 'Có thể chỉnh sửa' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
