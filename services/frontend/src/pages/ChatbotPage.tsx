import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { aiApi } from '../api/aiApi'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export const ChatbotPage = () => {
  const { language } = useLanguageStore()
  const t = translations[language]

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [setId, setSetId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingested, setIngested] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleIngest = async () => {
    if (!setId) return
    setIsIngesting(true)
    setError('')
    try {
      await aiApi.ingestSet(Number(setId))
      setIngested(true)
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'vi'
          ? `Đã nạp dữ liệu bộ học phần #${setId} thành công! Tôi đã học xong tất cả câu hỏi, đáp án và kết quả thi của bạn. Bạn có thể bắt đầu hỏi tôi bất cứ điều gì.`
          : `Successfully loaded set #${setId}! I have learned all questions, answers and your test performance. You can start asking me anything.`,
        timestamp: new Date()
      }])
    } catch {
      setError(language === 'vi' ? 'Không thể nạp dữ liệu. Kiểm tra lại Set ID.' : 'Failed to ingest set. Check your Set ID.')
    } finally {
      setIsIngesting(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !setId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    try {
      const response = await aiApi.chat(Number(setId), input.trim())
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch {
      setError(language === 'vi' ? 'Có lỗi xảy ra. Vui lòng thử lại.' : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setIngested(false)
    setSetId('')
    setError('')
  }

  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-icon">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="chatbot-title">
              {language === 'vi' ? 'AI Trợ lý học tập' : 'AI Learning Assistant'}
            </h1>
            <p className="chatbot-subtitle">
              {language === 'vi'
                ? 'Hỏi AI về nội dung bộ học phần và kết quả thi của bạn'
                : 'Ask AI about your study sets and test performance'}
            </p>
          </div>
        </div>
        {ingested && (
          <button className="chatbot-reset-btn" onClick={handleReset}>
            <RefreshCw size={14} />
            {language === 'vi' ? 'Đặt lại' : 'Reset'}
          </button>
        )}
      </div>

      {!ingested && (
        <div className="chatbot-setup">
          <div className="chatbot-setup-card">
            <Sparkles size={32} className="chatbot-setup-icon" />
            <h2 className="chatbot-setup-title">
              {language === 'vi' ? 'Bắt đầu với AI' : 'Get Started with AI'}
            </h2>
            <p className="chatbot-setup-desc">
              {language === 'vi'
                ? 'Nhập ID bộ học phần để AI có thể học nội dung và kết quả thi của bạn trước khi bắt đầu hỏi đáp.'
                : 'Enter a study set ID so the AI can learn your content and test performance before the conversation starts.'}
            </p>
            <div className="chatbot-setup-input-row">
              <input
                type="number"
                className="chatbot-set-input"
                placeholder={language === 'vi' ? 'Nhập Set ID (VD: 1)' : 'Enter Set ID (e.g. 1)'}
                value={setId}
                onChange={e => setSetId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleIngest()}
              />
              <button
                className="chatbot-ingest-btn"
                onClick={handleIngest}
                disabled={!setId || isIngesting}
              >
                {isIngesting ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {isIngesting
                  ? (language === 'vi' ? 'Đang tải...' : 'Loading...')
                  : (language === 'vi' ? 'Bắt đầu' : 'Start')}
              </button>
            </div>
            {error && <p className="chatbot-error">{error}</p>}
          </div>
        </div>
      )}

      {ingested && (
        <div className="chatbot-body">
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chatbot-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div className="chatbot-bubble">
                  <p>{msg.content}</p>
                  <span className="chatbot-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-avatar">
                  <Bot size={14} />
                </div>
                <div className="chatbot-bubble chatbot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="chatbot-error-inline">{error}</p>}

          <div className="chatbot-input-bar">
            <input
              type="text"
              className="chatbot-input"
              placeholder={language === 'vi' ? 'Nhập câu hỏi của bạn...' : 'Type your question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
