import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Typography, Button, Space, message, Spin, Result, Radio, Checkbox, Input, Row, Col, Progress, Divider, Tag } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { testApi, quizApi } from '../api'
import type { Quiz, QuizQuestion, Test } from '../types'
import { debounce } from 'lodash'

const { Title, Text } = Typography

export const TestPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isReview = searchParams.get('review') === 'true'
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testInfo, setTestInfo] = useState<Test | null>(null)
  const [quizInfo, setQuizInfo] = useState<Quiz & { questions: QuizQuestion[] } | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initTest = async () => {
      try {
        setLoading(true)
        let tInfo: Test | null = null

        if (!isReview) {
          await testApi.start(Number(id))
        }

        const testRes = await testApi.retrieve(Number(id))
        tInfo = testRes.data?.data || null
        setTestInfo(tInfo)

        if (tInfo) {
          const quizRes = await quizApi.retrieve(tInfo.quiz)
          setQuizInfo(quizRes.data?.data as any)

          if (isReview) {
            const resultRes = await testApi.results(Number(id))
            setTestResult(resultRes.data?.data)
          }
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Lỗi tải bài thi')
      } finally {
        setLoading(false)
      }
    }
    initTest()
  }, [id, isReview])


  const saveAnswer = async (qId: number, payload: any) => {
    setSaving(true)
    try {
      await testApi.saveAnswer(Number(id), qId, payload)
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  const debouncedSave = useCallback(
    debounce((qId: number, text: string) => {
      saveAnswer(qId, { text })
    }, 1000),
    [id]
  )

  const handleAnswerChange = (qId: number, type: string, value: any) => {
    const newUserAnswers = { ...userAnswers, [qId]: value }
    setUserAnswers(newUserAnswers)

    let payload: any = {}
    if (type === 'single') {
      payload = { quiz_question_answer_id: value }
    } else if (type === 'checkbox') {
      payload = { answer_ids: value }
    } else if (type === 'text') {
      payload = { text: value }
      debouncedSave(qId, value)
      return
    }

    saveAnswer(qId, payload)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await testApi.submit(Number(id))
      message.success('Nộp bài thành công!')
      setTestResult(res.data?.data)
      navigate(`/tests/${id}?review=true`, { replace: true })
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Lỗi nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="Đang tải bài thi..." /></div>

  if (isReview && testResult) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/quizzes/${testInfo?.quiz}`)} style={{ paddingLeft: 0, marginBottom: 16 }}>
          Quay lại Học phần
        </Button>
        <Card className="glass-card" bordered={false}>
          <Result
            status={testResult.score >= 50 ? 'success' : 'warning'}
            title={<span style={{ color: '#fff', fontSize: '28px' }}>Hoàn thành: {testResult.score}%</span>}
            subTitle={
              <Space direction="vertical" style={{ color: '#aaa', marginTop: 16 }}>
                <Text style={{ color: '#aaa' }}>Số câu đúng: {testResult.correct} / {testResult.total}</Text>
                <Text style={{ color: '#aaa' }}><ClockCircleOutlined /> Thời gian làm bài: {testResult.time_spent} giây</Text>
              </Space>
            }
            extra={[
              <Button type="primary" size="large" key="back" onClick={() => navigate(`/quizzes/${testInfo?.quiz}`)}>
                Về trang học phần
              </Button>,
              <Button key="sets" size="large" onClick={() => navigate('/sets')}>
                Xem các bộ khác
              </Button>
            ]}
          />
        </Card>
      </div>
    )
  }

  if (!quizInfo || !quizInfo.questions) return <Result status="404" title="Không tìm thấy dữ liệu câu hỏi" />

  const currentQuestion = quizInfo.questions[currentIndex]
  const progress = ((currentIndex + 1) / quizInfo.questions.length) * 100

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>{quizInfo.title}</Title>
              <Text style={{ color: '#aaa' }}>Câu hỏi {currentIndex + 1} / {quizInfo.questions.length}</Text>
            </div>
            <Space>
              {saving && <Text style={{ color: '#52c41a' }}><Spin size="small" style={{ marginRight: 8 }} /> Đang lưu...</Text>}
              <Button type="primary" danger loading={submitting} onClick={handleSubmit}>Nộp bài</Button>
            </Space>
          </div>

          <Progress percent={Math.round(progress)} strokeColor="#722ed1" status="active" style={{ marginBottom: 32 }} />

          <Card className="glass-card" bordered={false} style={{ minHeight: '400px' }}>
            <div style={{ marginBottom: 32 }}>
              <Tag color="purple" style={{ marginBottom: 12 }}>
                {currentQuestion.type === 'single' ? 'Một đáp án' : currentQuestion.type === 'checkbox' ? 'Nhiều đáp án' : 'Tự luận'}
              </Tag>
              <Title level={4} style={{ color: '#fff', lineHeight: '1.6' }}>
                {currentQuestion.title}
              </Title>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <div style={{ padding: '16px 0' }}>
              {currentQuestion.type === 'single' && (
                <Radio.Group
                  style={{ width: '100%' }}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, 'single', e.target.value)}
                  value={userAnswers[currentQuestion.id]}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentQuestion.answers.map(ans => (
                      <Card
                        key={ans.id}
                        size="small"
                        hoverable
                        style={{
                          background: userAnswers[currentQuestion.id] === ans.id ? 'rgba(114, 46, 209, 0.2)' : 'rgba(255,255,255,0.05)',
                          borderColor: userAnswers[currentQuestion.id] === ans.id ? '#722ed1' : 'transparent',
                          transition: 'all 0.3s'
                        }}
                        onClick={() => handleAnswerChange(currentQuestion.id, 'single', ans.id)}
                      >
                        <Radio value={ans.id} style={{ color: '#fff', width: '100%' }}>
                          {ans.content}
                        </Radio>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )}

              {currentQuestion.type === 'checkbox' && (
                <Checkbox.Group
                  style={{ width: '100%' }}
                  onChange={(values) => handleAnswerChange(currentQuestion.id, 'checkbox', values)}
                  value={userAnswers[currentQuestion.id] || []}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentQuestion.answers.map(ans => (
                      <Card
                        key={ans.id}
                        size="small"
                        hoverable
                        style={{
                          background: (userAnswers[currentQuestion.id] || []).includes(ans.id) ? 'rgba(114, 46, 209, 0.2)' : 'rgba(255,255,255,0.05)',
                          borderColor: (userAnswers[currentQuestion.id] || []).includes(ans.id) ? '#722ed1' : 'transparent',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Checkbox value={ans.id} style={{ color: '#fff', width: '100%' }}>
                          {ans.content}
                        </Checkbox>
                      </Card>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}

              {currentQuestion.type === 'text' && (
                <Input.TextArea
                  rows={4}
                  placeholder="Nhập câu trả lời của bạn..."
                  onChange={(e) => handleAnswerChange(currentQuestion.id, 'text', e.target.value)}
                  value={userAnswers[currentQuestion.id] || ''}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
                />
              )}
            </div>
          </Card>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              size="large"
            >
              Câu trước
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              disabled={currentIndex === quizInfo.questions.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              size="large"
            >
              Câu tiếp theo
            </Button>
          </div>
        </Col>

        <Col xs={24} md={6}>
          <Card
            title={<span style={{ color: '#fff' }}>Danh sách câu hỏi</span>}
            className="glass-card"
            bordered={false}
          >
            <Row gutter={[8, 8]}>
              {quizInfo.questions.map((q, idx) => (
                <Col span={6} key={q.id}>
                  <Button
                    type={currentIndex === idx ? 'primary' : (userAnswers[q.id] ? 'default' : 'dashed')}
                    style={{
                      width: '100%',
                      height: '40px',
                      background: currentIndex === idx ? '#722ed1' : (userAnswers[q.id] ? 'rgba(114, 46, 209, 0.3)' : 'transparent'),
                      borderColor: currentIndex === idx || userAnswers[q.id] ? '#722ed1' : 'rgba(255,255,255,0.2)',
                      color: '#fff'
                    }}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </Button>
                </Col>
              ))}
            </Row>

            <div style={{ marginTop: 24, color: '#aaa', fontSize: '12px' }}>
              <Space direction="vertical" size="small">
                <div><Button size="small" type="primary" style={{ width: 20, height: 20, padding: 0, marginRight: 8 }} /> Đang chọn</div>
                <div><Button size="small" style={{ width: 20, height: 20, padding: 0, marginRight: 8, background: 'rgba(114, 46, 209, 0.3)' }} /> Đã trả lời</div>
                <div><Button size="small" type="dashed" style={{ width: 20, height: 20, padding: 0, marginRight: 8 }} /> Chưa trả lời</div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
