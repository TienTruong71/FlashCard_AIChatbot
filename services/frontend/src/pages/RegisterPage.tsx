import { Button, Form, Input, Card, Typography, message } from 'antd'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useState } from 'react'

const { Title, Text } = Typography

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      await authApi.register({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
      })
      message.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error: any) {
      if (error.response?.data?.message) {
         message.error(error.response.data.message)
      } else {
         message.error('Đăng ký thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 0' }}>
      <Card
        className="glass-card"
        style={{ width: 450, padding: '20px' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Tạo tài khoản</Title>
          <Text style={{ color: '#aaa' }}>Tham gia cộng đồng học tập ngay hôm nay</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="first_name"
              rules={[{ required: true, message: 'Nhập tên!' }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<UserOutlined />} placeholder="Tên" />
            </Form.Item>
            <Form.Item
              name="last_name"
              rules={[{ required: true, message: 'Nhập họ!' }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<UserOutlined />} placeholder="Họ" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải lớn hơn 6 ký tự!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}
          >
             <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item style={{ marginTop: '30px' }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Đăng ký
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#aaa' }}>
              Đã có tài khoản? <Link to="/login" style={{ color: '#722ed1' }}>Đăng nhập</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}
