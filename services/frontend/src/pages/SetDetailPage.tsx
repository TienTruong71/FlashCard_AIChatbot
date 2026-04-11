import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Typography, Tabs, Button, Table, Space, Tag, message, Modal, Form, Input, Select, Switch } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { setApi, questionApi } from '../api'
import type { Set, Question, Quiz } from '../types'

const { Title, Text } = Typography
const { Option } = Select

export const SetDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [setInfo, setSetInfo] = useState<Set | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false)
  const [isQuizModalOpen, setQuizModalOpen] = useState(false)
  const [qForm] = Form.useForm()
  const [quizForm] = Form.useForm()

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [infoRes, qRes, quizRes] = await Promise.all([
        setApi.retrieve(Number(id)),
        questionApi.list({ set: id }),
        setApi.listQuizzes(Number(id))
      ])
      
      setSetInfo(infoRes.data?.data || null)
      setQuestions(qRes.data?.data || [])
      setQuizzes(quizRes.data?.data || [])
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu chi tiết')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleCreateQuestion = async (values: any) => {
    try {
      const { title, type, answers } = values
      
      if (type === 'single') {
        const correctCount = answers.filter((a: any) => a.is_correct).length
        if (answers.length < 2) return message.error('Câu hỏi một đáp án phải có ít nhất 2 phương án!')
        if (correctCount !== 1) return message.error('Phải có duy nhất 1 đáp án đúng!')
      } else if (type === 'checkbox') {
        const correctCount = answers.filter((a: any) => a.is_correct).length
        if (answers.length < 2) return message.error('Câu hỏi nhiều đáp án phải có ít nhất 2 phương án!')
        if (correctCount < 1) return message.error('Phải có ít nhất 1 đáp án đúng!')
      } else if (type === 'text') {
        if (answers.length !== 1) return message.error('Câu hỏi tự luận chỉ có duy nhất 1 đáp án đúng!')
        if (!answers[0].is_correct) return message.error('Đáp án duy nhất phải được đánh dấu là đúng!')
      }

      const payload = { title, type, answers }
      await setApi.createQuestion(Number(id), payload)
      
      message.success('Thêm câu hỏi thành công!')
      setQuestionModalOpen(false)
      qForm.resetFields()
      fetchData()
    } catch (error: any) {
      if (error.response?.data?.message) {
         message.error(error.response.data.message)
      } else {
         message.error('Lỗi thêm câu hỏi')
      }
    }
  }

  const handleCreateQuiz = async (values: any) => {
    try {
      await setApi.createQuiz(Number(id), {
        title: values.title,
        question_count: Number(values.question_count),
        is_published: values.is_published
      })
      message.success('Tạo học phần (Quiz) thành công!')
      setQuizModalOpen(false)
      quizForm.resetFields()
      fetchData()
    } catch (error: any) {
      if (error.response?.data?.message) {
         message.error(error.response.data.message)
      } else {
         message.error('Lỗi tạo học phần')
      }
    }
  }

  const deleteQuestion = async (qId: number) => {
    try {
      await questionApi.destroy(qId)
      message.success('Xóa câu hỏi thành công')
      fetchData()
    } catch {
      message.error('Lỗi xóa')
    }
  }

  const qColumns = [
    { title: 'Nội dung', dataIndex: 'content', key: 'content', render: (text: string) => <span style={{color: '#fff'}}>{text || '-'}</span> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: (date: string) => <span style={{color: '#aaa'}}>{new Date(date).toLocaleDateString()}</span> },
    { 
      title: 'Hành động', 
      key: 'actions',
      render: (_: any, record: Question) => (
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => deleteQuestion(record.id)} />
      )
    }
  ]

  const quizColumns = [
    { title: 'Tên Học Phần', dataIndex: 'title', key: 'title', render: (t: string, r: Quiz) => <Link style={{color:'#9254de', fontWeight: 500}} to={`/quizzes/${r.id}`}>{t}</Link> },
    { title: 'Số câu', dataIndex: 'question_count', key: 'count', render: (c: number) => <span style={{color: '#fff'}}>{c}</span> },
    { title: 'Trạng thái', dataIndex: 'is_published', key: 'status', render: (p: boolean) => p ? <Tag color="success">Đã xuất bản</Tag> : <Tag color="warning">Bản nháp</Tag> },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: (date: string) => <span style={{color: '#aaa'}}>{new Date(date).toLocaleDateString()}</span> }
  ]

  if (!setInfo) return null

  return (
    <div style={{ padding: '24px 0' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/sets')} style={{ paddingLeft: 0, marginBottom: 16 }}>
        Quay lại
      </Button>

      <Card className="glass-card" bordered={false} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>{setInfo.title}</Title>
            <Text style={{ color: '#aaa', fontSize: 16 }}>{setInfo.description || 'Không có mô tả'}</Text>
            <div style={{ marginTop: 12 }}>
               {setInfo.is_public ? <Tag color="blue">Công khai</Tag> : <Tag color="default">Riêng tư</Tag>}
            </div>
          </div>
          <Space>
             <Button type="primary" ghost icon={<PlayCircleOutlined />} onClick={() => setQuizModalOpen(true)}>
               Tạo Quiz ngẫu nhiên
             </Button>
          </Space>
        </div>
      </Card>

      <Tabs 
        defaultActiveKey="1" 
        className="dark-tabs"
        items={[
          {
            key: '1',
            label: 'Danh sách Câu hỏi',
            children: (
              <Card className="glass-card table-dark" bordered={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Title level={4} style={{ color: '#fff' }}>Ngân hàng ({questions.length})</Title>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setQuestionModalOpen(true)}>Thêm câu hỏi</Button>
                </div>
                <Table columns={qColumns} dataSource={questions} rowKey="id" loading={loading} />
              </Card>
            )
          },
          {
            key: '2',
            label: 'Học phần / Bài kiểm tra (Quizzes)',
            children: (
              <Card className="glass-card table-dark" bordered={false}>
                 <Table columns={quizColumns} dataSource={quizzes} rowKey="id" loading={loading} />
              </Card>
            )
          }
        ]}
      />

      <Modal 
        title="Thêm câu hỏi mới" 
        open={isQuestionModalOpen} 
        onCancel={() => setQuestionModalOpen(false)} 
        footer={null} 
        width={700}
        className="dark-modal"
      >
         <Form 
           form={qForm} 
           layout="vertical" 
           onFinish={handleCreateQuestion}
           initialValues={{ 
             type: 'single', 
             answers: [{ content: '', is_correct: false }, { content: '', is_correct: false }] 
           }}
         >
            <Form.Item name="title" label="Nội dung câu hỏi" rules={[{required:true, message: 'Vui lòng nhập nội dung!'}]}>
              <Input.TextArea rows={3} placeholder="Nhập câu hỏi tại đây..." />
            </Form.Item>
            
            <Form.Item name="type" label="Loại câu hỏi" rules={[{required:true}]}>
              <Select onChange={(val) => {
                const currentAnswers = qForm.getFieldValue('answers') || []
                if (val === 'text' && currentAnswers.length !== 1) {
                  qForm.setFieldsValue({ answers: [{ content: '', is_correct: true }] })
                } else if (val !== 'text' && currentAnswers.length < 2) {
                  qForm.setFieldsValue({ answers: [{ content: '', is_correct: false }, { content: '', is_correct: false }] })
                }
              }}>
                <Option value="single">Một đáp án (Radio)</Option>
                <Option value="checkbox">Nhiều đáp án (Checkbox)</Option>
                <Option value="text">Văn bản (Tự luận / Điền từ)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Danh sách đáp án">
              <Form.List name="answers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'content']}
                          rules={[{ required: true, message: 'Nhập đáp án!' }]}
                        >
                          <Input placeholder="Nội dung đáp án" style={{ width: 450 }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'is_correct']}
                          valuePropName="checked"
                        >
                          <Switch unCheckedChildren="Sai" checkedChildren="Đúng" />
                        </Form.Item>
                        {fields.length > 1 && qForm.getFieldValue('type') !== 'text' && (
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                        )}
                      </Space>
                    ))}
                    {qForm.getFieldValue('type') !== 'text' && (
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Thêm phương án
                        </Button>
                      </Form.Item>
                    )}
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => setQuestionModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit">Lưu câu hỏi</Button>
              </Space>
            </Form.Item>
         </Form>
      </Modal>

      {/* Modal Create Quiz */}
      <Modal title="Tạo Học phần (Quiz) từ bộ này" open={isQuizModalOpen} onCancel={() => setQuizModalOpen(false)} footer={null} className="dark-modal">
         <Form form={quizForm} layout="vertical" onFinish={handleCreateQuiz}>
            <Form.Item name="title" label="Tên bài kiểm tra" rules={[{required:true}]}>
              <Input />
            </Form.Item>
            <Form.Item name="question_count" label="Số lượng câu hỏi (chọn ngẫu nhiên)" rules={[{required:true}]}>
              <Input type="number" min={1} />
            </Form.Item>
            <Form.Item name="is_published" label="Xuất bản ngay?" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Button type="primary" htmlType="submit" style={{width:'100%'}}>Tạo Bài</Button>
         </Form>
      </Modal>
    </div>
  )
}
