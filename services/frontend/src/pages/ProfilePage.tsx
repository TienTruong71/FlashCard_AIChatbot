import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import {
  ArrowLeft, User, Mail, Shield, KeyRound,
  CheckCircle, AlertCircle, Edit3, Save, X,
  Trash2, Eye, EyeOff, Lock, RefreshCw, ShieldCheck,
  ZoomIn, ImagePlus
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { useThemeStore } from '../store/themeStore'
import { translations } from '../i18n'
import { authApi } from '../api'
import { uploadToCloudinary } from '../api/cloudinary'

type PwdStep = 'idle' | 'email' | 'otp' | 'password'

export const ProfilePage = () => {
  const { user, setUser } = useAuthStore()
  const { language } = useLanguageStore()
  const { theme } = useThemeStore()
  const t = translations[language]
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  const [pwdStep, setPwdStep] = useState<PwdStep>('idle')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', ''])
  const [otpValue, setOtpValue] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const res = await authApi.updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
      if (res.data?.status && res.data.data && user) {
        setUser({ ...user, first_name: res.data.data.first_name, last_name: res.data.data.last_name })
        setSuccessMsg(t.profile_updateSuccess)
        setEditing(false)
      } else {
        setErrorMsg(t.profile_updateError)
      }
    } catch {
      setErrorMsg(t.profile_updateError)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name || '')
    setEditing(false)
    setErrorMsg('')
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      message.error(language === 'en' ? 'File too large (max 5MB)' : 'File quá lớn (tối đa 5MB)')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message.error(language === 'en' ? 'Invalid file type' : 'Loại file không hợp lệ')
      return
    }
    setAvatarUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      const res = await authApi.updateProfile({ avatar: url })
      if (res.data?.status && res.data.data && user) {
        setUser({ ...user, avatar: url })
        message.success(t.profile_avatarSuccess)
      }
    } catch {
      message.error(t.profile_avatarError)
    }
    setAvatarUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    try {
      const res = await authApi.updateProfile({ avatar: '' })
      if (res.data?.status && user) {
        setUser({ ...user, avatar: undefined })
        message.success(t.profile_avatarSuccess)
      }
    } catch {
      message.error(t.profile_avatarError)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const resetPwdState = () => {
    setPwdStep('idle')
    setNewPassword('')
    setConfirmPassword('')
    setOtpInputs(['', '', '', '', '', ''])
    setOtpValue('')
    setResendTimer(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otpInputs]
    next[index] = value.slice(-1)
    setOtpInputs(next)
    setOtpValue(next.join(''))
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleStartPwdChange = async () => {
    if (!user?.email) return
    setPwdStep('email')
    setPwdLoading(true)
    try {
      await authApi.forgotPassword(user.email)
      message.success(t.auth_otpSent)
      setPwdStep('otp')
      startResendTimer()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
      setPwdStep('idle')
    }
    setPwdLoading(false)
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !user?.email) return
    setPwdLoading(true)
    try {
      await authApi.forgotPassword(user.email)
      message.success(t.auth_otpResent)
      setOtpInputs(['', '', '', '', '', ''])
      setOtpValue('')
      startResendTimer()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    }
    setPwdLoading(false)
  }

  const handleVerifyOtp = () => {
    if (otpValue.length !== 6) return
    setPwdStep('password')
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword || !user?.email) return
    if (newPassword !== confirmPassword) return message.error(t.auth_passwordMismatch)
    setPwdLoading(true)
    try {
      await authApi.resetPassword({ email: user.email, otp: otpValue, new_password: newPassword })
      message.success(t.profile_pwdSuccess)
      resetPwdState()
    } catch (error: any) {
      message.error(error.response?.data?.message || t.common_error)
    }
    setPwdLoading(false)
  }

  const modalInputStyle: React.CSSProperties = {
    width: '100%', height: 46, padding: '0 14px',
    borderRadius: 10, fontSize: 14, outline: 'none',
    transition: 'border 0.2s',
    background: isDark ? '#1c192b' : '#f9f9fb',
    color: isDark ? 'white' : '#121221',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e4e4e7',
    boxSizing: 'border-box',
    fontFamily: 'var(--font)',
  }

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button className="profile-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          {t.profile_backToDashboard}
        </button>
      </div>

      <div className="profile-page-content">
        <div className="profile-avatar-card">
          <div className="profile-avatar-wrapper">
            {avatarUploading ? (
              <div className="profile-avatar-large">
                <div className="profile-avatar-spinner" />
              </div>
            ) : user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-large">{initials}</div>
            )}
          </div>

          <div className="profile-avatar-actions">
            {user?.avatar && (
              <button className="profile-avatar-action-btn" onClick={() => setShowLightbox(true)}>
                <ZoomIn size={13} />
                {t.profile_viewAvatar}
              </button>
            )}
            <button className="profile-avatar-action-btn primary" onClick={handleAvatarClick} disabled={avatarUploading}>
              <ImagePlus size={13} />
              {avatarUploading ? t.profile_avatarUploading : t.profile_uploadAvatar}
            </button>
            {user?.avatar && (
              <button className="profile-avatar-action-btn danger" onClick={handleRemoveAvatar}>
                <Trash2 size={11} />
                {t.profile_removeAvatar}
              </button>
            )}
          </div>
          <div className="profile-avatar-hint">{t.profile_uploadAvatarDesc}</div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className="profile-avatar-name">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="profile-avatar-email">{user?.email}</div>
          <div className="profile-member-since">
            <span>{t.profile_memberSince}</span>
            <span>{formatDate(user?.created_at)}</span>
          </div>
        </div>

        <div className="profile-cards-col">
          <div className="profile-info-card">
            <div className="profile-info-card-header">
              <div className="profile-info-card-title">
                <User size={15} />
                {t.profile_personalInfo}
              </div>
              {!editing && (
                <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                  <Edit3 size={13} />
                  {t.profile_editInfo}
                </button>
              )}
            </div>

            {successMsg && (
              <div className="profile-alert success">
                <CheckCircle size={14} />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="profile-alert error">
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            <div className="profile-fields">
              <div className="profile-field">
                <label className="profile-field-label">{t.profile_firstName}</label>
                {editing ? (
                  <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
                ) : (
                  <div className="profile-field-value">{user?.first_name || '—'}</div>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-field-label">{t.profile_lastName}</label>
                {editing ? (
                  <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                ) : (
                  <div className="profile-field-value">{user?.last_name || '—'}</div>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-field-label">
                  <Mail size={11} style={{ display: 'inline', marginRight: 4 }} />
                  {t.profile_email}
                </label>
                <div className="profile-field-value readonly">
                  {user?.email}
                  <span className="profile-email-badge">{t.profile_emailNote}</span>
                </div>
              </div>
            </div>

            {editing && (
              <div className="profile-edit-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim()}>
                  <Save size={13} />
                  {saving ? t.common_loading : t.profile_saveChanges}
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleCancel}>
                  <X size={13} />
                  {t.common_cancel}
                </button>
              </div>
            )}
          </div>

          <div className="profile-info-card">
            <div className="profile-info-card-header">
              <div className="profile-info-card-title">
                <Shield size={15} />
                {t.profile_security}
              </div>
            </div>
            <div className="profile-security-row">
              <div className="profile-security-info">
                <KeyRound size={16} className="profile-security-icon" />
                <div>
                  <div className="profile-security-label">{t.profile_changePassword}</div>
                  <div className="profile-security-desc">{t.profile_changePasswordDesc}</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleStartPwdChange} disabled={pwdStep !== 'idle'}>
                {t.profile_changePassword}
              </button>
            </div>
          </div>
        </div>
      </div>

      {pwdStep !== 'idle' && (
        <div
          className="pwd-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) resetPwdState() }}
        >
          <style>{`
            .otp-digit-profile { text-align: center; font-size: 22px; font-weight: 700; transition: border 0.2s, box-shadow 0.2s; font-family: var(--font); }
            .otp-digit-profile:focus { outline: none; border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.2) !important; }
          `}</style>

          <div className="pwd-modal-card" style={{
            background: isDark ? 'rgba(19,17,28,0.97)' : 'white',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e4e7',
          }}>
            <button className="pwd-modal-close" onClick={resetPwdState}
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#f4f4f7' }}>
              <X size={16} color={isDark ? '#a1a1aa' : '#71717a'} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="pwd-modal-icon">
                <ShieldCheck size={26} color="white" />
              </div>
              <h2 className="pwd-modal-title" style={{ color: isDark ? '#fff' : '#121221' }}>
                {t.profile_pwdModalTitle}
              </h2>
              <p className="pwd-modal-desc" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                {pwdStep === 'email' && t.profile_pwdModalDesc}
                {pwdStep === 'otp' && `${t.auth_otpSentTo} ${user?.email}`}
                {pwdStep === 'password' && (language === 'en' ? 'Create your new password.' : 'Tạo mật khẩu mới của bạn.')}
              </p>
            </div>

            {pwdStep === 'email' && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <div className="notif-spinner" />
              </div>
            )}

            {pwdStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {otpInputs.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="otp-digit-profile"
                      style={{
                        width: 46, height: 54, borderRadius: 10,
                        background: isDark ? '#1c192b' : '#f9f9fb',
                        border: digit ? '2px solid #a855f7' : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e4e4e7',
                        color: isDark ? 'white' : '#121221',
                        boxShadow: digit ? '0 0 0 3px rgba(168,85,247,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', margin: 0 }}>
                  {t.auth_otpExpiry}
                </p>
                <button className="pwd-modal-btn" onClick={handleVerifyOtp} disabled={otpValue.length !== 6}
                  style={{
                    background: otpValue.length !== 6 ? (isDark ? '#2d2b3d' : '#e4e4e7') : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: otpValue.length !== 6 ? (isDark ? '#6b7280' : '#a1a1aa') : 'white',
                    cursor: otpValue.length !== 6 ? 'not-allowed' : 'pointer',
                    boxShadow: otpValue.length === 6 ? '0 4px 15px rgba(168,85,247,0.35)' : 'none',
                  }}>
                  {t.auth_verify}
                </button>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={handleResendOtp} disabled={resendTimer > 0 || pwdLoading}
                    style={{
                      background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer',
                      color: resendTimer > 0 ? (isDark ? '#6b7280' : '#a1a1aa') : '#a855f7',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                      padding: 0, fontFamily: 'var(--font)',
                    }}>
                    <RefreshCw size={13} />
                    {resendTimer > 0 ? `${t.auth_resendAfter} ${resendTimer}s` : t.auth_resendCode}
                  </button>
                </div>
              </div>
            )}

            {pwdStep === 'password' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={t.profile_pwdNewPassword}
                    style={{ ...modalInputStyle, paddingLeft: 40, paddingRight: 42 }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showNewPwd ? <Eye size={16} color="#a1a1aa" /> : <EyeOff size={16} color="#a1a1aa" />}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t.profile_pwdConfirm}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    style={{ ...modalInputStyle, paddingLeft: 40, paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showConfirmPwd ? <Eye size={16} color="#a1a1aa" /> : <EyeOff size={16} color="#a1a1aa" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p style={{ fontSize: 12, margin: 0, fontWeight: 500, color: newPassword === confirmPassword ? '#22c55e' : '#ef4444' }}>
                    {newPassword === confirmPassword
                      ? (language === 'en' ? '✓ Passwords match' : '✓ Mật khẩu khớp')
                      : (language === 'en' ? '✗ Passwords do not match' : '✗ Mật khẩu không khớp')}
                  </p>
                )}
                <button className="pwd-modal-btn" onClick={handleResetPassword}
                  disabled={pwdLoading || !newPassword || !confirmPassword}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: 'white', cursor: pwdLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 15px rgba(168,85,247,0.35)', marginTop: 4,
                  }}>
                  {pwdLoading ? '...' : t.auth_resetPassword}
                </button>
              </div>
            )}

            <button onClick={resetPwdState} className="pwd-modal-back" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
              ← {t.common_cancel}
            </button>
          </div>
        </div>
      )}

      {showLightbox && user?.avatar && (
        <div className="avatar-lightbox-overlay" onClick={() => setShowLightbox(false)}>
          <button className="avatar-lightbox-close" onClick={() => setShowLightbox(false)}>
            <X size={20} />
          </button>
          <img src={user.avatar} alt="avatar" className="avatar-lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
