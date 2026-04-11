import { useEffect, useState } from 'react'
import { Typography, Row, Col, Card, Statistic, List, Tag, Empty } from 'antd'
import { FolderOpenOutlined, CopyOutlined, TrophyOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { setApi, testApi, quizApi } from '../api'
import type { Set, Quiz } from '../types'

const { Title, Text } = Typography

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const [sets, setSets] = useState<Set[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ sets: 0, quizzes: 0, tests: 0 })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [setsRes, testsRes, quizzesRes] = await Promise.all([
          setApi.list({ page_size: 5 }),
          testApi.list({ page_size: 5 }),
          quizApi.list({ page_size: 5 })
        ])
        
        setSets(setsRes.data?.data || [])
        setQuizzes(quizzesRes.data?.data || [])
        
        setStats({
          sets: setsRes.data?.pagination?.total_items || 0,
          tests: testsRes.data?.pagination?.total_items || 0,
          quizzes: quizzesRes.data?.pagination?.total_items || 0,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
          Chào buổi sáng, {user?.first_name}!
        </Title>
        <Text style={{ color: '#aaa', fontSize: '16px' }}>
          Tuyệt vời khi thấy bạn trở lại. Hãy cùng xem qua tiến độ học tập hôm nay.
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card className="glass-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#aaa' }}>Bộ học phần của bạn</span>}
              value={stats.sets}
              prefix={<FolderOpenOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#aaa' }}>Học phần đã tạo</span>}
              value={stats.quizzes}
              prefix={<CopyOutlined style={{ color: '#13c2c2', marginRight: 8 }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#aaa' }}>Bài kiểm tra đã làm</span>}
              value={stats.tests}
              prefix={<TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title={<span style={{ color: '#fff' }}>Bộ học phần gần đây</span>} className="glass-card" bordered={false} extra={<Link to="/sets" style={{ color: '#722ed1' }}>Xem tất cả</Link>}>
            {sets.length > 0 ? (
              <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={sets}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/sets/${item.id}`} style={{ color: '#fff', fontWeight: 500, fontSize: '16px' }}>{item.title}</Link>}
                      description={<span style={{ color: '#888' }}>{item.description || 'Không có mô tả'}</span>}
                    />
                    {item.is_public ? <Tag color="blue">Công khai</Tag> : <Tag color="default">Riêng tư</Tag>}
                  </List.Item>
                )}
              />
            ) : (
                <Empty description={<span style={{ color: '#888' }}>Chưa có bộ học phần nào</span>} />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span style={{ color: '#fff' }}>Học phần (Quiz) mới</span>} className="glass-card" bordered={false}>
            {quizzes.length > 0 ? (
              <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={quizzes}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/quizzes/${item.id}`} style={{ color: '#fff', fontWeight: 500, fontSize: '16px' }}>{item.title}</Link>}
                      description={<span style={{ color: '#888' }}>{item.question_count} câu hỏi</span>}
                    />
                    {item.is_published ? <Tag color="success">Đã xuất bản</Tag> : <Tag color="warning">Bản nháp</Tag>}
                  </List.Item>
                )}
              />
            ) : (
                <Empty description={<span style={{ color: '#888' }}>Chưa có học phần nào</span>} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
