import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal, Form, Input, Switch, message, Segmented, Select } from 'antd'
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

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { q: searchText || undefined, ordering }
      if (activeTab === 'sets') {
        const res = await setApi.list(params)
        setSets(res.data?.data || [])
      } else {
        const res = await quizApi.list(params)
        setQuizzes(res.data?.data || [])
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
  }, [searchParams])

  useEffect(() => { fetchData() }, [activeTab, ordering])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchText(val)
    
    const params = { q: val || undefined, ordering }
    if (activeTab === 'sets') {
      setApi.list(params).then(res => setSets(res.data?.data || [])).catch(() => {})
    } else {
      quizApi.list(params).then(res => setQuizzes(res.data?.data || [])).catch(() => {})
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

  const displayItems = activeTab === 'sets' ? sets : quizzes

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">{t.lib_title}</h1>
        <p className="page-subtitle">{t.lib_subtitle}</p>
      </div>

      {/* Toolbar & Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Segmented
            options={[
              { label: t.lib_mySets, value: 'sets' },
              { label: t.lib_myQuizzes, value: 'quizzes' }
            ]}
            value={activeTab}
            onChange={(val: any) => setActiveTab(val)}
            style={{ padding: 4, borderRadius: 10 }}
          />
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="top-header-search" style={{ width: 240 }}>
              <Search size={14} />
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
              className="custom-select"
            >
              <Select.Option value="-created_at">{t.lib_newest}</Select.Option>
              <Select.Option value="created_at">{t.lib_oldest}</Select.Option>
            </Select>
            {activeTab === 'sets' && (
              <button className="btn btn-primary" onClick={() => setIsModalVisible(true)}>
                <Plus size={14} /> {t.lib_createNew}
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
              <div key={item.id} className="set-card">
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
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Link
                      to={isSet ? `/sets/${item.id}` : `/quizzes/${item.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      {isSet ? t.lib_openSet : 'Xem chi tiết'}
                    </Link>
                  </div>
                  <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add new card for Sets */}
          {activeTab === 'sets' && (
            <button
              onClick={() => setIsModalVisible(true)}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 14,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.background = 'var(--primary-light)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} color="white" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.lib_createNew}</span>
            </button>
          )}
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
    </div>
  )
}
