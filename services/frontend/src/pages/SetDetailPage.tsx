import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Form, Input, Switch, message, Modal, Slider, Space, Select } from 'antd'
import { setApi, questionApi } from '../api'
import type { Set, Question, Quiz } from '../types'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { Share2, Plus, Trash2, ChevronRight, Eye, MinusCircle, Sparkles, BookOpen, Pencil } from 'lucide-react'
import { useBreadcrumbStore } from '../store/breadcrumbStore'
import { useAuthStore } from '../store/authStore'

type QuestionType = 'single' | 'checkbox' | 'text'

export const SetDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]

  const [setInfo, setSetInfo] = useState<Set | null>(null)
  const { setTitle } = useBreadcrumbStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isQuizModalOpen, setQuizModalOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['single', 'text'])
  const [questionCount, setQuestionCount] = useState(25)
  const [collaboratorInput, setCollaboratorInput] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view')
  const [sharing, setSharing] = useState(false)

  const [quizMode, setQuizMode] = useState<'random' | 'manual'>('random')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])

  const [qForm] = Form.useForm()
  const [quizForm] = Form.useForm()

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [infoRes, qRes, quizRes] = await Promise.all([
        setApi.retrieve(Number(id)),
        questionApi.list({ set: id }),
        setApi.listQuizzes(Number(id)),
      ])
      const setData = infoRes.data?.data
      if (setData) {
        setSetInfo(setData)
        setIsPublic(setData.is_public || false)
        setTitle(id, setData.title)
      }
      setQuestions(qRes.data?.data || [])
      setQuizzes(quizRes.data?.data || [])
    } catch {
      message.error(t.common_error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  // Sync Slider value when questions load
  useEffect(() => {
    if (questions.length > 0) {
      setQuestionCount(prev => Math.min(prev, questions.length) || Math.min(25, questions.length))
    } else {
      setQuestionCount(0)
    }
  }, [questions.length])

  const handleCreateQuestion = async (values: any) => {
    try {
      const { title, type, answers } = values
      if (type === 'single') {
        const correctCount = answers.filter((a: any) => a.is_correct).length
        if (answers.length < 2) return message.error('At least 2 options required!')
        if (correctCount !== 1) return message.error('Exactly 1 correct answer required!')
      } else if (type === 'checkbox') {
        const correctCount = answers.filter((a: any) => a.is_correct).length
        if (answers.length < 2) return message.error('At least 2 options required!')
        if (correctCount < 1) return message.error('At least 1 correct answer required!')
      } else if (type === 'text') {
        if (answers.length !== 1) return message.error('Text questions need exactly 1 answer!')
        if (!answers[0].is_correct) return message.error('The answer must be marked correct!')
      }

      if (editingQuestion) {
        await questionApi.update(editingQuestion.id, { title, type, answers })
        message.success(t.common_success)
      } else {
        await setApi.createQuestion(Number(id), { title, type, answers })
        message.success(t.common_success)
      }

      setQuestionModalOpen(false)
      setEditingQuestion(null)
      qForm.resetFields()
      fetchData()
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    }
  }

  const openEditModal = (q: Question) => {
    setEditingQuestion(q)
    qForm.setFieldsValue({
      title: q.title,
      type: q.type,
      answers: q.answers || []
    })
    setQuestionModalOpen(true)
  }

  const handleCreateQuiz = async (values: any) => {
    try {
      const payload: any = {
        title: values.title,
        is_published: values.is_published,
      }

      if (quizMode === 'random') {
        payload.question_count = Math.min(Number(values.question_count), questions.length)
      } else {
        if (selectedQuestionIds.length === 0) return message.error('Vui lòng chọn ít nhất 1 câu hỏi!')
        payload.question_ids = selectedQuestionIds
      }

      const res = await setApi.createQuiz(Number(id), payload)
      message.success(t.common_success)
      setQuizModalOpen(false)
      quizForm.resetFields()
      fetchData()
      const quizId = res.data?.data?.id
      if (quizId) navigate(`/quizzes/${quizId}`)
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    }
  }

  const handleShareSet = async () => {
    if (!id || !shareEmail) return
    setSharing(true)
    try {
      await setApi.share(Number(id), {
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

  const handleDeleteSet = () => {
    Modal.confirm({
      title: 'Xóa bộ học phần?',
      content: 'Bạn có chắc chắn muốn xóa bộ học phần này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await setApi.destroy(Number(id))
          message.success('Đã xóa bộ học phần')
          navigate('/sets')
        } catch {
          message.error(t.common_error)
        }
      }
    })
  }

  const deleteQuestion = async (qId: number) => {
    try {
      await questionApi.destroy(qId)
      message.success(t.common_success)
      fetchData()
    } catch {
      message.error(t.common_error)
    }
  }

  const getTypeLabel = (type: string) => {
    if (type === 'single') return t.qt_single
    if (type === 'checkbox') return t.qt_checkbox
    if (type === 'text') return t.qt_text
    return type.toUpperCase()
  }

  const getTypeBadgeColor = (type: string) => {
    if (type === 'single') return '#3d39cc'
    if (type === 'checkbox') return '#a855f7'
    return '#f59e0b'
  }

  if (!setInfo) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      {loading ? t.common_loading : 'Set not found'}
    </div>
  )

  const previewQuestions = questions.slice(0, 5)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 }}>
        <div>
          <h1 className="page-title">{setInfo.title}</h1>
          <p className="page-subtitle">{t.config_subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ gap: 8 }} onClick={() => setIsShareModalOpen(true)}>
            <Share2 size={16} /> {t.ai_share}
          </button>

          {setInfo.permission === 'edit' && (
            <button className="btn btn-danger-ghost" style={{ gap: 8 }} onClick={handleDeleteSet}>
              <Trash2 size={16} /> {t.common_delete}
            </button>
          )}

          <button className="btn btn-primary" onClick={() => message.info('Draft saved!')}>
            {t.config_saveDraft}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="config-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'flex-start' }}>
        {/* Left: Set Management (Primary) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Question List Area */}
          <div className="config-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Danh sách câu hỏi trong bộ học (Set)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Eye size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, background: 'var(--bg)', padding: '3px 8px', borderRadius: 4 }}>
                  {t.config_showingQuestions
                    .replace('{shown}', String(previewQuestions.length))
                    .replace('{total}', String(questions.length))}
                </span>
              </div>
            </div>

            {/* Add Question button */}
            <button
              className="btn btn-outline w-full"
              style={{ marginBottom: 12, justifyContent: 'center', gap: 6, borderStyle: 'dashed' }}
              onClick={() => setQuestionModalOpen(true)}
            >
              <Plus size={14} /> {t.config_addQuestion} (Set)
            </button>

            {/* Question preview cards */}
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>{t.common_loading}</p>
            ) : previewQuestions.length === 0 ? (
              <div className="preview-question-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                {t.config_noQuestions}
              </div>
            ) : (
              previewQuestions.map((q) => (
                <div key={q.id} className="preview-question-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                      color: getTypeBadgeColor(q.type), textTransform: 'uppercase',
                    }}>
                      {getTypeLabel(q.type)}
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => openEditModal(q)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, lineHeight: 1.4 }}>{q.title}</p>
                </div>
              ))
            )}

            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, color: 'var(--primary)', fontWeight: 600 }}
              onClick={fetchData}
            >
              ↺ {t.config_regeneratePreview}
            </button>
          </div>

          {/* Visibility & Sharing */}
          <div className="config-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Share2 size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{t.config_visibility}</span>
            </div>

            <div className="toggle-group" style={{ marginBottom: 20 }}>
              <button className={`toggle-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
                {t.config_private}
              </button>
              <button className={`toggle-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
                {t.config_public}
              </button>
            </div>

            {isPublic && (
              <>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>{t.config_addCollaborators}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder={t.config_collaboratorPlaceholder}
                    value={collaboratorInput}
                    onChange={e => setCollaboratorInput(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => setCollaboratorInput('')}>
                    <Plus size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quizzes section */}
          <div className="config-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.config_quizzes}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quizzes.length}</span>
            </div>
            {quizzes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.config_noQuizzes}</p>
            ) : (
              quizzes.map(quiz => (
                <Link key={quiz.id} to={`/quizzes/${quiz.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8,
                    marginBottom: 8, background: 'white', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{quiz.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quiz.question_count} {t.config_questions}</p>
                    </div>
                    <span className={`badge ${quiz.is_published ? 'badge-success' : 'badge-draft'}`}>
                      {quiz.is_published ? t.config_published : t.config_draft}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Quiz Generator (Secondary / Extraction Tool) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Setup Parameters */}
          <div className="config-panel" style={{ border: '1px solid var(--primary-light)', background: 'rgba(61, 57, 204, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Sparkles size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{t.config_setupParams}</span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Trích xuất một số lượng câu hỏi ngẫu nhiên từ bộ học này để tạo bài kiểm tra Quiz riêng.
            </p>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">{t.config_numberOfQuestions}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Slider
                    min={questions.length > 0 ? 1 : 0}
                    max={questions.length > 0 ? questions.length : 1}
                    value={questions.length === 0 ? 0 : questionCount}
                    onChange={setQuestionCount}
                    disabled={questions.length === 0}
                    trackStyle={{ background: 'var(--primary)' }}
                    handleStyle={{ borderColor: 'var(--primary)', background: 'var(--primary)' }}
                  />
                </div>
                <div style={{
                  width: 46, height: 34, border: '1px solid var(--border)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, color: 'var(--text)', flexShrink: 0,
                }}>
                  {questions.length === 0 ? 0 : questionCount}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ marginTop: 24 }}
              onClick={() => {
                setQuizMode('random')
                quizForm.setFieldsValue({ question_count: questions.length === 0 ? 0 : Math.min(questionCount, questions.length) })
                setQuizModalOpen(true)
              }}
              disabled={questions.length === 0}
            >
              <Plus size={13} /> {t.config_createQuiz}
            </button>
            <button
              className="btn btn-outline w-full"
              style={{ marginTop: 10 }}
              onClick={() => {
                setQuizMode('manual')
                setSelectedQuestionIds([])
                setQuizModalOpen(true)
              }}
              disabled={questions.length === 0}
            >
              {t.config_createQuiz} (Thủ công)
            </button>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{editingQuestion ? t.config_editQuestion : t.config_addQuestion}</span>}
        open={isQuestionModalOpen}
        onCancel={() => { setQuestionModalOpen(false); setEditingQuestion(null); qForm.resetFields() }}
        footer={null}
        width={620}
      >
        <Form
          form={qForm}
          layout="vertical"
          onFinish={handleCreateQuestion}
          initialValues={{ type: 'single', answers: [{ content: '', is_correct: false }, { content: '', is_correct: false }] }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="title" label={t.ai_questionStatement} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Enter question here..." />
          </Form.Item>

          <Form.Item name="type" label={t.ai_questionType} rules={[{ required: true }]}>
            <select className="form-input" onChange={(e) => {
              const val = e.target.value
              if (val === 'text') qForm.setFieldsValue({ answers: [{ content: '', is_correct: true }] })
              else if (qForm.getFieldValue('answers')?.length < 2) qForm.setFieldsValue({ answers: [{ content: '', is_correct: false }, { content: '', is_correct: false }] })
            }}>
              <option value="single">{t.qt_single}</option>
              <option value="checkbox">{t.qt_checkbox}</option>
              <option value="text">{t.qt_text}</option>
            </select>
          </Form.Item>

          <Form.Item label={t.ai_answerOptions}>
            <Form.List name="answers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <Form.Item {...rest} name={[name, 'content']} rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder={`Answer ${key + 1}`} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'is_correct']} valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Switch size="small" checkedChildren="✓" unCheckedChildren="✗" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(name)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                          <MinusCircle size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => add()} style={{ marginTop: 4, gap: 4 }}>
                    <Plus size={12} /> Add option
                  </button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => { setQuestionModalOpen(false); qForm.resetFields() }}>
              {t.common_cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              {t.common_save}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Create Quiz Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{t.config_createQuiz} - {quizMode === 'random' ? 'Ngẫu nhiên' : 'Thủ công'}</span>}
        open={isQuizModalOpen}
        onCancel={() => { setQuizModalOpen(false); quizForm.resetFields(); setSelectedQuestionIds([]) }}
        footer={null}
        width={quizMode === 'random' ? 440 : 600}
      >
        <Form form={quizForm} layout="vertical" onFinish={handleCreateQuiz} style={{ marginTop: 16 }}>
          <Form.Item name="title" label={t.config_quizTitle} rules={[{ required: true }]}>
            <Input placeholder="e.g. Midterm Practice Quiz" />
          </Form.Item>

          {quizMode === 'random' ? (
            <Form.Item name="question_count" label={t.config_questionCount} rules={[{ required: true }]}>
              <Input type="number" min={1} max={questions.length} />
            </Form.Item>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
                Chọn câu hỏi ({selectedQuestionIds.length}/{questions.length})
              </label>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                {questions.map(q => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderBottom: '1px solid var(--border-light)' }}>
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(q.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedQuestionIds(prev => [...prev, q.id])
                        else setSelectedQuestionIds(prev => prev.filter(id => id !== q.id))
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: getTypeBadgeColor(q.type), marginRight: 8, textTransform: 'uppercase' }}>
                        {getTypeLabel(q.type)}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>
                        {q.title.length > 80 ? q.title.substring(0, 80) + '...' : q.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Form.Item name="is_published" label={t.config_publishNow} valuePropName="checked">
            <Switch />
          </Form.Item>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => { setQuizModalOpen(false); quizForm.resetFields() }}>
              {t.common_cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={13} /> {t.config_createQuiz}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Share Set Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{t.ai_shareModalTitle || 'Chia sẻ bộ học phần'}</span>}
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={handleShareSet}
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
