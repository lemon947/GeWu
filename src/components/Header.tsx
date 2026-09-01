import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react'
import LogoMark from './LogoMark'
import { useApp } from '../context/app-context'

const navItems = [
  { label: '首页', to: '/' },
  { label: '语料检索', to: '/search' },
  { label: '语料上传', to: '/upload' },
  { label: '需求广场', to: '/demands' },
  { label: '工具链', to: '/tools' },
  { label: '关于我们', to: '/about' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, openAuth, signOut } = useApp()

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="格物·科学语料库首页">
          <LogoMark size={44} />
          <span className="brand-copy">
            <strong>格物 · 科学语料库</strong>
            <small>科学语料共建共享平台</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="user-trigger"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-expanded={userMenuOpen}
              >
                <span className="user-avatar">{user.name.slice(0, 1)}</span>
                <span>{user.name}</span>
                <ChevronDown size={15} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <button type="button" onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}>
                    <UserRound size={16} />个人主页
                  </button>
                  <button type="button" onClick={() => { signOut(); setUserMenuOpen(false) }}>
                    <LogOut size={16} />退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="login-trigger" onClick={() => openAuth()}>
              <UserRound size={17} />登录
            </button>
          )}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="展开导航"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav" aria-label="移动端导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
