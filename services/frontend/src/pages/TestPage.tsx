import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { message } from 'antd'
import { testApi, quizApi } from '../api'
import type { Quiz, QuizQuestion, Test } from '../types'
import { debounce } from 'lodash'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { useLayoutStore } from '../store/layoutStore'
import {
  LogOut, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, XCircle, Star, Lightbulb,
  Share2, Download, AlertTriangle,
  Flag, CheckCircle,
} from 'lucide-react'
import { useBlocker } from 'react-router-dom'

// ─── Test Taking Page ────────────────────────────────────────────────────────
export const TestPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isReview = searchParams.get('review') === 'true'
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguageStore()
  const t = translations[language]
  const { setFullScreen } = useLayoutStore()

  // Navigation blocker
  const blocker = useBlocker(
    ({ nextLocation }) =>
      !isReview && 
      quizInfo?.allow_resuming === false && 
      !submitting &&
      nextLocation.pathname !== location.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm(t.test_leaveWarning)) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, t.test_leaveWarning]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isReview && quizInfo?.allow_resuming === false && !submitting) {
        e.preventDefault();
        e.returnValue = t.test_leaveWarning;
        return t.test_leaveWarning;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReview, quizInfo, submitting, t.test_leaveWarning]);

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testInfo, setTestInfo] = useState<Test | null>(null)
  const [quizInfo, setQuizInfo] = useState<(Quiz & { questions: QuizQuestion[] }) | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set())
  const [elapsed, setElapsed] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)

  // Set full-screen mode (hides sidebar) only when taking (not reviewing)
  useEffect(() => {
    setFullScreen(!isReview)
    return () => setFullScreen(false)
  }, [isReview, setFullScreen])

  // Timer
  useEffect(() => {
    if (isReview || paused) return
    const timer = setInterval(() => {
      setElapsed(p => p + 1)
      setRemaining(p => {
        if (p === null) return null
        // Trigger auto submit on exactly 0 via useEffect below
        return p > 0 ? p - 1 : 0
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isReview, paused])

  // Auto-submit when remaining time hits 0
  useEffect(() => {
    if (remaining === 0 && !submitting && !isReview) {
      handleSubmit()
    }
  }, [remaining, submitting, isReview])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        if (!isReview) {
          try { await testApi.start(Number(id)) } catch { /* already started */ }
        }
        const testRes = await testApi.retrieve(Number(id))
        const tInfo = testRes.data?.data || null
        setTestInfo(tInfo)
        if (tInfo?.remaining_time !== undefined) {
          setRemaining(tInfo.remaining_time)
        }
        if (tInfo) {
          const quizRes = await quizApi.retrieve(tInfo.quiz)
          setQuizInfo(quizRes.data?.data as any)
          if (isReview) {
            const resultRes = await testApi.results(Number(id))
            setTestResult(resultRes.data?.data)
          }
        }
      } catch (error: any) {
        message.error(error.errorMessage || t.common_error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, isReview])

  const saveAnswer = async (qId: number, payload: any) => {
    setSaving(true)
    try {
      await testApi.saveAnswer(Number(id), qId, payload)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const debouncedSave = useCallback(
    debounce((qId: number, text: string) => { saveAnswer(qId, { text }) }, 1000),
    [id]
  )

  const handleAnswerChange = (qId: number, type: string, value: any) => {
    setUserAnswers(prev => ({ ...prev, [qId]: value }))
    if (type === 'single') saveAnswer(qId, { quiz_question_answer_id: value })
    else if (type === 'checkbox') saveAnswer(qId, { answer_ids: value })
    else if (type === 'text') { debouncedSave(qId, value) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await testApi.submit(Number(id))
      message.success('Submitted!')
      setTestResult(res.data?.data)
      navigate(`/tests/${id}?review=true`, { replace: true })
    } catch (e: any) {
      message.error(e.errorMessage || t.common_error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t.common_loading}</p>
      </div>
    )
  }

  // ── Results View ──────────────────────────────────────────────────────────
  if (isReview) {
    if (!testResult) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>No result data.</div>

    const score = testResult.score ?? 0
    const correct = testResult.correct ?? 0
    const total = testResult.total ?? 0
    const incorrect = total - correct
    const timeSec = testResult.time_spent ?? elapsed

    const performanceMsg = score >= 85
      ? t.res_outstandingPerformance
      : score >= 60
        ? t.res_goodPerformance
        : t.res_needsImprovement

    return (
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: 8 }}>
          <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8, fontWeight: 700 }}>{t.res_history}</span>
          <ChevronRight size={10} />
          <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8, fontWeight: 700, color: 'var(--text-secondary)' }}>{t.res_quizCompletion}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h1 className="page-title">{quizInfo?.title || 'Quiz'} {t.res_summary}</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>{t.res_backToDashboard}</button>
            <button className="btn btn-primary" onClick={() => navigate(`/quizzes/${testInfo?.quiz}`)}>
              {t.res_retakeQuiz}
            </button>
          </div>
        </div>

        {/* Score + Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 200px 200px', gap: 20, marginBottom: 28 }}>
          {/* Final performance */}
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
              {t.res_finalPerformance}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
              <span className="result-score-circle">{score}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', paddingBottom: 4 }}>%</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{performanceMsg}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} /> {correct} {t.res_correct}
              </span>
              <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <XCircle size={13} /> {incorrect} {t.res_incorrect}
              </span>
            </div>
          </div>

          {/* Time taken */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              {t.res_timeTaken}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Clock size={16} color="var(--primary)" />
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{formatTime(timeSec)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                {t.res_avgTimePerQuestion}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--success)" />
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  {total > 0 ? (timeSec / total).toFixed(1) : '0'}s
                </span>
              </div>
            </div>
          </div>

          {/* Attempt snapshot */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
              {t.res_attemptSnapshot}
            </p>
            <div style={{ height: 80, background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-muted)', opacity: 0.4 }}>YOUR<br />WORK</p>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {t.res_sessionId}: #{testInfo?.id}
            </p>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{t.res_performanceAnalytics}</h3>
          {[
            { label: 'Multiple Choice', pct: Math.min(score + 5, 100), color: 'var(--primary)' },
            { label: 'True / False', pct: 100, color: 'var(--success)' },
            { label: 'Text Fill', pct: Math.max(score - 10, 0), color: 'var(--warning)' },
          ].map(({ label, pct, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', width: 130, flexShrink: 0 }}>{label}</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{pct}%</span>
            </div>
          ))}
        </div>

        {/* Question Review */}
        {quizInfo?.questions && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t.res_questionReview}</h3>
            </div>
            {quizInfo.questions.map((q, i) => {
              // Find user's answer from testInfo
              const userAns = testInfo?.answers?.find(a => a.quiz_question === q.id)
              const isCorrect = userAns?.is_correct ?? false
              return (
                <div key={q.id} className="question-review-card">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isCorrect
                        ? <CheckCircle2 size={15} color="var(--success)" />
                        : <XCircle size={15} color="var(--danger)" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                        QUESTION {String(i + 1).padStart(2, '0')} · {q.type === 'single' ? 'MULTIPLE CHOICE' : q.type === 'text' ? 'TEXT FILL' : 'MULTI SELECT'}
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, lineHeight: 1.5, marginBottom: 14 }}>
                        {q.title}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                            {t.res_yourAnswer}
                          </p>
                          <div className={`answer-box ${isCorrect ? 'correct' : 'incorrect'}`}>
                            {userAns?.content || (userAns?.answer_id ? q.answers?.find(a => a.id === userAns.answer_id)?.content : 'No answer')}
                            {isCorrect
                              ? <CheckCircle2 size={14} style={{ marginLeft: 8, display: 'inline' }} />
                              : <XCircle size={14} style={{ marginLeft: 8, display: 'inline' }} />
                            }
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                            {t.res_correctAnswer}
                          </p>
                          <div className="answer-box neutral">
                            {q.answers?.find(a => a.is_correct)?.content || 'N/A'}
                          </div>
                        </div>
                      </div>
                      {!isCorrect && (
                        <div className="ai-explanation">
                          <strong>{t.res_aiExplanation}</strong> Review the key concepts related to this question and practice with similar examples.
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                      {isCorrect ? '+10' : '0'} pts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>📅 {t.res_completedOn} {new Date().toLocaleDateString()}</span>
            <span>✓ {t.res_verifiedQuiz}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', gap: 5 }}>
              <Share2 size={13} /> {t.res_shareResults}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', gap: 5 }}>
              <Download size={13} /> {t.res_downloadPdf}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Taking Mode ───────────────────────────────────────────────────────────
  if (!quizInfo?.questions) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No questions found.</p>
      </div>
    )
  }

  const totalQuestions = quizInfo.questions.length
  const currentQuestion = quizInfo.questions[currentIndex]
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const answeredCount = Object.keys(userAnswers).length

  return (
    <div className="test-shell">
      {/* Header */}
      <div className="test-header">
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{quizInfo.title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {answeredCount} / {totalQuestions} {t.test_answered}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', padding: '6px 12px', borderRadius: 20 }}>
            <Clock size={14} color={remaining !== null && remaining <= 60 ? 'var(--danger)' : 'var(--primary)'} />
            <span style={{ fontWeight: 700, fontSize: 14, color: remaining !== null && remaining <= 60 ? 'var(--danger)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {remaining !== null ? formatTime(remaining) : formatTime(elapsed)}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (quizInfo?.allow_resuming === false) {
                message.warning(t.test_resumeForbidden);
              } else {
                navigate(`/sets/${quizInfo?.set}`);
              }
            }}
            disabled={quizInfo?.allow_resuming === false}
            style={{ gap: 5, opacity: quizInfo?.allow_resuming === false ? 0.5 : 1 }}
          >
            <LogOut size={14} /> {t.test_leave}
          </button>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>U</div>
        </div>

        {/* Progress bar */}
        <div className="test-header-progress">
          <div className="test-header-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="test-body">
        {/* Left: Question Map */}
        <div className="test-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{t.test_questionMap}</p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{answeredCount} / {totalQuestions}</span>
          </div>
          <div className="question-map-grid">
            {quizInfo.questions.map((q, idx) => {
              const status = markedForReview.has(idx) ? 'marked' : (userAnswers[q.id] !== undefined ? 'answered' : '');
              return (
                <button
                  key={q.id}
                  className={`q-map-btn ${currentIndex === idx ? 'current' : ''} ${status}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { cls: 'answered', label: t.test_answered },
              { cls: 'marked', label: t.test_markForReviewLegend },
              { cls: 'current', label: t.test_current },
              { cls: '', label: t.test_unanswered },
            ].map(({ cls, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: cls === 'answered' ? 'var(--primary)' : (cls === 'marked' ? 'var(--warning)' : 'transparent'),
                  border: `2px solid ${cls ? (cls === 'marked' ? 'var(--warning)' : 'var(--primary)') : 'var(--border)'}`,
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Question */}
        <div className="test-main">
          <div className="question-card">
            {/* Question header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                {t.test_question} {String(currentIndex + 1).padStart(2, '0')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star size={13} color="var(--warning)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                  {t.test_difficulty}: {t.test_medium}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, lineHeight: 1.7, marginBottom: 24 }}>
              {currentQuestion.title}
            </p>

            {/* Answers */}
            {currentQuestion.type === 'single' && (
              <>
                {currentQuestion.answers.map(ans => (
                  <div
                    key={ans.id}
                    className={`answer-option${userAnswers[currentQuestion.id] === ans.id ? ' selected' : ''}`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'single', ans.id)}
                  >
                    <div className="answer-radio">
                      {userAnswers[currentQuestion.id] === ans.id && <div className="answer-radio-dot" />}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: userAnswers[currentQuestion.id] === ans.id ? 600 : 400 }}>
                      {ans.content}
                    </span>
                  </div>
                ))}
              </>
            )}

            {currentQuestion.type === 'checkbox' && (
              <>
                {currentQuestion.answers.map(ans => {
                  const selected = (userAnswers[currentQuestion.id] || []).includes(ans.id)
                  return (
                    <div
                      key={ans.id}
                      className={`answer-option${selected ? ' selected' : ''}`}
                      onClick={() => {
                        const current = userAnswers[currentQuestion.id] || []
                        const newVal = selected ? current.filter((v: number) => v !== ans.id) : [...current, ans.id]
                        handleAnswerChange(currentQuestion.id, 'checkbox', newVal)
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'var(--primary)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text)' }}>{ans.content}</span>
                    </div>
                  )
                })}
              </>
            )}

            {currentQuestion.type === 'text' && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                  {t.test_yourDetailedExplanation}
                </p>
                <textarea
                  className="form-input form-textarea"
                  style={{ minHeight: 120 }}
                  placeholder={t.test_typeResponse}
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={e => handleAnswerChange(currentQuestion.id, 'text', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Expert Tip */}
          <div className="expert-tip-banner">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lightbulb size={16} color="var(--success)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', marginBottom: 3 }}>{t.test_expertTip}</p>
              <p style={{ fontSize: 12.5, color: '#15803d', lineHeight: 1.5 }}>{t.test_expertTipContent}</p>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              <ChevronLeft size={15} /> {t.test_previous}
            </button>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saving && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.test_autoSaved} {saving ? '...' : '✓'}</span>}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setMarkedForReview(prev => {
                  const next = new Set(prev)
                  if (next.has(currentIndex)) next.delete(currentIndex)
                  else next.add(currentIndex)
                  return next
                })}
                style={{ color: markedForReview.has(currentIndex) ? 'var(--warning)' : 'var(--text-secondary)', gap: 5 }}
              >
                <Flag size={13} /> {t.test_markForReview}
              </button>
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={currentIndex < totalQuestions - 1 ? () => setCurrentIndex(currentIndex + 1) : handleSubmit}
              >
                {currentIndex < totalQuestions - 1 ? (
                  <>{t.test_next} <ChevronRight size={15} /></>
                ) : (
                  <>{submitting ? '...' : t.test_submitQuiz}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Answer recorded toast */}
      {showToast && (
        <div className="toast-notification">
          <CheckCircle2 size={18} color="var(--success)" />
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t.test_answerRecorded}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.test_answerSaved}</p>
          </div>
        </div>
      )}
    </div>
  )
}
