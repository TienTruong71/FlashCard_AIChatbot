import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { quizApi, testApi } from '../api'
import type { Quiz, Test } from '../types'

import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import {
  Plus, Trash2, ChevronLeft,
  CheckCircle2, Circle, AlignLeft, Clock3,
  Play, ToggleLeft, ToggleRight,
  ListChecks, Trophy, ChevronRight, Sparkles, Save
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveToast, setSaveToast] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [infoRes, testsRes] = await Promise.all([
        quizApi.retrieve(Number(id)),
        quizApi.listTests(Number(id)),
      ])
      const quiz = infoRes.data?.data || null
      setQuizInfo(quiz)
      setTests(testsRes.data?.data || [])

      if (quiz?.questions) {
        setLocalQuestions(quiz.questions.map((qq: any) => ({
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

  const handleSave = async () => {
    if (!quizInfo) return
    setSaving(true)
    try {
      for (const q of localQuestions.filter(q => q.isNew || q.isDirty)) {
        if (q.id) {
          await quizQuestionApi.update(q.id, { title: q.title, type: q.type, answers: q.answers })
        } else {
          await quizApi.createQuestion(quizInfo.id, { title: q.title, type: q.type, answers: q.answers })
        }
      }
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 3000)
      fetchData()
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    } finally {
      setSaving(false)
    }
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
    if (!quizInfo) return
    try {
      const newStatus = !quizInfo.is_published
      await quizApi.update(quizInfo.id, { is_published: newStatus })
      setQuizInfo({ ...quizInfo, is_published: newStatus })
      message.success(newStatus ? 'Đã chuyển sang Công khai' : 'Đã lùi về Bản nháp')
    } catch {
      message.error(t.common_error)
    }
  }

  const isLocked = quizInfo?.is_published


  const completedTests = tests.filter(t => t.score !== null && t.score !== undefined)
  const avgScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((a, b) => a + (b.score || 0), 0) / completedTests.length)
    : 0

  if (!quizInfo) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{loading ? t.common_loading : 'Quiz not found'}</div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to={`/sets/${quizInfo.set}`}>{t.lib_title}</Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{quizInfo.title}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1, paddingRight: 24 }}>
          <h1 className="page-title" style={{ marginBottom: 6 }}>{quizInfo.title}</h1>
          <p className="page-subtitle">
            {quizInfo.question_count} {t.dash_questionsCount} · {quizInfo.is_published ? t.config_published : t.config_draft}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={() => navigate(`/sets/${quizInfo.set}`)}>
            <ChevronLeft size={14} /> {t.ai_backToLibrary}
          </button>
          {!isLocked && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : t.ai_saveSet}
            </button>
          )}
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
                      disabled={isLocked}
                      style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '4px 8px', fontSize: 12, color: 'var(--text)',
                        fontFamily: 'var(--font)', cursor: isLocked ? 'not-allowed' : 'pointer', background: isLocked ? 'var(--bg)' : 'white',
                      }}
                    >
                      <option value="single">{t.qt_single}</option>
                      <option value="checkbox">{t.qt_checkbox}</option>
                      <option value="text">{t.qt_text}</option>
                    </select>
                    {!isLocked && (
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
                  style={{ marginBottom: 16, resize: 'vertical', minHeight: 70, background: isLocked ? 'var(--bg)' : 'white' }}
                  placeholder="What is the primary purpose of..."
                  value={q.title}
                  readOnly={isLocked}
                  onChange={e => updateQuestion(qIdx, 'title', e.target.value)}
                />

                {/* Answers */}
                {q.type !== 'text' ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t.ai_answerOptions}
                    </p>
                    {q.answers.map((ans, aIdx) => {
                      const showGreen = !isLocked && ans.is_correct
                      return (
                        <div key={aIdx} style={{
                          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                          padding: '10px 14px',
                          border: `1.5px solid ${showGreen ? 'var(--success)' : 'var(--border)'}`,
                          borderRadius: 10,
                          background: showGreen ? 'var(--success-bg)' : (isLocked ? 'var(--bg)' : 'white'),
                        }}>
                          {!isLocked && (
                            <button
                              onClick={() => !isLocked && updateAnswer(qIdx, aIdx, 'is_correct', !ans.is_correct)}
                              style={{ border: 'none', background: 'none', cursor: isLocked ? 'default' : 'pointer', flexShrink: 0 }}
                            >
                              {ans.is_correct
                                ? <CheckCircle2 size={18} color="var(--success)" />
                                : <Circle size={18} color="var(--text-muted)" />
                              }
                            </button>
                          )}
                          {isLocked && (
                            <Circle size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          )}
                          <input
                            className="form-input"
                            style={{ border: 'none', padding: '0 4px', flex: 1, background: 'transparent', fontWeight: showGreen ? 600 : 400, color: isLocked ? 'var(--text)' : undefined }}
                            placeholder={`Option ${aIdx + 1}`}
                            value={ans.content}
                            readOnly={isLocked}
                            onChange={e => updateAnswer(qIdx, aIdx, 'content', e.target.value)}
                          />
                        </div>
                      )
                    })}
                    {!isLocked && (
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
                    {isLocked ? (
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
                          readOnly={isLocked}
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
          {!isLocked && (
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
              <div onClick={togglePublish} style={{ cursor: 'pointer', display: 'flex' }}>
                {quizInfo?.is_published
                  ? <ToggleRight size={22} color="var(--success)" />
                  : <ToggleLeft size={22} color="var(--text-muted)" />
                }
              </div>
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
                  <p style={{ fontSize: 16, fontWeight: 800, color: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>{avgScore}%</p>
                </div>
              </div>
            )}

            {/* Start test button */}
            {quizInfo?.is_published && (
              <button
                className="btn btn-success w-full"
                style={{ justifyContent: 'center', marginTop: 4 }}
                onClick={handleStartTest}
              >
                <Play size={13} style={{ marginRight: 6 }} /> {t.config_startTest}
              </button>
            )}

            {/* Back to set */}
            <button
              className="btn btn-ghost w-full"
              style={{ justifyContent: 'center', marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}
              onClick={() => navigate(`/sets/${quizInfo?.set}`)}
            >
              <ChevronLeft size={13} /> Về bộ học phần
            </button>
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
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{Math.min(avgScore || 12, 100)}%</p>
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
                <Link key={test.id} to={`/tests/${test.id}?review=true`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock3 size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(test.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {test.score !== null && test.score !== undefined
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: test.score >= 70 ? 'var(--success)' : 'var(--warning)' }}>{test.score}%</span>
                      : <span className="badge badge-warning">In Progress</span>
                    }
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {saveToast && (
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


