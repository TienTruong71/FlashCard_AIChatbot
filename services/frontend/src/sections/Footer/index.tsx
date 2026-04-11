import { Row, Col, Typography, Space, Button } from 'antd'
import { FacebookOutlined, TwitterOutlined, InstagramOutlined, GithubOutlined, MailOutlined } from '@ant-design/icons'

const { Title, Text, Link } = Typography

export const Footer = () => {
  return (
    <footer style={{ 
      padding: '80px 20px 40px', 
      background: 'rgba(0,0,0,0.5)', 
      borderTop: '1px solid rgba(255,255,255,0.05)',
      marginTop: '60px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[40, 40]}>
          <Col xs={24} md={8}>
            <Title level={4} className="text-gradient" style={{ marginBottom: '20px' }}>
              Quiz App
            </Title>
            <Text style={{ color: '#777', display: 'block', marginBottom: '24px' }}>
              Nền tảng học tập trực tuyến hàng đầu tại Việt Nam, mang đến trải nghiệm ôn luyện 
              hiệu quả và đầy hứng khởi cho mọi đối tượng.
            </Text>
            <Space size="large">
              <Link href="#" style={{ color: '#777' }}><FacebookOutlined style={{ fontSize: '20px' }} /></Link>
              <Link href="#" style={{ color: '#777' }}><TwitterOutlined style={{ fontSize: '20px' }} /></Link>
              <Link href="#" style={{ color: '#777' }}><InstagramOutlined style={{ fontSize: '20px' }} /></Link>
              <Link href="#" style={{ color: '#777' }}><GithubOutlined style={{ fontSize: '20px' }} /></Link>
            </Space>
          </Col>
          
          <Col xs={12} md={4}>
            <Title level={5} style={{ color: '#fff', marginBottom: '24px' }}>Sản phẩm</Title>
            <Space direction="vertical">
              <Link href="#" style={{ color: '#777' }}>Khóa học</Link>
              <Link href="#" style={{ color: '#777' }}>Thư viện Quiz</Link>
              <Link href="#" style={{ color: '#777' }}>Xếp hạng</Link>
              <Link href="#" style={{ color: '#777' }}>Giá cả</Link>
            </Space>
          </Col>

          <Col xs={12} md={4}>
            <Title level={5} style={{ color: '#fff', marginBottom: '24px' }}>Công ty</Title>
            <Space direction="vertical">
              <Link href="#" style={{ color: '#777' }}>Giới thiệu</Link>
              <Link href="#" style={{ color: '#777' }}>Tuyển dụng</Link>
              <Link href="#" style={{ color: '#777' }}>Blog</Link>
              <Link href="#" style={{ color: '#777' }}>Đối tác</Link>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Title level={5} style={{ color: '#fff', marginBottom: '24px' }}>Đăng ký nhận tin</Title>
            <Text style={{ color: '#777', display: 'block', marginBottom: '16px' }}>
              Nhận thông tin mới nhất về các khóa học và ưu đãi hấp dẫn.
            </Text>
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px', 
              padding: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <input 
                type="text" 
                placeholder="Email của bạn..." 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '8px 16px',
                  flex: 1,
                  outline: 'none'
                }} 
              />
              <Button type="primary" icon={<MailOutlined />} />
            </div>
          </Col>
        </Row>
        
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          marginTop: '60px', 
          paddingTop: '30px',
          textAlign: 'center'
        }}>
          <Text style={{ color: '#555', fontSize: '14px' }}>
            © {new Date().getFullYear()} Quiz App. All rights reserved. Made with ❤️ for learning.
          </Text>
        </div>
      </div>
    </footer>
  )
}
