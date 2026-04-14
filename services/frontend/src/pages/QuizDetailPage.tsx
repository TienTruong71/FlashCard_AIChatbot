import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { message, Popover, Modal, Input, Select, Space } from 'antd'
import { quizApi, testApi } from '../api'
import type { Quiz, Test } from '../types'

import { useLanguageStore } from '../store/languageStore'
import { useAuthStore } from '../store/authStore'
import { useBreadcrumbStore } from '../store/breadcrumbStore'
import { translations } from '../i18n'
import {
  Plus, Trash2, ChevronLeft,
  CheckCircle2, Circle, AlignLeft, Clock3, Clock,
  Play, ToggleLeft, ToggleRight,
  ListChecks, Trophy, ChevronRight, Sparkles, Save,
  Share2
} from 'lucide-react'
import { quizQuestionApi } from '../api'

type LocalAnswer = { content: string; is_correct: boolean }
type LocalQuestion = {
  id?: number
  title: string
  type: 'single' | 'checkbox' | 'text'
  answers: LocalAnswer[]
  isNew?: boolean
  isDirty?: boolean
}

export const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const t = translations[language]

  const [quizInfo, setQuizInfo] = useState<Quiz | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([])
  const { user } = useAuthStore()
  const { setTitle } = useBreadcrumbStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState<string>('')
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view')
  const [sharing, setSharing] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [infoRes, testsRes] = await Promise.all([
        quizApi.retrieve(Number(id)),
        quizApi.listTests(Number(id)),
      ])
      const quizData = infoRes.data?.data
      if (quizData) {
        setQuizInfo(quizData)
        setTitle(quizData.id.toString(), quizData.title)
        if (quizData.set && quizData.set_title) {
          setTitle(quizData.set.toString(), quizData.set_title)
        }
      }
      setTests(testsRes.data?.data || [])

      if (quizData?.questions) {
        setLocalQuestions(quizData.questions.map((qq: any) => ({
          id: qq.id,
          title: qq.title,
          type: qq.type as any,
          answers: qq.answers || [],
        })))
      }
    } catch {
      message.error(t.common_error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleStartTest = async () => {
    try {
      if (inProgressTest) {
        navigate(`/tests/${inProgressTest.id}`)
        return
      }
      const createRes = await testApi.create({ quiz: Number(id) })
      const testId = createRes.data?.data?.id
      if (testId) navigate(`/tests/${testId}`)
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    }
  }

  const addNewCard = () => {
    setLocalQuestions(prev => [...prev, {
      title: '',
      type: 'single',
      answers: [{ content: '', is_correct: false }, { content: '', is_correct: false }],
      isNew: true,
    }])
  }

  const updateQuestion = (index: number, field: keyof LocalQuestion, value: any) => {
    setLocalQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value, isDirty: true } : q))
  }

  const updateAnswer = (qIndex: number, aIndex: number, field: 'content' | 'is_correct', value: any) => {
    setLocalQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const newAnswers = q.answers.map((a, ai) => {
        if (ai !== aIndex) return field === 'is_correct' && q.type === 'single' ? { ...a, is_correct: false } : a
        return { ...a, [field]: value }
      })
      return { ...q, answers: newAnswers, isDirty: true }
    }))
  }

  const removeQuestion = (index: number) => {
    setLocalQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const addAnswer = (qIndex: number) => {
    setLocalQuestions(prev => prev.map((q, i) =>
      i === qIndex ? { ...q, answers: [...q.answers, { content: '', is_correct: false }] } : q
    ))
  }
  const handleSaveSingleQuestion = async (qIdx: number) => {
    const q = localQuestions[qIdx]
    if (!quizInfo) return
    try {
      let updatedId = q.id
      if (q.id) {
        await quizQuestionApi.update(q.id, { title: q.title, type: q.type, answers: q.answers })
      } else {
        const res = await quizApi.createQuestion(quizInfo.id, { title: q.title, type: q.type, answers: q.answers })
        updatedId = res.data?.data?.id
      }
      setLocalQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, isDirty: false, isNew: false, id: updatedId } : item))
      message.success('Đã lưu câu hỏi!')
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    }
  }

  const togglePublish = async () => {
    if (!quizInfo || !isOwner) return
    try {
      const newStatus = !quizInfo.is_published
      await quizApi.update(quizInfo.id, { is_published: newStatus })
      setQuizInfo({ ...quizInfo, is_published: newStatus })
      message.success(newStatus ? 'Đã chuyển sang Công khai' : 'Đã lùi về Bản nháp')
    } catch {
      message.error(t.common_error)
    }
  }

  const toggleResuming = async () => {
    if (!quizInfo || isLocked || !hasEditPermission) return
    try {
      const newValue = !quizInfo.allow_resuming
      await quizApi.update(quizInfo.id, { allow_resuming: newValue })
      setQuizInfo({ ...quizInfo, allow_resuming: newValue })
      message.success('Đã cập nhật chế độ làm bài')
    } catch {
      message.error(t.common_error)
    }
  }

  const isOwner = quizInfo?.user === user?.id
  const hasEditPermission = isOwner || quizInfo?.permission === 'edit'
  const isLocked = quizInfo?.is_published

  const handleTimeLimitUpdate = async (minutes: number | null) => {
    if (!quizInfo || isLocked || !hasEditPermission) return
    let newLimit = quizInfo.time_limit === null ? 0 : quizInfo.time_limit
    if (minutes === null) {
      newLimit = 0
    } else {
      newLimit += minutes
    }
    const finalLimit = newLimit === 0 ? null : newLimit

    try {
      await quizApi.update(quizInfo.id, { time_limit: finalLimit })
      setQuizInfo({ ...quizInfo, time_limit: finalLimit })
      message.success('Đã cập nhật thời gian')
    } catch {
      message.error(t.common_error)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!quizInfo) return
    Modal.confirm({
      title: t.ai_delete,
      content: t.ai_confirmDelete,
      okText: t.common_confirm,
      cancelText: t.common_cancel,
      okType: 'danger',
      onOk: async () => {
        try {
          if (isOwner) {
            await quizApi.destroy(quizInfo.id)
          } else if (user?.id) {
            await quizApi.unshare(quizInfo.id, user.id)
          }
          message.success(t.ai_deleteSuccess)
          navigate('/dashboard')
        } catch {
          message.error(t.common_error)
        }
      }
    })
  }

  const handleShareQuiz = async () => {
    if (!quizInfo || !shareEmail) return
    setSharing(true)
    try {
      await quizApi.share(quizInfo.id, {
        shares: [{ email: shareEmail, permission: sharePermission }]
      })
      message.success(t.ai_shareSuccess)
      setIsShareModalOpen(false)
      setShareEmail('')
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    } finally {
      setSharing(false)
    }
  }

  const timeLimitContent = (
    <div style={{ padding: 8, width: 200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={() => handleTimeLimitUpdate(1)}>+1 {t.qt_minutes_suffix}</button>
        <button className="btn btn-outline btn-sm" onClick={() => handleTimeLimitUpdate(5)}>+5 {t.qt_minutes_suffix}</button>
        <button className="btn btn-outline btn-sm" onClick={() => handleTimeLimitUpdate(15)}>+15 {t.qt_minutes_suffix}</button>
        <button className="btn btn-outline btn-sm" onClick={() => handleTimeLimitUpdate(60)}>+60 {t.qt_minutes_suffix}</button>
      </div>
      <button
        className="btn btn-ghost btn-sm"
        style={{ width: '100%', color: 'var(--danger)' }}
        onClick={() => handleTimeLimitUpdate(null)}
      >
        {t.qt_unlimited}
      </button>
    </div>
  )



  const completedTests = tests.filter(t => t.score !== null && t.score !== undefined)
  const avgScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((a, b) => a + (b.score || 0), 0) / completedTests.length)
    : 0

  const inProgressTest = tests.find(t => t.status === 'pending' || t.status === 'in_progress')

  if (!quizInfo) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{loading ? t.common_loading : 'Quiz not found'}</div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, marginTop: 8 }}>
        <div style={{ flex: 1, paddingRight: 24 }}>
          <h1 className="page-title" style={{ marginBottom: 6 }}>{quizInfo.title}</h1>
          <p className="page-subtitle">
            {quizInfo.question_count} {t.dash_questionsCount} · {quizInfo.is_published ? t.config_published : t.config_draft} · {quizInfo.time_limit ? `${quizInfo.time_limit} ${t.qt_minutes_suffix}` : t.qt_unlimited}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
          {isOwner && (
            <button className="btn btn-outline" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={14} /> {t.ai_share}
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleDeleteQuiz} style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} /> {t.common_delete}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/sets/${quizInfo.set}`)}>
            <ChevronLeft size={14} /> {t.ai_backToLibrary}
          </button>
        </div>
      </div>

      <div className="ai-shell" style={{ marginTop: 24 }}>
        {/* Left: Questions editor */}
        <div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t.common_loading}</p>
          ) : localQuestions.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 16 }}>
              <Sparkles size={32} style={{ marginBottom: 12, color: 'var(--primary)', opacity: 0.5 }} />
              <p>{t.ai_noQuestions}</p>
            </div>
          ) : (
            localQuestions.map((q, qIdx) => (
              <div key={qIdx} className={`ai-question-card${q === localQuestions[localQuestions.length - 1] ? ' active' : ''}`}>
                {/* Question header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.8 }}>
                    {t.ai_questionNum} {String(qIdx + 1).padStart(2, '0')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(qIdx, 'type', e.target.value)}
                      disabled={isLocked || !hasEditPermission}
                      style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '4px 8px', fontSize: 12, color: 'var(--text)',
                        fontFamily: 'var(--font)', cursor: (isLocked || !hasEditPermission) ? 'not-allowed' : 'pointer', background: (isLocked || !hasEditPermission) ? 'var(--bg)' : 'white',
                      }}
                    >
                      <option value="single">{t.qt_single}</option>
                      <option value="checkbox">{t.qt_checkbox}</option>
                      <option value="text">{t.qt_text}</option>
                    </select>
                    {!isLocked && hasEditPermission && (
                      <>
                        {(q.isDirty || q.isNew) && (
                          <button
                            onClick={() => handleSaveSingleQuestion(qIdx)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', gap: 4, fontSize: 12 }}
                          >
                            <Save size={13} /> Lưu
                          </button>
                        )}
                        <button
                          onClick={() => removeQuestion(qIdx)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                  {t.ai_questionStatement}
                </p>
                <textarea
                  className="form-input form-textarea"
                  style={{ marginBottom: 16, resize: 'vertical', minHeight: 70, background: (isLocked || !hasEditPermission) ? 'var(--bg)' : 'white' }}
                  placeholder="What is the primary purpose of..."
                  value={q.title}
                  readOnly={isLocked || !hasEditPermission}
                  onChange={e => updateQuestion(qIdx, 'title', e.target.value)}
                />

                {/* Answers */}
                {q.type !== 'text' ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t.ai_answerOptions}
                    </p>
                    {q.answers.map((ans, aIdx) => {
                      const showGreen = !isLocked && ans.is_correct && hasEditPermission
                      return (
                        <div key={aIdx} style={{
                          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                          padding: '10px 14px',
                          border: `1.5px solid ${showGreen ? 'var(--success)' : 'var(--border)'}`,
                          borderRadius: 10,
                          background: showGreen ? 'var(--success-bg)' : (isLocked || !hasEditPermission ? 'var(--bg)' : 'white'),
                        }}>
                          {!isLocked && hasEditPermission && (
                            <button
                              onClick={() => updateAnswer(qIdx, aIdx, 'is_correct', !ans.is_correct)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                              {ans.is_correct
                                ? <CheckCircle2 size={18} color="var(--success)" />
                                : <Circle size={18} color="var(--text-muted)" />
                              }
                            </button>
                          )}
                          {(isLocked || !hasEditPermission) && (
                            <Circle size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          )}
                          <input
                            className="form-input"
                            style={{ border: 'none', padding: '0 4px', flex: 1, background: 'transparent', fontWeight: showGreen ? 600 : 400, color: (isLocked || !hasEditPermission) ? 'var(--text)' : undefined }}
                            placeholder={`Option ${aIdx + 1}`}
                            value={ans.content}
                            readOnly={isLocked || !hasEditPermission}
                            onChange={e => updateAnswer(qIdx, aIdx, 'content', e.target.value)}
                          />
                        </div>
                      )
                    })}
                    {!isLocked && hasEditPermission && (
                      <button
                        onClick={() => addAnswer(qIdx)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--primary)', fontSize: 12, gap: 4, marginTop: 4 }}
                      >
                        <Plus size={12} /> Add option
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t.ai_correctAnswer}
                    </p>
                    {isLocked || !hasEditPermission ? (
                      <div style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text-muted)' }}>
                        <i>{t.ai_correctAnswer} đã ẩn</i>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid var(--success)', borderRadius: 10, background: 'var(--success-bg)' }}>
                        <AlignLeft size={16} color="var(--success)" />
                        <input
                          className="form-input"
                          style={{ border: 'none', padding: '0 4px', flex: 1, background: 'transparent', fontWeight: 600, color: 'var(--success)' }}
                          placeholder="Correct answer..."
                          value={q.answers[0]?.content || ''}
                          readOnly={isLocked || !hasEditPermission}
                          onChange={e => {
                            if (q.answers.length === 0) addAnswer(qIdx)
                            updateAnswer(qIdx, 0, 'content', e.target.value)
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          {/* Add New Card */}
          {!isLocked && hasEditPermission && (
            <div
              onClick={addNewCard}
              style={{
                border: '2px dashed var(--border)', borderRadius: 14,
                padding: 28, textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s', marginBottom: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Plus size={18} color="var(--primary)" />
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--primary)' }}>{t.ai_addNewCard}</p>
            </div>
          )}
        </div>

        {/* Right: Quiz Info Panel */}
        <div style={{ position: 'sticky', top: 20 }}>
          {/* Quiz Status Card */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ListChecks size={15} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Thông tin Quiz</span>
            </div>

            {/* Publish toggle */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 10, marginBottom: 12,
              background: quizInfo?.is_published ? 'var(--success-bg)' : 'var(--bg)',
              border: `1px solid ${quizInfo?.is_published ? 'var(--success)' : 'var(--border)'}`
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  {quizInfo?.is_published ? t.config_published : t.config_draft}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {quizInfo?.is_published ? 'Học sinh có thể thi' : 'Chưa công khai'}
                </p>
              </div>
              <div onClick={isOwner ? togglePublish : undefined} style={{ cursor: isOwner ? 'pointer' : 'not-allowed', display: 'flex' }}>
                {quizInfo?.is_published
                  ? <ToggleRight size={22} color="var(--success)" />
                  : <ToggleLeft size={22} color="var(--text-muted)" />
                }
              </div>
            </div>

            {/* Time limit info */}
            <Popover
              content={timeLimitContent}
              title={t.qt_timeLimit}
              trigger={(isLocked || !hasEditPermission) ? [] : "click"}
              placement="left"
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 10, marginBottom: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
                cursor: (isLocked || !hasEditPermission) ? 'default' : 'pointer'
              }}>
                <Clock size={16} color="var(--primary)" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                    {quizInfo?.time_limit ? `${quizInfo.time_limit} ${t.qt_minutes_suffix}` : t.qt_unlimited}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t.qt_timeLimit}
                  </p>
                </div>
              </div>
            </Popover>

            {/* Resume toggle */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 10, marginBottom: 12,
              background: quizInfo?.allow_resuming ? 'var(--bg)' : 'var(--warning-bg)',
              border: `1px solid ${quizInfo?.allow_resuming ? 'var(--border)' : 'var(--warning)'}`
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  {t.config_allowResuming}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {quizInfo?.allow_resuming ? 'Có thể thoát và làm tiếp' : 'Bắt buộc làm một mạch'}
                </p>
              </div>
              {!isLocked && (
                <div
                  onClick={(isLocked || !hasEditPermission) ? undefined : toggleResuming}
                  style={{ cursor: (isLocked || !hasEditPermission) ? 'not-allowed' : 'pointer', display: 'flex' }}
                >
                  {quizInfo?.allow_resuming
                    ? <ToggleRight size={22} color="var(--primary)" />
                    : <ToggleLeft size={22} color="var(--text-muted)" />
                  }
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{localQuestions.length}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Câu hỏi</p>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{tests.length}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Lần thi</p>
              </div>
            </div>

            {/* Score summary */}
            {completedTests.length > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={16} color="var(--warning)" />
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Điểm trung bình</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>{avgScore}đ</p>
                </div>
              </div>
            )}

            {quizInfo?.is_published && (
              <button
                className={`btn ${inProgressTest ? 'btn-primary' : 'btn-success'} w-full`}
                style={{ justifyContent: 'center', marginTop: 4 }}
                onClick={handleStartTest}
              >
                {inProgressTest ? (
                  <>
                    <Play size={13} style={{ marginRight: 6 }} /> {t.config_continueTest}
                  </>
                ) : (
                  <>
                    <Play size={13} style={{ marginRight: 6 }} /> {t.config_startTest}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Set Insights - dark card */}
          <div className="insights-dark">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
              {t.ai_setInsights}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {localQuestions.length.toString().padStart(2, '0')}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{t.ai_totalCards}</p>
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {(localQuestions.length * 2.1).toFixed(1)}m
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{t.ai_avgReading}</p>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t.ai_knowledgeCoverage}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{Math.min(avgScore || 12, 100)}đ</p>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(avgScore || 12, 100)}%`, background: 'var(--success)', borderRadius: 10 }} />
              </div>
            </div>
          </div>

          {/* Test history */}
          {tests.length > 0 && (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Recent Attempts</p>
              {tests.slice(0, 3).map(test => (
                <div key={test.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock3 size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {test.started_at ? new Date(test.started_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {test.status === 'submitted'
                    ? <span style={{ fontSize: 13, fontWeight: 700, color: (test.score || 0) >= 70 ? 'var(--success)' : 'var(--warning)' }}>{test.score}đ</span>
                    : <span className="badge badge-warning">{test.status === 'pending' ? 'Chưa bắt đầu' : 'Đang làm'}</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        title={t.ai_shareModalTitle}
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={handleShareQuiz}
        confirmLoading={sharing}
        okText={t.ai_share}
        cancelText={t.ai_cancel}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 10 }} size="middle">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.ai_userId}</p>
            <Input
              placeholder={t.ai_userIdPlaceholder}
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.ai_permission}</p>
            <Select
              style={{ width: '100%' }}
              value={sharePermission}
              onChange={val => setSharePermission(val)}
              options={[
                { value: 'view', label: t.ai_viewPermission },
                { value: 'edit', label: t.ai_editPermission },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}


