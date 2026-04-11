import { Button, Form, Input, Card, Typography, message } from 'antd'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useState, useEffect } from 'react'

const { Title, Text } = Typography

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [showOtp, setShowOtp] = useState(false)
  const [email, setEmail] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showOtp && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearInterval(timer)
  }, [showOtp, countdown])

  const onFinish = async (values: any) => {
    try {
      setOtpLoading(true)
      await authApi.register({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
      })
      setEmail(values.email)
      setShowOtp(true)
      setCountdown(60)
      setCanResend(false)
      message.success('Đã gửi mã OTP vào email của bạn!')
    } catch (error: any) {
      message.error(error.errorMessage || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      setOtpLoading(true)
      await authApi.resendOtp(email)
      setCountdown(60)
      setCanResend(false)
      message.success('Mã OTP mới đã được gửi!')
    } catch (error: any) {
      message.error(error.errorMessage || 'Gửi lại mã thất bại.')
    } finally {
      setOtpLoading(false)
    }
  }

  const onVerifyOtp = async (values: { otp: string }) => {
    try {
      setOtpLoading(true)
      await authApi.verifyOtp({
        email: email,
        otp: values.otp
      })
      message.success('Xác thực thành công! Bạn có thể đăng nhập ngay.')
      navigate('/login')
    } catch (error: any) {
      message.error(error.errorMessage || 'Mã OTP không đúng hoặc đã hết hạn.')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 0' }}>
      <Card
        className="glass-card"
        style={{ width: 450, padding: '20px' }}
        variant="borderless"
      >
        {!showOtp ? (
          <>
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
                <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={otpLoading}>
                  Đăng ký
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text style={{ color: '#aaa' }}>
                  Đã có tài khoản? <Link to="/login" style={{ color: '#722ed1' }}>Đăng nhập</Link>
                </Text>
              </div>
            </Form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Xác thực OTP</Title>
              <Text style={{ color: '#aaa' }}>Mã OTP đã được gửi đến: <br /><b>{email}</b></Text>
              <div style={{ marginTop: '10px' }}>
                <Text type="warning" style={{ fontSize: '12px' }}>Lưu ý: Mã chỉ có hiệu lực trong 1 phút.</Text>
              </div>
            </div>

            <Form
              name="verify-otp"
              onFinish={onVerifyOtp}
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="otp"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP!' },
                  { len: 6, message: 'Mã OTP phải có 6 chữ số!' }
                ]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="Nhập 6 số OTP"
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }}
                />
              </Form.Item>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {countdown > 0 ? (
                  <Text style={{ color: '#aaa' }}>
                    Gửi lại mã sau <b style={{ color: '#722ed1' }}>{countdown}</b> giây
                  </Text>
                ) : (
                  <Button
                    type="link"
                    onClick={handleResendOtp}
                    disabled={!canResend}
                    style={{ padding: 0, height: 'auto' }}
                  >
                    Gửi lại mã
                  </Button>
                )}
              </div>

              <Form.Item style={{ marginTop: '10px' }}>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={otpLoading}>
                  Xác nhận
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Button type="link" onClick={() => setShowOtp(false)} style={{ color: '#aaa', fontSize: '13px' }}>
                  Quay lại đăng ký
                </Button>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  )
}
