import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { quizApi, testApi } from '../api'
import type { Quiz, Test, QuizQuestion } from '../types'

import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import {
  Sparkles, Upload, Plus, Trash2, ChevronLeft,
  CheckCircle2, Circle, AlignLeft, Clock3,
  BookOpen, ChevronRight, Play,
} from 'lucide-react'

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
  const [complexity, setComplexity] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
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

      if (quiz?.quiz_questions) {
        setLocalQuestions(quiz.quiz_questions.map((qq: any) => ({
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
        await quizApi.createQuestion(quizInfo.id, {
          title: q.title,
          type: q.type,
          answers: q.answers,
        })
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
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '...' : t.ai_saveSet}
          </button>
          {quizInfo.is_published && (
            <button className="btn btn-success" onClick={handleStartTest}>
              <Play size={13} style={{ marginRight: 6 }} /> {t.config_startTest}
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
                      style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '4px 8px', fontSize: 12, color: 'var(--text)',
                        fontFamily: 'var(--font)', cursor: 'pointer', background: 'white',
                      }}
                    >
                      <option value="single">{t.qt_single}</option>
                      <option value="checkbox">{t.qt_checkbox}</option>
                      <option value="text">{t.qt_text}</option>
                    </select>
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                  {t.ai_questionStatement}
                </p>
                <textarea
                  className="form-input form-textarea"
                  style={{ marginBottom: 16, resize: 'vertical', minHeight: 70 }}
                  placeholder="What is the primary purpose of..."
                  value={q.title}
                  onChange={e => updateQuestion(qIdx, 'title', e.target.value)}
                />

                {/* Answers */}
                {q.type !== 'text' ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t.ai_answerOptions}
                    </p>
                    {q.answers.map((ans, aIdx) => (
                      <div key={aIdx} style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                        padding: '10px 14px',
                        border: `1.5px solid ${ans.is_correct ? 'var(--success)' : 'var(--border)'}`,
                        borderRadius: 10,
                        background: ans.is_correct ? 'var(--success-bg)' : 'white',
                      }}>
                        <button
                          onClick={() => updateAnswer(qIdx, aIdx, 'is_correct', !ans.is_correct)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {ans.is_correct
                            ? <CheckCircle2 size={18} color="var(--success)" />
                            : <Circle size={18} color="var(--text-muted)" />
                          }
                        </button>
                        <input
                          className="form-input"
                          style={{ border: 'none', padding: '0 4px', flex: 1, background: 'transparent', fontWeight: ans.is_correct ? 600 : 400 }}
                          placeholder={`Option ${aIdx + 1}`}
                          value={ans.content}
                          onChange={e => updateAnswer(qIdx, aIdx, 'content', e.target.value)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addAnswer(qIdx)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--primary)', fontSize: 12, gap: 4, marginTop: 4 }}
                    >
                      <Plus size={12} /> Add option
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t.ai_correctAnswer}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid var(--success)', borderRadius: 10, background: 'var(--success-bg)' }}>
                      <AlignLeft size={16} color="var(--success)" />
                      <input
                        className="form-input"
                        style={{ border: 'none', padding: '0 4px', flex: 1, background: 'transparent', fontWeight: 600, color: 'var(--success)' }}
                        placeholder="Correct answer..."
                        value={q.answers[0]?.content || ''}
                        onChange={e => {
                          if (q.answers.length === 0) addAnswer(qIdx)
                          updateAnswer(qIdx, 0, 'content', e.target.value)
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))
          )}

          {/* Add New Card */}
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
        </div>

        {/* Right: AI Panel + Insights */}
        <div style={{ position: 'sticky', top: 20 }}>
          {/* AI Generator */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.ai_title}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              {t.ai_desc}
            </p>

            {/* Upload zone */}
            <div
              className="upload-zone"
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); message.info('File uploaded! AI generation coming soon.') }}
              style={{ borderColor: isDragging ? 'var(--primary)' : undefined, background: isDragging ? 'var(--primary-light)' : undefined }}
            >
              <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t.ai_uploadClick}</span>
                {' '}{t.ai_uploadOr}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.ai_uploadTypes}</p>
            </div>

            {/* Complexity */}
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 8 }}>
              {t.ai_complexityLevel}
            </p>
            <div className="toggle-group" style={{ marginBottom: 14 }}>
              {[t.ai_standard, t.ai_academic, t.ai_deepDive].map((level, i) => (
                <button
                  key={i}
                  className={`toggle-btn${complexity === i ? ' active' : ''}`}
                  style={{ fontSize: 11 }}
                  onClick={() => setComplexity(i)}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={() => {
                message.info('Go to the Set page to create a quiz from your questions!')
                navigate(`/sets/${quizInfo?.set}`)
              }}
            >
              {t.ai_generateCards}
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


