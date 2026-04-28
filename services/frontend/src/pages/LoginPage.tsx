import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { Sparkles, ArrowRight, Mail, Lock, EyeOff, Eye, X, ShieldCheck, RefreshCw } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../i18n'
import { useThemeStore } from '../store/themeStore'

type ForgotStep = 'email' | 'otp' | 'password'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { language } = useLanguageStore()
  const { theme } = useThemeStore()
  const t = translations[language]
  const navigate = useNavigate()

  const isDark = theme === 'dark'

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startResendTimer = () => {
    setResendTimer(60)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const resetForgotState = () => {
    setForgotStep('email')
    setForgotEmail('')
    setForgotOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setOtpInputs(['', '', '', '', '', ''])
    setResendTimer(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otpInputs]
    next[index] = value.slice(-1)
    setOtpInputs(next)
    setForgotOtp(next.join(''))
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      message.success(t.auth_loginSuccess)
      navigate('/dashboard')
    } catch (error: any) {
      message.error(error.response?.data?.message || error.response?.data?.detail || t.common_error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!forgotEmail) return message.warning('Vui lòng nhập email!')
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
      message.success(t.auth_otpSent)
      setForgotStep('otp')
      startResendTimer()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
      message.success(t.auth_otpResent)
      setOtpInputs(['', '', '', '', '', ''])
      setForgotOtp('')
      startResendTimer()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleVerifyOtp = () => {
    if (forgotOtp.length !== 6) return message.warning('Vui lòng nhập đủ 6 số OTP!')
    setForgotStep('password')
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return message.warning('Vui lòng nhập mật khẩu mới!')
    if (newPassword !== confirmPassword) return message.error(t.auth_passwordMismatch)
    setForgotLoading(true)
    try {
      await authApi.resetPassword({ email: forgotEmail, otp: forgotOtp, new_password: newPassword })
      message.success(t.auth_resetSuccess)
      setShowForgot(false)
      resetForgotState()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    } finally {
      setForgotLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    height: 48,
    padding: '0 14px',
    borderRadius: 12,
    fontSize: 15,
    outline: 'none',
    transition: 'border 0.2s',
    background: isDark ? '#1c192b' : 'white',
    color: isDark ? 'white' : '#121221',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? '#0b0914' : '#f8f8fc',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font)'
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)' : 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
        top: -100, left: -100, zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, transparent 70%)' : 'radial-gradient(circle at center, rgba(56,189,248,0.1) 0%, transparent 70%)',
        bottom: -200, right: -200, zIndex: 0
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
        background: isDark ? 'rgba(19, 17, 28, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
        borderRadius: 24, padding: 40,
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(168,85,247,0.3)'
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: isDark ? '#ffffff' : '#121221', letterSpacing: -0.5, marginBottom: 8 }}>
            {t.auth_welcomeBack}
          </h1>
          <p style={{ color: isDark ? '#a1a1aa' : '#71717a', fontSize: 15 }}>
            {language === 'en' ? 'Log in to continue your learning journey' : 'Đăng nhập để tiếp tục hành trình học tập'}
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#a1a1aa" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 42, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder={t.auth_email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#a1a1aa" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <Eye size={18} color="#a1a1aa" /> : <EyeOff size={18} color="#a1a1aa" />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <button
              type="button"
              onClick={() => { setShowForgot(true); resetForgotState() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontSize: 13, fontWeight: 600, padding: 0 }}
            >
              {t.auth_forgotPassword}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              height: 48, marginTop: 4, fontSize: 16,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none', boxShadow: '0 4px 15px rgba(168,85,247,0.3)'
            }}
          >
            {loading ? '...' : t.auth_signIn} <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: isDark ? '#a1a1aa' : '#71717a' }}>
          {t.auth_noAccount}{' '}
          <Link to="/register" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>
            {t.auth_register}
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowForgot(false); resetForgotState() } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
            .otp-digit { text-align: center; font-size: 22px; font-weight: 700; transition: border 0.2s, box-shadow 0.2s; }
            .otp-digit:focus { outline: none; border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.2) !important; }
            .reset-btn:hover { opacity: 0.9; transform: translateY(-1px); }
            .reset-btn { transition: all 0.2s; }
          `}</style>

          <div style={{
            position: 'relative',
            width: '100%', maxWidth: 420,
            background: isDark ? 'rgba(19,17,28,0.97)' : 'white',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e4e7',
            borderRadius: 24,
            padding: '36px 40px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.25s ease',
          }}>
            {/* Close */}
            <button
              onClick={() => { setShowForgot(false); resetForgotState() }}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: isDark ? 'rgba(255,255,255,0.07)' : '#f4f4f7',
                border: 'none', borderRadius: 10, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <X size={16} color={isDark ? '#a1a1aa' : '#71717a'} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(168,85,247,0.3)'
              }}>
                <ShieldCheck size={26} color="white" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#fff' : '#121221', margin: 0, letterSpacing: -0.3 }}>
                {t.auth_forgotPasswordTitle}
              </h2>
              <p style={{ color: isDark ? '#a1a1aa' : '#71717a', fontSize: 14, marginTop: 6 }}>
                {forgotStep === 'email' && t.auth_forgotPasswordDesc}
                {forgotStep === 'otp' && `${t.auth_otpSentTo} ${forgotEmail}`}
                {forgotStep === 'password' && (language === 'en' ? 'Create your new password.' : 'Tạo mật khẩu mới của bạn.')}
              </p>
            </div>

            {/* Step: Email */}
            {forgotStep === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder={t.auth_email}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                    autoFocus
                  />
                </div>
                <button
                  className="reset-btn"
                  onClick={handleSendOtp}
                  disabled={forgotLoading}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(168,85,247,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {forgotLoading ? '...' : t.auth_sendOtp}
                </button>
              </div>
            )}

            {/* Step: OTP */}
            {forgotStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {otpInputs.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="otp-digit"
                      style={{
                        width: 48, height: 56, borderRadius: 12,
                        background: isDark ? '#1c192b' : '#f9f9fb',
                        border: digit
                          ? '2px solid #a855f7'
                          : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e4e4e7',
                        color: isDark ? 'white' : '#121221',
                        boxShadow: digit ? '0 0 0 3px rgba(168,85,247,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', margin: 0 }}>
                  {t.auth_otpExpiry}
                </p>
                <button
                  className="reset-btn"
                  onClick={handleVerifyOtp}
                  disabled={forgotOtp.length !== 6}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: forgotOtp.length !== 6 ? 'not-allowed' : 'pointer',
                    background: forgotOtp.length !== 6 ? (isDark ? '#2d2b3d' : '#e4e4e7') : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: forgotOtp.length !== 6 ? (isDark ? '#6b7280' : '#a1a1aa') : 'white',
                    fontSize: 15, fontWeight: 700,
                    boxShadow: forgotOtp.length === 6 ? '0 4px 15px rgba(168,85,247,0.35)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {t.auth_verify}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || forgotLoading}
                    style={{
                      background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer',
                      color: resendTimer > 0 ? (isDark ? '#6b7280' : '#a1a1aa') : '#a855f7',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                      padding: 0, transition: 'color 0.2s'
                    }}
                  >
                    <RefreshCw size={13} />
                    {resendTimer > 0 ? `${t.auth_resendAfter} ${resendTimer}s` : t.auth_resendCode}
                  </button>
                </div>
              </div>
            )}

            {/* Step: New Password */}
            {forgotStep === 'password' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={t.auth_enterNewPassword}
                    style={{ ...inputStyle, paddingLeft: 40, paddingRight: 42 }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showNewPassword ? <Eye size={16} color="#a1a1aa" /> : <EyeOff size={16} color="#a1a1aa" />}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t.auth_confirmNewPassword}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    style={{ ...inputStyle, paddingLeft: 40, paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showConfirmPassword ? <Eye size={16} color="#a1a1aa" /> : <EyeOff size={16} color="#a1a1aa" />}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p style={{
                    fontSize: 12, margin: 0, fontWeight: 500,
                    color: newPassword === confirmPassword ? '#22c55e' : '#ef4444'
                  }}>
                    {newPassword === confirmPassword
                      ? (language === 'en' ? '✓ Passwords match' : '✓ Mật khẩu khớp')
                      : (language === 'en' ? '✗ Passwords do not match' : '✗ Mật khẩu không khớp')}
                  </p>
                )}
                <button
                  className="reset-btn"
                  onClick={handleResetPassword}
                  disabled={forgotLoading || !newPassword || !confirmPassword}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none',
                    cursor: forgotLoading ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(168,85,247,0.35)',
                    marginTop: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {forgotLoading ? '...' : t.auth_resetPassword}
                </button>
              </div>
            )}

            {/* Back to login */}
            <button
              onClick={() => { setShowForgot(false); resetForgotState() }}
              style={{
                display: 'block', width: '100%', marginTop: 20,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isDark ? '#a1a1aa' : '#71717a', fontSize: 13,
                textAlign: 'center', transition: 'color 0.2s'
              }}
            >
              ← {t.auth_backToLogin}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
