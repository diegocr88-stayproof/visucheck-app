import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from './Logo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    // Pega sessão atual
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // Escuta mudanças de auth em tempo real
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '72px',
      background: 'rgba(244,246,249,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: scrolled ? '0 2px 24px rgba(11,45,82,0.1)' : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <Logo size="md" />

      {isHome && (
        <ul style={{
          display: 'flex', alignItems: 'center', gap: '36px',
          listStyle: 'none', margin: 0, padding: 0,
        }}>
          {[
            { label: 'Como funciona', href: '#features' },
            { label: 'Recursos', href: '#recursos' },
            { label: 'Planos', href: '#pricing' },
          ].map(item => (
            <li key={item.label}>
              <a href={item.href} style={{
                fontSize: '14px', fontWeight: 500,
                color: 'var(--muted)', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          // LOGADO — mostra avatar + menu
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 14px 6px 6px', borderRadius: '100px',
                background: 'white', border: '1.5px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--navy)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {/* Avatar */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--navy)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700,
              }}>
                {userInitial}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy)' }}>
                {userName.split(' ')[0]}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M2 4l4 4 4-4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'white', borderRadius: '14px', padding: '8px',
                boxShadow: '0 8px 32px rgba(11,45,82,0.15)',
                border: '1px solid var(--border)', minWidth: '200px',
                zIndex: 200, animation: 'fadeInUp 0.15s ease both',
              }}>
                {/* User info */}
                <div style={{ padding: '10px 12px 14px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>{userName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{user.email}</div>
                </div>

                {/* Menu items */}
                {[
                  { icon: '🏠', label: 'Dashboard', action: () => { navigate('/dashboard'); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
                    color: 'var(--navy)', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}

                {/* Logout */}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
                  <button onClick={handleLogout} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
                    color: '#C0392B', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FDECEA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span>🚪</span> Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // NÃO LOGADO — mostra botões de login
          <>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500,
                background: 'transparent', color: 'var(--navy)',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(11,45,82,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500,
                background: 'var(--navy)', color: 'white',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(11,45,82,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--navy-mid)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--navy)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Começar grátis
            </button>
          </>
        )}
      </div>

      {/* Fechar menu ao clicar fora */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  )
}