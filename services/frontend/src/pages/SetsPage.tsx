import { useEffect, useState } from 'react'
import { Card, Button, Typography, Space, Table, Modal, Form, Input, Switch, message, Tag } from 'antd'
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { setApi } from '../api'
import type { Set } from '../types'

const { Title, Text } = Typography

export const SetsPage = () => {
  const [sets, setSets] = useState<Set[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchSets = async () => {
    setLoading(true)
    try {
      const res = await setApi.list()
      setSets(res.data?.data || [])
    } catch (error) {
      message.error('Lỗi khi tải danh sách bộ học phần')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSets()
  }, [])

  const handleCreate = async (values: any) => {
    try {
      await setApi.create(values)
      message.success('Tạo bộ học phần thành công!')
      setIsModalVisible(false)
      form.resetFields()
      fetchSets()
    } catch (error) {
      message.error('Lỗi khi tạo bộ học phần')
    }
  }

  const columns = [
    {
      title: 'Tên bộ học phần',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Set) => (
        <Link to={`/sets/${record.id}`} style={{ fontWeight: 500, color: '#9254de', fontSize: '16px' }}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span style={{ color: '#aaa' }}>{text || '-'}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_public',
      key: 'is_public',
      render: (isPublic: boolean) => (
        isPublic ? <Tag color="blue">Công khai</Tag> : <Tag color="default">Riêng tư</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ color: '#aaa' }}>{new Date(date).toLocaleDateString('vi-VN')}</span>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Set) => (
        <Space size="middle">
          <Link to={`/sets/${record.id}`}><Button type="default" size="small">Chi tiết</Button></Link>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Title level={2} style={{ color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOpenOutlined style={{ color: '#722ed1' }} />
            Bộ học phần
          </Title>
          <Text style={{ color: '#aaa', fontSize: '16px' }}>
            Quản lý các bộ câu hỏi và tạo bài kiểm tra của bạn.
          </Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Tạo bộ mới
        </Button>
      </div>

      <Card className="glass-card table-dark" bordered={false}>
        <Table 
          columns={columns} 
          dataSource={sets} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Tạo bộ học phần mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="dark-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Tên bộ" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Lịch sử Việt Nam" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả ngắn gọn về bộ học phần này" rows={4} />
          </Form.Item>
          <Form.Item name="is_public" label="Chế độ hiển thị" valuePropName="checked">
            <Switch checkedChildren="Công khai" unCheckedChildren="Riêng tư" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Tạo mới</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
