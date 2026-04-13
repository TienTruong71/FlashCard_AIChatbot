import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { testApi, quizApi } from '../api'
import type { Test, Quiz } from '../types'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { BarChart2, Trophy, Clock, CheckCircle2 } from 'lucide-react'

export const AnalyticsPage = () => {
  const { language } = useLanguageStore()
  const t = translations[language]
  const [tests, setTests] = useState<Test[]>([])
  const [quizzesMap, setQuizzesMap] = useState<Record<number, Quiz>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await testApi.list({ page_size: 50 })
        const allTests = res.data?.data || []
        setTests(allTests)

        // Load quiz names
        const uniqueQuizIds = [...new Set(allTests.map((t: Test) => t.quiz))]
        const quizData: Record<number, Quiz> = {}
        await Promise.all(
          uniqueQuizIds.map(async (qId) => {
            try {
              const r = await quizApi.retrieve(qId as number)
              if (r.data?.data) quizData[qId as number] = r.data.data
            } catch { /* ignore */ }
          })
        )
        setQuizzesMap(quizData)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const completedTests = tests.filter(t => t.score !== null && t.score !== undefined)
  const avgScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((a, b) => a + (b.score ?? 0), 0) / completedTests.length)
    : 0
  const bestScore = completedTests.length > 0
    ? Math.max(...completedTests.map(t => t.score ?? 0))
    : 0

  return (
    <div>
      {/* Header */}
      <h1 className="page-title" style={{ marginBottom: 4 }}>{t.analytics_title}</h1>
      <p className="page-subtitle" style={{ marginBottom: 28 }}>{t.analytics_subtitle}</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ width: 38, height: 38, background: 'var(--primary-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <BarChart2 size={18} color="var(--primary)" />
          </div>
          <span className="stat-value">{completedTests.length}</span>
          <span className="stat-label">{t.analytics_totalTests}</span>
        </div>
        <div className="stat-card">
          <div style={{ width: 38, height: 38, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <CheckCircle2 size={18} color="var(--success)" />
          </div>
          <span className="stat-value" style={{ color: avgScore >= 70 ? 'var(--success)' : avgScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
            {avgScore}%
          </span>
          <span className="stat-label">{t.analytics_avgScore}</span>
        </div>
        <div className="stat-card">
          <div style={{ width: 38, height: 38, background: 'rgba(251,191,36,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Trophy size={18} color="#f59e0b" />
          </div>
          <span className="stat-value" style={{ color: '#f59e0b' }}>{bestScore}%</span>
          <span className="stat-label">{t.analytics_bestScore}</span>
        </div>
      </div>

      {/* Performance over time */}
      {completedTests.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{t.analytics_performance}</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {completedTests.slice(-12).map((test, i) => {
              const h = Math.max(((test.score ?? 0) / 100) * 90, 6)
              return (
                <div key={test.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: '100%', height: h,
                      background: i === completedTests.slice(-12).length - 1 ? 'var(--primary)' : 'var(--primary-medium)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s',
                    }}
                    title={`${test.score}%`}
                  />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{test.score}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Test History Table */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{t.analytics_testHistory}</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>{t.common_loading}</p>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>{t.analytics_noTests}</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 80px 100px', gap: 12, padding: '8px 12px', borderBottom: '2px solid var(--border)', marginBottom: 4 }}>
              {[t.analytics_quiz, t.analytics_date, t.common_status, t.analytics_score, t.common_actions].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
              ))}
            </div>
            {tests.map(test => {
              const quiz = quizzesMap[test.quiz]
              const isDone = test.score !== null && test.score !== undefined
              return (
                <div key={test.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 80px 100px', gap: 12, padding: '12px', borderRadius: 8, alignItems: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                    {quiz?.title || `Quiz #${test.quiz}`}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} /> {new Date(test.created_at).toLocaleDateString()}
                  </span>
                  <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                    {isDone ? t.analytics_completed : t.analytics_pending}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: isDone ? (test.score! >= 70 ? 'var(--success)' : 'var(--warning)') : 'var(--text-muted)' }}>
                    {isDone ? `${test.score}%` : '—'}
                  </span>
                  <Link
                    to={isDone ? `/tests/${test.id}?review=true` : `/tests/${test.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 12, textAlign: 'center', justifyContent: 'center' }}
                  >
                    {isDone ? t.common_view : 'Continue'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
