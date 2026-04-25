import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, MessageSquare, PlusCircle, Search, Trash2 } from 'lucide-react';
import './ChatWidget.css';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../i18n';
import { aiApi, type AIChatConversation, type AIChatMessage } from '../api/aiApi';
import { quizApi } from '../api';
import type { Quiz } from '../types';

export const ChatWidget: React.FC = () => {
  const { language } = useLanguageStore();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'empty' | 'quizzes' | 'chat'>('empty');

  const [conversations, setConversations] = useState<AIChatConversation[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentConv, setCurrentConv] = useState<AIChatConversation | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSidebar, setIsFetchingSidebar] = useState(false);
  const [isFetchingMain, setIsFetchingMain] = useState(false);

  const [quizSearch, setQuizSearch] = useState('');
  const [quizPage, setQuizPage] = useState(1);
  const [quizTotalPages, setQuizTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsFetchingSidebar(true);
    try {
      const res = await aiApi.getConversations();
      setConversations(res.data);
      if (res.data.length === 0 && !currentConv) {
        handleNewChat();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingSidebar(false);
    }
  };

  const loadQuizzes = useCallback(async (search = '', page = 1, append = false) => {
    if (page === 1) setIsFetchingMain(true);
    else setIsLoadingMore(true);

    try {
      const params: Record<string, string | number> = { page, page_size: 20 };
      if (search.trim()) params.search = search.trim();

      const res = await quizApi.list(params);
      const data = res.data.data || [];
      const pagination = res.data.pagination;

      if (append) {
        setQuizzes(prev => [...prev, ...data]);
      } else {
        setQuizzes(data);
      }

      setQuizTotalPages(pagination?.total_pages || 1);
      setQuizPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
      setIsLoadingMore(false);
    }
  }, []);

  const handleQuizSearch = (value: string) => {
    setQuizSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadQuizzes(value, 1, false);
    }, 400);
  };

  const handleLoadMore = () => {
    if (quizPage < quizTotalPages && !isLoadingMore) {
      loadQuizzes(quizSearch, quizPage + 1, true);
    }
  };

  const handleNewChat = async () => {
    setIsFetchingMain(true);
    try {
      const res = await aiApi.createConversation(undefined, "General Study Chat");
      setCurrentConv(res.data);
      setMessages([]);
      setView('chat');
      loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
    }
  };

  const handleSelectQuiz = async (quiz: Quiz) => {
    setIsFetchingMain(true);
    try {
      const res = await aiApi.createConversation(quiz.id, `Chat about ${quiz.title}`);
      setCurrentConv(res.data);
      setMessages([]);
      setView('chat');
      loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
    }
  };

  const handleSelectConversation = async (conv: AIChatConversation) => {
    setCurrentConv(conv);
    setView('chat');
    setIsFetchingMain(true);
    try {
      const res = await aiApi.getMessages(conv.id);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConv) return;
    await handleDeleteConversationById(currentConv.id);
  };

  const handleDeleteConversationById = async (id: number) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?' : 'Are you sure you want to delete this conversation?')) return;

    setIsFetchingMain(true);
    try {
      await aiApi.deleteConversation(id);
      if (currentConv?.id === id) {
        setCurrentConv(null);
        setMessages([]);
        setView('empty');
      }
      loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConv || isLoading) return;

    const userMsg: AIChatMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      created: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.chat(currentConv.id, userMsg.content);
      const aiMsg: AIChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.answer,
        created: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
      if (messages.length === 0) {
        setTimeout(() => loadConversations(), 2000);
      }
    } catch (e) {
      console.error(e);
      const errorMsg: AIChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: language === 'vi' ? 'Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.' : 'Sorry, an error occurred while connecting to the AI. Please try again later.',
        created: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSidebar = () => (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        {language === 'vi' ? 'Lịch sử trò chuyện' : 'Recent Chats'}
      </div>
      <div className="chat-sidebar-body">
        {isFetchingSidebar ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="spin" size={18} /></div>
        ) : (
          conversations.map(c => (
            <div key={c.id} className={`chat-sidebar-item-container ${currentConv?.id === c.id ? 'active' : ''}`}>
              <button
                className="chat-sidebar-item"
                onClick={() => handleSelectConversation(c)}
              >
                <MessageSquare size={16} />
                <span className="chat-sidebar-item-title">
                  {c.title}
                </span>
              </button>
              <button
                className="chat-sidebar-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversationById(c.id);
                }}
                title={language === 'vi' ? 'Xóa' : 'Delete'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="chat-sidebar-footer">
        <button className="chat-new-btn" onClick={handleNewChat}>
          <PlusCircle size={16} />
          {language === 'vi' ? 'Cuộc trò chuyện mới' : 'New Chat'}
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (view === 'empty') {
      return (
        <div className="chat-empty-state">
          <img src="/chatbot-icon.png" alt="AI" style={{ width: 80, height: 80, marginBottom: 16, borderRadius: '50%', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
          <p>{language === 'vi' ? 'Chọn một cuộc trò chuyện từ danh sách hoặc tạo mới.' : 'Select a conversation from the sidebar or start a new one.'}</p>
        </div>
      );
    }

    if (view === 'quizzes') {
      return (
        <div className="chat-main-body">
          <div className="chat-message assistant">
            <div className="chat-avatar"><img src="/chatbot-icon.png" alt="AI" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /></div>
            <div className="chat-bubble">
              <p>{language === 'vi' ? 'Chào bạn! Chọn Quiz bạn muốn ôn tập nhé.' : 'Hi! Pick a quiz you\'d like to review.'}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="quiz-search-wrapper">
            <Search size={16} className="quiz-search-icon" />
            <input
              type="text"
              className="quiz-search-input"
              placeholder={language === 'vi' ? 'Tìm kiếm quiz...' : 'Search quizzes...'}
              value={quizSearch}
              onChange={e => handleQuizSearch(e.target.value)}
            />
          </div>

          {/* Quiz List */}
          {isFetchingMain ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="spin" /></div>
          ) : (
            <div className="quiz-list">
              {quizzes.length > 0 ? (
                <>
                  {quizzes.map(quiz => (
                    <button key={quiz.id} className="quiz-list-item" onClick={() => handleSelectQuiz(quiz)}>
                      <div className="quiz-list-item-title">{quiz.title}</div>
                      <div className="quiz-list-item-meta">
                        {quiz.question_count} {language === 'vi' ? 'câu hỏi' : 'questions'}
                        {quiz.set_title && <span> · {quiz.set_title}</span>}
                      </div>
                    </button>
                  ))}
                  {quizPage < quizTotalPages && (
                    <button className="quiz-load-more" onClick={handleLoadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? <Loader2 size={14} className="spin" /> : (language === 'vi' ? 'Tải thêm...' : 'Load more...')}
                    </button>
                  )}
                </>
              ) : (
                <p className="quiz-empty-text">
                  {quizSearch
                    ? (language === 'vi' ? `Không tìm thấy quiz "${quizSearch}".` : `No quizzes found for "${quizSearch}".`)
                    : (language === 'vi' ? 'Bạn chưa có Quiz nào.' : 'You have no quizzes yet.')
                  }
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="chat-main-body">
          {messages.length === 0 && !isFetchingMain && (
            <div className="chat-message assistant">
              <div className="chat-avatar"><img src="/chatbot-icon.png" alt="AI" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /></div>
              <div className="chat-bubble">
                <p>{language === 'vi' ? 'Tôi đã sẵn sàng! Hãy hỏi tôi bất cứ điều gì về bài Quiz này.' : 'I am ready! Ask me anything about this quiz.'}</p>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar"><img src="/chatbot-icon.png" alt="AI" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /></div>
              )}
              <div className="chat-bubble">
                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="chat-avatar"><img src="/chatbot-icon.png" alt="AI" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /></div>
              <div className="chat-bubble"><Loader2 size={14} className="spin" /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-widget-footer">
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder={language === 'vi' ? 'Nhập câu hỏi...' : 'Type your question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading || isFetchingMain}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-widget-window">
          {renderSidebar()}
          <div className="chat-main">
            <div className="chat-main-header">
              <h3>
                <img src="/chatbot-icon.png" alt="AI" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                {currentConv ? currentConv.title : (language === 'vi' ? 'AI Trợ lý' : 'AI Assistant')}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentConv && (
                  <button className="chat-widget-close" onClick={handleDeleteConversation} title="Delete Conversation">
                    <Trash2 size={20} />
                  </button>
                )}
                <button className="chat-widget-close" onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            {renderMainContent()}
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="chat-widget-button" onClick={() => setIsOpen(true)}>
          <img src="/chatbot-icon.png" alt="AI Assistant" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
        </button>
      )}
    </div>
  );
};
