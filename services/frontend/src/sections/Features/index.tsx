import { Row, Col, Typography, Card } from 'antd'
import { motion } from 'framer-motion'
import { Zap, Shield, Brain, Users, BarChart, Globe } from 'lucide-react'

const { Title, Paragraph } = Typography

const features = [
  {
    icon: <Brain size={32} color="#722ed1" />,
    title: 'Học tập thông minh',
    description: 'Thuật toán cá nhân hóa giúp bạn tập trung vào những mảng kiến thức còn thiếu.'
  },
  {
    icon: <Zap size={32} color="#722ed1" />,
    title: 'Tương tác thời gian thực',
    description: 'Hệ thống socket giúp bạn thi đấu và học tập cùng bạn bè ngay lập tức.'
  },
  {
    icon: <Shield size={32} color="#722ed1" />,
    title: 'Bảo mật tuyệt đối',
    description: 'Dữ liệu và tiến độ của bạn được bảo vệ bởi công nghệ mã hóa hiện đại.'
  },
  {
    icon: <Users size={32} color="#722ed1" />,
    title: 'Cộng đồng lớn mạnh',
    description: 'Kết nối và chia sẻ kiến thức với hàng ngàn người học khác trên toàn cầu.'
  },
  {
    icon: <BarChart size={32} color="#722ed1" />,
    title: 'Phân tích chuyên sâu',
    description: 'Báo cáo chi tiết về điểm mạnh và các lĩnh vực cần cải thiện của bạn.'
  },
  {
    icon: <Globe size={32} color="#722ed1" />,
    title: 'Truy cập mọi nơi',
    description: 'Nền tảng đa thiết bị, học tập mọi lúc, mọi nơi chỉ với kết nối internet.'
  }
]

export const Features = () => {
  return (
    <section style={{ padding: '100px 20px', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <Title level={2} style={{ color: '#fff', fontSize: '40px', fontWeight: 700 }}>
          Tại sao chọn chúng tôi?
        </Title>
        <Paragraph style={{ color: '#aaa', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Cung cấp bộ công cụ toàn diện để bạn chinh phục mọi kỳ thi và mục tiêu học tập.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} justify="center" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <motion.div
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="glass-card" bordered={false} style={{ height: '100%' }}>
                <div style={{ marginBottom: '20px' }}>{feature.icon}</div>
                <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>{feature.title}</Title>
                <Paragraph style={{ color: '#888', marginBottom: 0 }}>
                  {feature.description}
                </Paragraph>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </section>
  )
}
