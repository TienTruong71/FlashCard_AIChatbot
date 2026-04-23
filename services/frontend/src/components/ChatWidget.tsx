import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageSquare, PlusCircle } from 'lucide-react';
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      } else if (!currentConv && view === 'empty') {
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingSidebar(false);
    }
  };

  const loadQuizzes = async () => {
    setIsFetchingMain(true);
    try {
      const res = await quizApi.list({ page: 1, page_size: 10 });
      setQuizzes(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMain(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConv(null);
    setView('quizzes');
    loadQuizzes();
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
    } catch (e) {
      console.error(e);
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
            <button
              key={c.id}
              className={`chat-sidebar-item ${currentConv?.id === c.id ? 'active' : ''}`}
              onClick={() => handleSelectConversation(c)}
            >
              <MessageSquare size={16} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title}
              </span>
            </button>
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
          <img src="/chatbot-icon.png" alt="AI" style={{ width: 52, height: 52, opacity: 0.5, marginBottom: 16 }} />
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
              <p>{language === 'vi' ? 'Chào bạn! Bạn muốn thảo luận về Quiz nào hôm nay?' : 'Hi! Which quiz would you like to review today?'}</p>
            </div>
          </div>
          {isFetchingMain ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="spin" /></div>
          ) : (
            <div className="quiz-grid">
              {quizzes.length > 0 ? quizzes.map(quiz => (
                <button key={quiz.id} className="quiz-card-btn" onClick={() => handleSelectQuiz(quiz)}>
                  {quiz.title}
                </button>
              )) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'gray' }}>
                  {language === 'vi' ? 'Bạn chưa có Quiz nào.' : 'You have no quizzes yet.'}
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
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
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
              <button className="chat-widget-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
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
