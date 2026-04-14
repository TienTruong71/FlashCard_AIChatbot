import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal, Form, Input, Switch, message, Segmented, Select, Space, Pagination } from 'antd'
import { setApi, quizApi } from '../api'
import type { Set, Quiz } from '../types'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { BookOpen, Code2, Globe, Share2, Plus, Lock, Search, Sparkles, Clock3 } from 'lucide-react'

const SET_ICONS = [BookOpen, Code2, Globe, BookOpen, Code2, Globe]
const SET_ICON_COLORS = ['#3d39cc', '#0ea5e9', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6']

const QUIZ_ICONS = [Sparkles, Clock3, Sparkles, Clock3]
const QUIZ_ICON_COLORS = ['#a855f7', '#3d39cc', '#ec4899', '#0ea5e9']

export const SetsPage = () => {
  const { language } = useLanguageStore()
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<'sets' | 'quizzes'>('sets')
  const [sets, setSets] = useState<Set[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [ordering, setOrdering] = useState<string>('-created_at')
  const [form] = Form.useForm()

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [totalItems, setTotalItems] = useState(0)

  // Share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareItem, setShareItem] = useState<Set | Quiz | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view')
  const [sharing, setSharing] = useState(false)

  const fetchData = async (page = currentPage, size = pageSize) => {
    setLoading(true)
    try {
      const params = {
        q: searchText || undefined,
        ordering,
        page,
        page_size: size
      }
      if (activeTab === 'sets') {
        const res = await setApi.list(params)
        setSets(res.data?.data || [])
        setTotalItems(res.data?.pagination?.total_items || 0)
      } else {
        const res = await quizApi.list(params)
        setQuizzes(res.data?.data || [])
        setTotalItems(res.data?.pagination?.total_items || 0)
      }
    } catch {
      message.error(t.common_error)
    } finally {
      setLoading(false)
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsModalVisible(true)
      searchParams.delete('create')
      setSearchParams(searchParams)
    }
    const tabParam = searchParams.get('tab')
    if (tabParam === 'quizzes' || tabParam === 'sets') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
    fetchData(1, pageSize)
  }, [activeTab, ordering])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchText(val)
    setCurrentPage(1)

    const params = { q: val || undefined, ordering, page: 1, page_size: pageSize }
    if (activeTab === 'sets') {
      setApi.list(params).then(res => {
        setSets(res.data?.data || [])
        setTotalItems(res.data?.pagination?.total_items || 0)
      }).catch(() => { })
    } else {
      quizApi.list(params).then(res => {
        setQuizzes(res.data?.data || [])
        setTotalItems(res.data?.pagination?.total_items || 0)
      }).catch(() => { })
    }
  }

  const handleCreate = async (values: any) => {
    try {
      await setApi.create(values)
      message.success(t.common_success)
      setIsModalVisible(false)
      form.resetFields()
      fetchData()
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    }
  }

  const handleShare = async () => {
    if (!shareItem || !shareEmail) return
    setSharing(true)
    try {
      const payload = { shares: [{ email: shareEmail, permission: sharePermission }] }
      if (activeTab === 'sets') {
        await setApi.share(shareItem.id, payload)
      } else {
        await quizApi.share(shareItem.id, payload)
      }
      message.success(t.common_success)
      setIsShareModalOpen(false)
      setShareEmail('')
    } catch (error: any) {
      message.error(error.errorMessage || t.common_error)
    } finally {
      setSharing(false)
    }
  }

  const displayItems = activeTab === 'sets' ? sets : quizzes

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">{t.lib_title}</h1>
        <p className="page-subtitle">{t.lib_subtitle}</p>
      </div>

      {/* Toolbar & Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {/* Row 1: Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          <button
            className={`tab-btn ${activeTab === 'sets' ? 'active' : ''}`}
            onClick={() => setActiveTab('sets')}
          >
            {t.lib_mySets}
          </button>
          <button
            className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            {t.lib_myQuizzes}
          </button>
        </div>

        {/* Row 2: Search & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: 400 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                placeholder={`${t.common_search}...`}
                value={searchText}
                onChange={handleSearch}
              />
            </div>

            <Select
              value={ordering}
              onChange={setOrdering}
              style={{ width: 140 }}
              placeholder={t.lib_sortBy}
              className="custom-select-v2"
            >
              <Select.Option value="-created_at">{t.lib_newest}</Select.Option>
              <Select.Option value="created_at">{t.lib_oldest}</Select.Option>
            </Select>
          </div>

          <div style={{ marginLeft: 16 }}>
            {activeTab === 'sets' && (
              <button className="btn btn-primary" style={{ height: 40, borderRadius: 10, padding: '0 24px' }} onClick={() => setIsModalVisible(true)}>
                <Plus size={16} /> {t.lib_createNew}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>{t.common_loading}</div>
      ) : displayItems.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          {activeTab === 'sets' ? <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} /> : <Sparkles size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />}
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{activeTab === 'sets' ? t.lib_noSets : 'Chưa có Quiz nào.'}</p>
          {activeTab === 'sets' && (
            <button className="btn btn-primary" onClick={() => setIsModalVisible(true)}>
              <Plus size={14} /> {t.lib_createNew}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {displayItems.map((item, i) => {
            const isSet = activeTab === 'sets'
            const Icon = isSet ? SET_ICONS[i % SET_ICONS.length] : QUIZ_ICONS[i % QUIZ_ICONS.length]
            const iconColor = isSet ? SET_ICON_COLORS[i % SET_ICON_COLORS.length] : QUIZ_ICON_COLORS[i % QUIZ_ICON_COLORS.length]

            return (
              <Link
                key={item.id}
                to={isSet ? `/sets/${item.id}` : `/quizzes/${item.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
                className="set-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div className="set-card-icon" style={{ background: `${iconColor}15` }}>
                    <Icon size={18} color={iconColor} />
                  </div>
                  <span className={`badge ${item.is_public || (item as Quiz).is_published ? 'badge-public' : 'badge-private'}`}>
                    {isSet ? (
                      item.is_public ? t.lib_public : <><Lock size={9} style={{ marginRight: 3 }} />{t.lib_private}</>
                    ) : (
                      (item as Quiz).is_published ? 'Published' : 'Draft'
                    )}
                  </span>
                </div>

                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5, minHeight: 38 }}>
                  {isSet
                    ? ((item as Set).description ? (item as Set).description!.slice(0, 80) : t.lib_noDescription)
                    : `Gồm ${(item as Quiz).question_count} câu hỏi ngẫu nhiên.`}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {isSet ? (
                      <><BookOpen size={13} /> {item.question_count || 0} {t.config_questions}</>
                    ) : (
                      <><Sparkles size={13} /> {(item as Quiz).question_count || 0} {t.config_questions}</>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShareItem(item)
                      setIsShareModalOpen(true)
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={(page, size) => {
              setCurrentPage(page)
              if (size !== pageSize) {
                setPageSize(size)
                fetchData(1, size)
                setCurrentPage(1)
              } else {
                fetchData(page, size)
              }
            }}
            showSizeChanger
            showTotal={(total) => `Total ${total} items`}
            hideOnSinglePage={false}
          />
        </div>
      )}

      {/* Create Set Modal */}
      <Modal
        title={t.lib_createNew}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label={t.lib_setName} rules={[{ required: true }]}>
            <Input placeholder={t.lib_setNamePlaceholder} />
          </Form.Item>
          <Form.Item name="description" label={t.lib_description}>
            <Input.TextArea placeholder={t.lib_descriptionPlaceholder} rows={3} />
          </Form.Item>
          <Form.Item name="is_public" label={t.lib_visibility} valuePropName="checked">
            <Switch checkedChildren={t.lib_public_label} unCheckedChildren={t.lib_private_label} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalVisible(false)}>
              {t.lib_cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              {t.lib_create}
            </button>
          </div>
        </Form>
      </Modal>
      {/* Share Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{activeTab === 'sets' ? 'Chia sẻ bộ học phần' : 'Chia sẻ Quiz'}</span>}
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        onOk={handleShare}
        confirmLoading={sharing}
        okText={t.ai_share}
        cancelText={t.ai_cancel}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 10 }} size="middle">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email người dùng</p>
            <Input
              placeholder="Nhập email người muốn chia sẻ"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
            />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.ai_permission}</p>
            <Select
              style={{ width: '100%' }}
              value={sharePermission}
              onChange={val => setSharePermission(val)}
              options={[
                { value: 'view', label: t.ai_viewPermission },
                { value: 'edit', label: t.ai_editPermission },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
