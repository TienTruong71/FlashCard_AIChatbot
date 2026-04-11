import { Button, Row, Col, Typography } from 'antd'
import { motion } from 'framer-motion'
import { Rocket, ArrowRight } from 'lucide-react'

const { Title, Paragraph } = Typography

export const Hero = () => {
  return (
    <section style={{
      padding: '120px 20px 80px',
      textAlign: 'center',
      position: 'relative',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(114, 46, 209, 0.15) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ width: '100%', position: 'relative', zIndex: 1 }}
      >
        <Row justify="center">
          <Col xs={24} md={18} lg={14}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '24px'
            }}>
              <Rocket size={16} color="#722ed1" />
              <Typography.Text style={{ color: '#aaa', fontSize: '14px' }}>
                Chào mừng tới kỷ nguyên mới của Quiz & Learning
              </Typography.Text>
            </div>

            <Title className="text-gradient" style={{ fontSize: '64px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-2px' }}>
              Nâng tầm kỹ năng với nền tảng học tập thông minh
            </Title>

            <Paragraph style={{ fontSize: '20px', color: '#aaa', marginBottom: '40px', lineHeight: '1.6' }}>
              Trải nghiệm học tập và ôn luyện cá nhân hóa với hệ thống câu hỏi đa dạng,
              tương tác trực tuyến thời gian thực và báo cáo tiến độ chi tiết.
            </Paragraph>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button type="primary" size="large" style={{ height: '56px', padding: '0 40px', fontSize: '18px' }}>
                Bắt đầu ngay <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </Button>
              <Button size="large" ghost style={{ height: '56px', padding: '0 40px', fontSize: '18px', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                Tìm hiểu thêm
              </Button>
            </div>
          </Col>
        </Row>
      </motion.div>
    </section>
  )
}
