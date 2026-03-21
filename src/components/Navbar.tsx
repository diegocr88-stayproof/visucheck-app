import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from './Logo'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isHome = location.pathname === '/'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const initials = username.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: isHome ? 'rgba(11,45,82,0.97)' : 'white',
      borderBottom: isHome ? 'none' : '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Logo light={isHome} size="md" />

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav">
          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: isHome ? 'rgba(255,255,255,0.1)' : 'var(--cream)',
                border: isHome ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
                borderRadius: '100px', padding: '6px 16px 6px 6px', cursor: 'pointer',
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 500, color: isHome ? 'white' : 'var(--navy)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {username}
                </span>
                <span style={{ fontSize: '10px', color: isHome ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }}>▼</span>
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', top: '48px', right: 0, background: 'white', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(11,45,82,0.15)', padding: '8px', minWidth: '180px', zIndex: 200 }}>
                  <button onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: 'none', background: 'none', textAlign: 'left', fontSize: '14px', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏠 Dashboard
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: 'none', background: 'none', textAlign: 'left', fontSize: '14px', cursor: 'pointer', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/login')} style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, background: 'transparent', color: isHome ? 'white' : 'var(--navy)', border: isHome ? '1px solid rgba(255,255,255,0.3)' : '1.5px solid var(--border)', cursor: 'pointer' }}>
                Entrar
              </button>
              <button onClick={() => navigate('/login')} style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'var(--green)', color: 'var(--navy)', border: 'none', cursor: 'pointer' }}>
                Começar grátis
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px', borderRadius: '8px',
          color: isHome ? 'white' : 'var(--navy)', fontSize: '22px',
        }} className="mobile-menu-btn">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)' }}>{username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.email}</div>
                </div>
              </div>
              <button onClick={() => { navigate('/dashboard'); setMobileOpen(false) }} style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', background: 'var(--cream)', textAlign: 'left', fontSize: '15px', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏠 Dashboard
              </button>
              <button onClick={handleLogout} style={{ padding: '12px 16px', borderRadius: '10px', border: 'none', background: '#FDECEA', textAlign: 'left', fontSize: '15px', cursor: 'pointer', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🚪 Sair
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/login'); setMobileOpen(false) }} style={{ padding: '13px 16px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'transparent', fontSize: '15px', cursor: 'pointer', color: 'var(--navy)', fontWeight: 500 }}>
                Entrar
              </button>
              <button onClick={() => { navigate('/login'); setMobileOpen(false) }} style={{ padding: '13px 16px', borderRadius: '10px', border: 'none', background: 'var(--green)', fontSize: '15px', cursor: 'pointer', color: 'var(--navy)', fontWeight: 700 }}>
                Começar grátis
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  )
}