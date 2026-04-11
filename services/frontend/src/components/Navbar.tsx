import { Layout, Menu, Button, Space, Badge } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect, useState } from 'react'
import { notificationApi } from '../api'
import { BellOutlined, LogoutOutlined } from '@ant-design/icons'

const { Header } = Layout

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.unreadCount()
        .then(res => setUnreadCount(res.data?.data || 0))
        .catch(console.error)
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const publicMenuItems = [
    { key: '/', label: <Link to="/">Trang chủ</Link> },
  ]

  const privateMenuItems = [
    { key: '/dashboard', label: <Link to="/dashboard">Dashboard</Link> },
    { key: '/sets', label: <Link to="/sets">Bộ học phần</Link> },
  ]

  return (
    <Header style={{ background: 'rgba(20, 20, 20, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" className="text-gradient" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          QuizApp
        </Link>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          selectedKeys={[location.pathname]} 
          items={isAuthenticated ? privateMenuItems : publicMenuItems} 
          style={{ background: 'transparent', borderBottom: 'none', minWidth: '300px' }}
        />
      </div>

      <Space size="large">
        {isAuthenticated ? (
          <>
            <Badge count={unreadCount} size="small">
               <Button type="text" icon={<BellOutlined />} style={{ color: '#fff' }} />
            </Badge>
            <span style={{ color: '#aaa' }}>Xin chào, {user?.first_name}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#ff4d4f' }}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <>
             <Link to="/login"><Button type="text" style={{ color: '#fff' }}>Đăng nhập</Button></Link>
             <Link to="/register"><Button type="primary">Đăng ký</Button></Link>
          </>
        )}
      </Space>
    </Header>
  )
}
