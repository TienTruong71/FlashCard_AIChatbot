import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, BrainCircuit, Target, Languages, Layers, BarChart2, Moon, Sun, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { useThemeStore } from '../store/themeStore'
import { translations } from '../i18n'

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore()
  const { language, toggle: toggleLang } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const t = translations[language]

  const isEn = language === 'en'
  const isDark = theme === 'dark'

  return (
    <>
      <style>{`
        .lp-root {
          /* Light Theme Variables */
          --lp-bg: #f8f8fc;
          --lp-text: #121221;
          --lp-text-muted: #52525b;
          --lp-card: #ffffff;
          --lp-card-hover: #f1f1f5;
          --lp-border: rgba(0,0,0,0.08);
          --lp-border-hover: rgba(168,85,247,0.4);
          --lp-nav-border: rgba(0,0,0,0.06);
          --lp-orb-light: rgba(192,132,252,0.3);
          --lp-orb-dark: rgba(244,114,182,0.2);
          --lp-feature-icon-bg: rgba(168,85,247,0.1);
          --lp-feature-card-header: #f4f4f5;
          --lp-feature-card-elem: #e4e4e7;
          --lp-footer-bg: #e4e4eb;
          --lp-footer-text: #71717a;
          
          background-color: var(--lp-bg);
          color: var(--lp-text);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          transition: background-color 0.3s, color 0.3s;
        }

        .lp-root.dark {
          /* Dark Theme Variables */
          --lp-bg: #0b0914;
          --lp-text: #ffffff;
          --lp-text-muted: #a1a1aa;
          --lp-card: #13111c;
          --lp-card-hover: #1a1825;
          --lp-border: rgba(255,255,255,0.05);
          --lp-border-hover: rgba(168,85,247,0.4);
          --lp-nav-border: rgba(255,255,255,0.05);
          --lp-orb-light: rgba(192,132,252,0.25);
          --lp-orb-dark: rgba(244,114,182,0.15);
          --lp-feature-icon-bg: rgba(168,85,247,0.15);
          --lp-feature-card-header: #1c192b;
          --lp-feature-card-elem: #252236;
          --lp-footer-bg: #151320;
          --lp-footer-text: rgba(255,255,255,0.4);
        }

        .landing-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 60px;
          border-bottom: 1px solid var(--lp-nav-border);
          background: transparent;
        }
        
        .landing-nav-links {
          display: flex;
          gap: 32px;
          font-size: 14.5px;
          font-weight: 600;
        }
        .landing-nav-links a {
          color: var(--lp-text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .landing-nav-links a:hover {
          color: var(--lp-text);
        }
        
        .landing-btn-primary {
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          color: white !important;
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(168,85,247,0.3);
        }
        .landing-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168,85,247,0.4);
        }
        
        .landing-btn-outline {
          background: transparent;
          color: var(--lp-text);
          border: 1px solid var(--lp-border);
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .landing-btn-outline:hover {
          background: var(--lp-card-hover);
          border-color: var(--lp-text-muted);
        }
        
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.2);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .hero-title {
          font-size: 72px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 24px;
          color: var(--lp-text);
        }
        .hero-gradient-text {
          background: linear-gradient(to right, #a855f7, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          font-size: 18px;
          color: var(--lp-text-muted);
          line-height: 1.6;
          max-width: 500px;
          margin-bottom: 40px;
        }
        
        .orb-container {
          position: relative;
          width: 440px;
          height: 440px;
          margin: 0 auto;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, var(--lp-orb-light), transparent 60%),
                      radial-gradient(circle at 70% 70%, var(--lp-orb-dark), transparent 60%);
          box-shadow: 0 0 80px rgba(168,85,247,0.1), inset 0 0 60px rgba(168,85,247,0.1);
          border: 1px solid var(--lp-border);
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .bento-section {
          max-width: 1200px;
          margin: 120px auto;
          padding: 0 40px;
        }
        .bento-title {
          color: #a855f7;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .bento-subtitle {
          font-size: 44px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 16px;
          color: var(--lp-text);
        }
        
        .bento-card {
          background: var(--lp-card);
          border: 1px solid var(--lp-border);
          border-radius: 24px;
          padding: 36px;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.02);
        }
        .bento-card:hover {
          transform: translateY(-5px);
          border-color: var(--lp-border-hover);
          box-shadow: 0 20px 40px rgba(168,85,247,0.08);
        }
        .bento-card h3 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--lp-text);
        }
        .bento-card p {
          color: var(--lp-text-muted);
          font-size: 15px;
          line-height: 1.6;
          flex: 1;
        }
        .bento-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .cta-section {
          background: linear-gradient(180deg, transparent 0%, var(--lp-footer-bg) 100%);
          padding: 120px 20px;
          text-align: center;
          border-top: 1px solid var(--lp-border);
        }
      `}</style>

      <div className={`lp-root ${isDark ? 'dark' : ''}`}>
        {/* Navbar */}
        <nav className="landing-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
            <Sparkles size={20} color="#a855f7" strokeWidth={2.5} />
            QuizTT
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{ background: 'var(--lp-card)', border: '1px solid var(--lp-border)', color: 'var(--lp-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', transition: 'all 0.2s' }}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Lang Toggle */}
            <button
              onClick={toggleLang}
              style={{ background: 'none', border: 'none', color: 'var(--lp-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
            >
              <Languages size={15} /> {language.toUpperCase()}
            </button>

            <Link to="/login" style={{ color: 'var(--lp-text)', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginLeft: 10 }}>
              {t.auth_signIn}
            </Link>

            <Link to={"/register"} className="landing-btn-primary">
              {isAuthenticated ? t.nav_dashboard : (isEn ? 'Join Now' : 'Tham gia ngay')}
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '80px auto', padding: '0 40px' }}>
          <div style={{ flex: 1, paddingRight: 60 }}>
            <div className="hero-pill">
              <Sparkles size={12} strokeWidth={2.5} /> {isEn ? 'NEXT-GEN LEARNING' : 'HỌC TẬP THẾ HỆ MỚI'}
            </div>
            <h1 className="hero-title">
              {isEn ? 'Master Any Subject' : 'Làm Chủ Nền Tảng'}<br />
              <span className="hero-gradient-text">
                {isEn ? 'Through Practice.' : 'Bằng Luyện Tập.'}
              </span>
            </h1>
            <p className="hero-desc">
              {isEn
                ? 'Elevate your study game with the most sophisticated custom quiz platform. Build curated study sets, generate targeted quizzes, and track your intellectual growth.'
                : 'Nâng tầm việc học với nền tảng tạo bài kiểm tra linh hoạt nhất. Tự tay thiết kế những bộ học phần chất lượng, sinh bài quiz theo ý muốn và theo dõi sự tiến bộ.'
              }
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link to={"/register"} className="landing-btn-primary">
                {isEn ? 'Get Started for Free' : 'Tham gia miễn phí'} <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="landing-btn-outline">
                {t.auth_signIn}
              </Link>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="orb-container">
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'linear-gradient(var(--lp-border) 1px, transparent 1px), linear-gradient(90deg, var(--lp-border) 1px, transparent 1px)', backgroundSize: '20px 20px', maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={100} color="var(--lp-border)" strokeWidth={1} style={{ transform: 'rotate(15deg)' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Features / Bento Grid */}
        <section className="bento-section">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 className="bento-title">{isEn ? 'CAPABILITIES' : 'TÍNH NĂNG NỔI BẬT'}</h2>
            <h3 className="bento-subtitle">{isEn ? 'Designed for Deep Understanding' : 'Thiết Kế Để Hiểu Sâu Nhớ Lâu'}</h3>
            <p className="bento-desc" style={{ color: 'var(--lp-text-muted)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>
              {isEn
                ? 'Stop memorizing. Start mastering. Our tools help you curate knowledge and practice exactly what you need.'
                : 'Ngừng học vẹt. Bắt đầu rèn luyện thực tế. Các công cụ của chúng tôi tập trung tối đa vào hiệu quả truy xuất ghi nhớ.'
              }
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {/* Feature 1 - Spans 2 columns */}
            <div className="bento-card" style={{ gridColumn: 'span 2' }}>
              <div className="bento-icon" style={{ background: 'var(--lp-feature-icon-bg)', color: '#a855f7' }}>
                <Layers size={22} />
              </div>
              <h3>{isEn ? 'Curated Study Sets' : 'Bộ Câu Hỏi Thiết Kế Riêng'}</h3>
              <p>
                {isEn
                  ? 'Organize your knowledge easily. Manually create study Sets and populate them with high-quality, hand-picked questions using Multiple Choice, Multi-select, or Text Fill formats.'
                  : 'Sắp xếp kiến thức thật logic. Bạn có thể tự tay tạo mới các "Set", thêm vào nội dung những câu hỏi đã được chắt lọc kỹ với nhiều định dạng: Trắc nghiệm, Nhiều đáp án, Điền từ.'
                }
              </p>
              <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ background: 'var(--lp-feature-card-header)', padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--lp-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--lp-text)', fontWeight: 600 }}>Single Choice</span>
                  <span style={{ color: '#a855f7', fontWeight: 800 }}>✓</span>
                </div>
                <div style={{ background: 'var(--lp-feature-card-header)', padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--lp-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--lp-text)', fontWeight: 600 }}>Multi Select</span>
                  <span style={{ color: '#a855f7', fontWeight: 800 }}>✓</span>
                </div>
                <div style={{ background: 'var(--lp-feature-card-header)', padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--lp-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--lp-text)', fontWeight: 600 }}>Text Fill</span>
                  <span style={{ color: '#a855f7', fontWeight: 800 }}>✓</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bento-card">
              <div className="bento-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                <Target size={22} />
              </div>
              <h3>{isEn ? 'Dynamic Quizzing' : 'Sinh Bài Quiz Linh Hoạt'}</h3>
              <p>
                {isEn
                  ? 'Do not test exactly the same way twice. Configure custom Quizzes by mixing questions.'
                  : 'Tự sinh ra các bản "Quiz" khác nhau từ Set bằng cách lọc ngẫu nhiên số lượng câu hỏi.'
                }
              </p>
              <div style={{ marginTop: 24, background: 'var(--lp-feature-card-header)', height: 80, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lp-border)' }}>
                <Target size={30} color="var(--lp-text-muted)" opacity={0.5} />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bento-card">
              <div className="bento-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <BarChart2 size={22} />
              </div>
              <h3>{isEn ? 'Real-time Analytics' : 'Báo Cáo Phân Tích'}</h3>
              <p>
                {isEn
                  ? 'Visualize your knowledge gaps. QuizTT maps out exactly what subjects you need to review.'
                  : 'Hệ thống lưu lại mọi lần thi của bạn. Trực quan hóa điểm số, hỗ trợ theo dõi mức độ tiếp thu qua từng dạng.'
                }
              </p>
            </div>

            {/* Feature 4 - Spans 2 columns */}
            <div className="bento-card" style={{ gridColumn: 'span 2' }}>
              <div className="bento-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                <BrainCircuit size={22} />
              </div>
              <h3>{isEn ? 'Deep Work Test Mode' : 'Giao Diện Thi Tập Trung'}</h3>
              <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
                <p style={{ flex: 1 }}>
                  {isEn
                    ? 'Take quizzes in a highly focused, full-screen environment. Track time, use the intuitive Question Map to jump between answers, and get immediate point validations.'
                    : 'Kỳ kiểm tra ở chế độ toàn màn hình không làm phiền. Giao diện trực quan cho phép bạn xem lại câu hỏi chưa làm, bấm đồng hồ và nộp bài.'
                  }
                </p>
                <div style={{ flex: 1, background: 'var(--lp-feature-card-header)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--lp-border)' }}>
                  <div style={{ height: 6, background: 'var(--lp-border)', borderRadius: 4, width: '100%' }} />
                  <div style={{ height: 6, background: '#22c55e', borderRadius: 4, width: '60%' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 40, background: 'var(--lp-feature-card-elem)', borderRadius: 8 }} />
                    <div style={{ flex: 1, height: 40, background: 'var(--lp-feature-card-elem)', borderRadius: 8 }} />
                    <div style={{ flex: 1, height: 40, background: 'var(--lp-feature-card-elem)', borderRadius: 8 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="cta-section">
          <h2 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, letterSpacing: -1, color: 'var(--lp-text)' }}>
            {isEn ? 'Ready to transform your memory?' : 'Sẵn sàng chuyển hóa tri thức?'}
          </h2>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: 18, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            {isEn
              ? 'Join the community of students and professionals using QuizTT to outpace the status quo.'
              : 'Tham gia vào cộng đồng học viên thông qua nền tảng thiết lập bài thi cá nhân hóa của QuizTT.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Link to={"/register"} className="landing-btn-primary" style={{ padding: '16px 36px', fontSize: 16 }}>
              {isEn ? 'Join Now for Free' : 'Tham gia ngay hoàn toàn miễn phí'}
            </Link>
          </div>
        </section>

        <footer style={{ padding: '30px', textAlign: 'center', borderTop: '1px solid var(--lp-border)', background: 'var(--lp-footer-bg)', color: 'var(--lp-footer-text)', fontSize: 13 }}>
          <p>© 2026 QuizTT. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
