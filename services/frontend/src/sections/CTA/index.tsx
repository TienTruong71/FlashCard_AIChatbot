import { Button, Typography } from 'antd'
import { motion } from 'framer-motion'

const { Title, Paragraph } = Typography

export const CTA = () => {
  return (
    <section style={{ padding: '100px 20px', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card"
        style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          padding: '80px 40px',
          background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
          border: '1px solid rgba(114, 46, 209, 0.3)'
        }}
      >
        <Title style={{ color: '#fff', fontSize: '48px', fontWeight: 800, marginBottom: '24px' }}>
          Sẵn sàng bắt đầu hành trình?
        </Title>
        <Paragraph style={{ color: '#aaa', fontSize: '20px', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px' }}>
          Gia nhập cộng đồng hàng ngàn người học thông thái ngay hôm nay và nhận bộ tài liệu độc quyền hoàn toàn miễn phí.
        </Paragraph>
        <Button 
          type="primary" 
          size="large" 
          style={{ 
            height: '64px', 
            padding: '0 60px', 
            fontSize: '20px',
            background: '#722ed1',
            boxShadow: '0 8px 24px rgba(114, 46, 209, 0.4)'
          }}
        >
          Tham gia miễn phí
        </Button>
      </motion.div>
    </section>
  )
}
