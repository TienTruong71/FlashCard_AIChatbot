import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { Sparkles, ArrowRight, Mail, Lock, EyeOff, Eye, User, ShieldCheck, RefreshCw } from 'lucide-react'
import { authApi } from '../api'
import { useLanguageStore } from '../store/languageStore'
import { useThemeStore } from '../store/themeStore'
import { translations } from '../i18n'

export const RegisterPage = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const otp = otpInputs.join('')

  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { language } = useLanguageStore()
  const { theme } = useThemeStore()
  const t = translations[language]
  const navigate = useNavigate()
  const isDark = theme === 'dark'

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

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otpInputs]
    next[index] = value.slice(-1)
    setOtpInputs(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!paste) return
    const next = [...otpInputs]
    paste.split('').forEach((ch, i) => { next[i] = ch })
    setOtpInputs(next)
    const lastIdx = Math.min(paste.length, 5)
    otpRefs.current[lastIdx]?.focus()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register({ email, password, first_name: firstName, last_name: lastName })
      message.success(t.auth_otpSent)
      setStep(2)
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t.auth_registerFailed
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (otp.length !== 6) return message.warning('Vui lòng nhập đủ 6 số OTP!')
    setLoading(true)
    try {
      await authApi.verifyOtp({ email, otp })
      message.success(t.auth_otpVerified)
      navigate('/login')
    } catch {
      message.error(t.auth_otpInvalid)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      await authApi.resendOtp(email)
      message.success(t.auth_otpResent)
      setOtpInputs(['', '', '', '', '', ''])
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    } finally {
      setLoading(false)
    }
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
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0)  scale(1) }
        }
        .otp-digit {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          transition: border 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .otp-digit:focus {
          outline: none;
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.2) !important;
          transform: scale(1.06);
        }
        .reg-btn { transition: opacity 0.2s, transform 0.2s; }
        .reg-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .reg-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
        bottom: -100, right: -100, zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle at center, rgba(56,189,248,0.1) 0%, transparent 70%)',
        top: -200, left: -200, zIndex: 0
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%',
        maxWidth: step === 2 ? 420 : 440,
        background: isDark ? 'rgba(19, 17, 28, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
        borderRadius: 24,
        padding: step === 2 ? '36px 40px' : 40,
        boxShadow: isDark
          ? '0 20px 60px rgba(0,0,0,0.5)'
          : '0 20px 60px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5)',
        animation: 'slideUp 0.3s ease',
      }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 14px',
            background: step === 2
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #a855f7, #6366f1)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: step === 2
              ? '0 8px 20px rgba(34,197,94,0.35)'
              : '0 8px 20px rgba(168,85,247,0.3)',
            transition: 'all 0.3s ease',
          }}>
            {step === 2
              ? <ShieldCheck size={26} color="white" />
              : <Sparkles size={26} color="white" />
            }
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            color: isDark ? '#ffffff' : '#121221',
            letterSpacing: -0.5, marginBottom: 6
          }}>
            {step === 1 ? t.auth_createAccount : t.auth_verifyOtp}
          </h1>
          <p style={{ color: isDark ? '#a1a1aa' : '#71717a', fontSize: 14, margin: 0 }}>
            {step === 1
              ? (language === 'en' ? 'Start your journey to mastery' : 'Bắt đầu hành trình làm chủ kiến thức')
              : (
                <>
                  {t.auth_otpSentTo}
                  <br />
                  <strong style={{ color: isDark ? '#d4d4d8' : '#3f3f46' }}>{email}</strong>
                </>
              )
            }
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <User size={17} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7', width: '100%' }}
                  placeholder={t.auth_firstName}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <User size={17} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7', width: '100%' }}
                  placeholder={t.auth_lastName}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={17} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 40, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder={t.auth_email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={17} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 40, paddingRight: 42, height: 48, background: isDark ? '#1c192b' : 'white', color: isDark ? 'white' : 'black', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7' }}
                placeholder={t.auth_password}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <Eye size={17} color="#a1a1aa" /> : <EyeOff size={17} color="#a1a1aa" />}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary reg-btn"
              disabled={loading}
              style={{
                height: 48, marginTop: 6, fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                border: 'none', boxShadow: '0 4px 15px rgba(168,85,247,0.3)', borderRadius: 12,
              }}
            >
              {loading ? '...' : t.auth_register} {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        )}

        {step === 2 && (
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
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="otp-digit"
                  style={{
                    width: 50, height: 58, borderRadius: 14,
                    background: isDark ? '#1c192b' : '#f9f9fb',
                    border: digit
                      ? '2px solid #a855f7'
                      : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e4e4e7',
                    color: isDark ? 'white' : '#121221',
                    boxShadow: digit ? '0 0 0 3px rgba(168,85,247,0.15)' : 'none',
                    cursor: 'text',
                  }}
                />
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', margin: 0 }}>
              {t.auth_otpNote}
            </p>

            <button
              className="reg-btn"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || loading}
              style={{
                width: '100%', height: 50, borderRadius: 14, border: 'none',
                cursor: otp.length !== 6 ? 'not-allowed' : 'pointer',
                background: otp.length === 6
                  ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                  : (isDark ? '#2d2b3d' : '#e9e9ef'),
                color: otp.length === 6 ? 'white' : (isDark ? '#6b7280' : '#a1a1aa'),
                fontSize: 15, fontWeight: 700,
                boxShadow: otp.length === 6 ? '0 4px 15px rgba(168,85,247,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading ? '...' : t.auth_verify}
              {!loading && otp.length === 6 && <ArrowRight size={17} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                style={{
                  background: 'none', border: 'none',
                  cursor: resendTimer > 0 ? 'default' : 'pointer',
                  color: resendTimer > 0 ? (isDark ? '#6b7280' : '#a1a1aa') : '#a855f7',
                  fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: 0, transition: 'color 0.2s',
                }}
              >
                <RefreshCw size={13} style={{ opacity: resendTimer > 0 ? 0.5 : 1 }} />
                {resendTimer > 0
                  ? `${t.auth_resendAfter} ${resendTimer}${t.auth_seconds}`
                  : t.auth_resendCode
                }
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: isDark ? '#a1a1aa' : '#71717a' }}>
          {step === 2
            ? (
              <button
                onClick={() => { setStep(1); setOtpInputs(['', '', '', '', '', '']) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontWeight: 600, fontSize: 13 }}
              >
                ← {t.auth_backToRegister}
              </button>
            )
            : (
              <>
                {t.auth_haveAccount}{' '}
                <Link to="/login" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>
                  {t.auth_signIn}
                </Link>
              </>
            )
          }
        </p>
      </div>
    </div>
  )
}
