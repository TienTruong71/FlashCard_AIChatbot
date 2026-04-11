import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Typography, Button, Table, Space, Tag, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined, ControlOutlined } from '@ant-design/icons'
import { quizApi, testApi } from '../api'
import type { Quiz, Test } from '../types'

const { Title } = Typography

export const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [quizInfo, setQuizInfo] = useState<Quiz | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [infoRes, testsRes] = await Promise.all([
        quizApi.retrieve(Number(id)),
        quizApi.listTests(Number(id))
      ])
      
      setQuizInfo(infoRes.data?.data || null)
      setTests(testsRes.data?.data || [])
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu bài học phần')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleStartTest = async () => {
    try {
      const createRes = await testApi.create({ quiz: Number(id) })
      const testId = createRes.data?.data?.id
      if (testId) {
         navigate(`/tests/${testId}`)
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
         message.error(error.response.data.message)
      } else {
         message.error('Lỗi tạo bài thi mới')
      }
    }
  }

  const columns = [
    { title: 'ID Phiên', dataIndex: 'id', key: 'id' },
    { title: 'Điểm số', dataIndex: 'score', key: 'score', render: (score: number | null) => score !== null ? <span style={{color:'#52c41a', fontWeight: 'bold'}}>{score}%</span> : '-' },
    { title: 'Thời gian', dataIndex: 'created_at', key: 'created_at', render: (date: string) => <span style={{color: '#aaa'}}>{new Date(date).toLocaleString()}</span> },
    { 
      title: 'Hành động', 
      key: 'actions',
      render: (_: any, record: Test) => (
        record.score !== null 
          ? <Link to={`/tests/${record.id}?review=true`}><Button type="default" size="small">Xem lại</Button></Link>
          : <Link to={`/tests/${record.id}`}><Button type="primary" size="small">Tiếp tục thi</Button></Link>
      )
    }
  ]

  if (!quizInfo) return null

  return (
    <div style={{ padding: '24px 0' }}>
       <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/sets/${quizInfo.set}`)} style={{ paddingLeft: 0, marginBottom: 16 }}>
        Quay lại Bộ học phần
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card className="glass-card" bordered={false} style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>{quizInfo.title}</Title>
                <Space style={{ marginTop: 12 }}>
                  {quizInfo.is_published ? <Tag color="success">Đã xuất bản</Tag> : <Tag color="warning">Bản nháp</Tag>}
                  <Tag color="purple"><ControlOutlined /> {quizInfo.question_count} Câu hỏi</Tag>
                </Space>
              </div>
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStartTest} disabled={!quizInfo.is_published}>
                BẮT ĐẦU LÀM BÀI
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glass-card table-dark" bordered={false} title={<span style={{color:'#fff'}}>Lịch sử làm bài</span>}>
            <Table 
              columns={columns} 
              dataSource={tests} 
              rowKey="id" 
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
