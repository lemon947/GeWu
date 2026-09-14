import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, MessageSquareText, ShieldCheck, X } from 'lucide-react'
import { useApp } from '../context/app-context'
import LogoMark from './LogoMark'

type LoginMode = 'password' | 'sms'
type ViewMode = 'login' | 'register'

export default function AuthDialog() {
  const { authOpen, authReturnTo, closeAuth, signIn } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('login')
  const [loginMode, setLoginMode] = useState<LoginMode>('password')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')

  const resetSensitiveFields = useCallback(() => {
    setPassword('')
    setConfirmPassword('')
    setSmsCode('')
    setShowPassword(false)
    setMessage('')
    setCountdown(0)
    setView('login')
    setLoginMode('password')
    setAgreed(false)
  }, [])

  const closeDialog = useCallback(() => {
    resetSensitiveFields()
    closeAuth()
    if (location.pathname === '/upload/form') {
      navigate('/upload')
      return
    }
    const protectedCorpusPage = location.pathname.startsWith('/search/results')
      || location.pathname.startsWith('/search/datasets/')
    if (protectedCorpusPage) navigate('/search')
  }, [closeAuth, location.pathname, navigate, resetSensitiveFields])

  useEffect(() => {
    if (!authOpen) return
    document.body.classList.add('modal-open')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [authOpen, closeDialog])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setInterval(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [countdown])

  if (!authOpen) return null

  const validateAgreement = () => {
    if (!agreed) {
      setMessage('请先阅读并勾选使用协议与隐私权限')
      return false
    }
    return true
  }

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (!account.trim()) return setMessage('请输入邮箱或手机号')
    if (loginMode === 'password' && !password) return setMessage('请输入密码')
    if (loginMode === 'sms' && smsCode.length !== 6) return setMessage('请输入6位验证码')
    if (!validateAgreement()) return
    const nextPath = authReturnTo
    resetSensitiveFields()
    signIn({ name: account.includes('@') ? account.split('@')[0] : '科学语料用户', account })
    if (nextPath) navigate(nextPath)
  }

  const submitRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (!account.trim()) return setMessage('请输入邮箱或手机号')
    if (password.length < 6) return setMessage('密码至少为6位')
    if (password !== confirmPassword) return setMessage('两次输入的密码不一致')
    if (!validateAgreement()) return
    const generatedName = username.trim() || `语料用户${Math.floor(1000 + Math.random() * 9000)}`
    const nextPath = authReturnTo
    resetSensitiveFields()
    signIn({ name: generatedName, account })
    if (nextPath) navigate(nextPath)
  }

  const requestCode = () => {
    setMessage('')
    if (!account.trim()) {
      setMessage('请先输入手机号或邮箱号')
      return
    }
    setCountdown(60)
    setMessage('演示验证码已发送，请输入任意6位数字')
  }

  return (
    <div className="auth-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeDialog()
    }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" className="auth-close" onClick={closeDialog} aria-label="关闭登录窗口">
          <X size={20} />
        </button>

        <aside className="auth-brand-panel">
          <div className="auth-brand-copy">
            <h2>AI for Science</h2>
            <p>聚集高质量科学语料，服务教学与科研创新</p>
          </div>
          <div className="auth-visual" role="img" aria-label="格物科学语料库标志">
            <LogoMark size={330} className="auth-logo-mark" />
          </div>
        </aside>

        <div className="auth-form-panel">
          {view === 'register' && (
            <button type="button" className="back-login" onClick={() => { setView('login'); setMessage('') }}>
              <ArrowLeft size={16} />返回登录
            </button>
          )}
          <div className="auth-title-group">
            <h1 id="auth-title">{view === 'login' ? '身份认证' : '用户注册'}</h1>
            {view === 'register' && <p>注册信息将用于平台服务与个人贡献记录</p>}
          </div>

          {view === 'login' ? (
            <form className="auth-form" onSubmit={submitLogin} autoComplete="off">
              <div className="login-tabs" role="tablist">
                <button type="button" className={loginMode === 'password' ? 'active' : ''} onClick={() => { setLoginMode('password'); setMessage('') }}>密码登录</button>
                <button type="button" className={loginMode === 'sms' ? 'active' : ''} onClick={() => { setLoginMode('sms'); setMessage('') }}>短信登录</button>
              </div>

              <label className="field-label">
                <span>账号</span>
                <span className="field-control">
                  <Mail size={18} />
                  <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder={loginMode === 'password' ? '邮箱/手机号' : '请输入手机号/邮箱号'} autoComplete="username" />
                </span>
              </label>

              {loginMode === 'password' ? (
                <label className="field-label">
                  <span>密码</span>
                  <span className="field-control">
                    <LockKeyhole size={18} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" autoComplete="off" />
                    <button type="button" className="field-icon-button" onClick={() => setShowPassword((value) => !value)} aria-label="显示或隐藏密码">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
              ) : (
                <label className="field-label">
                  <span>验证码</span>
                  <span className="field-control code-control">
                    <MessageSquareText size={18} />
                    <input value={smsCode} onChange={(event) => setSmsCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="请输入6位短信验证码" inputMode="numeric" />
                    <button type="button" className="code-button" disabled={countdown > 0} onClick={requestCode}>{countdown > 0 ? `${countdown}s后重试` : '获取验证码'}</button>
                  </span>
                </label>
              )}

              {message && <p className="auth-message">{message}</p>}
              <button type="submit" className="auth-submit">登录</button>
              <div className="form-assists">
                {loginMode === 'password' ? <button type="button" className="text-link muted">忘记密码？</button> : <span />}
                <button type="button" className="text-link" onClick={() => { setView('register'); setMessage('') }}>注册</button>
              </div>
              <Agreement agreed={agreed} onToggle={() => setAgreed((value) => !value)} action="登录" />
            </form>
          ) : (
            <form className="auth-form register-form" onSubmit={submitRegister}>
              <label className="field-label"><span>邮箱/手机号 <b>*</b></span><span className="field-control"><Mail size={18} /><input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="请输入邮箱或手机号" autoComplete="username" /></span></label>
              <label className="field-label"><span>密码 <b>*</b></span><span className="field-control"><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少6位密码" autoComplete="new-password" /></span></label>
              <label className="field-label"><span>确认密码 <b>*</b></span><span className="field-control"><LockKeyhole size={18} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="请再次输入密码" autoComplete="new-password" /></span></label>
              <label className="field-label"><span>用户名</span><span className="field-control"><Mail size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="可不填，系统将自动生成" /></span><small>用户名需保持唯一</small></label>
              <Agreement agreed={agreed} onToggle={() => setAgreed((value) => !value)} action="注册" />
              {message && <p className="auth-message">{message}</p>}
              <button type="submit" className="auth-submit">注册并登录</button>
            </form>
          )}

          <p className="security-notice"><ShieldCheck size={18} />本平台为内部科研信息管理平台，严禁处理、传输国家秘密</p>
          <div className="auth-footer-links"><button type="button">登录遇到问题？联系我们</button></div>
        </div>
      </section>
    </div>
  )
}

function Agreement({ agreed, onToggle, action }: { agreed: boolean; onToggle: () => void; action: '登录' | '注册' }) {
  return (
    <div className="agreement-row">
      <button type="button" className={`agreement-check${agreed ? ' checked' : ''}`} onClick={onToggle} aria-label="同意协议">{agreed && <Check size={13} />}</button>
      <p>{action}即代表同意格物-科学语料库<a href="#agreement">《使用协议》</a><a href="#privacy">《隐私权限》</a></p>
    </div>
  )
}
